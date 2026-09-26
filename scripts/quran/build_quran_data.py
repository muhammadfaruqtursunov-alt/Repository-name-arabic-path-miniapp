# -*- coding: utf-8 -*-
"""Build the static data for the Quran words trainer (public/quran/).

One lesson = one page of the Madinah mushaf (604 pages). A "word" to learn is
a LEMMA (prefixes such as و ب ل ف ال and pronoun endings are explained once,
separately), so a learned word is never taught again on later pages.

Sources (all credited on the in-app sources screen):
  * Quranic Arabic Corpus v0.4 morphology — corpus.quran.com (GNU GPL, source
    must be credited and linked). Read from the github mirror
    mustafa0x/quran-morphology (same v0.4 file).
  * Quran.com API v4 — mushaf page / line / juz / hizb of every word,
    English word-by-word translation, transliteration, word audio.
  * SakinaDevGroup/quran-word-by-word-russian — Russian word-by-word.

Run:  py scripts/quran/build_quran_data.py
Raw downloads are cached in scripts/quran/.cache/ (git-ignored).
Output:
  public/quran/index.json      surahs, juz / hizb start pages, page -> juz/hizb/surahs
  public/quran/lexicon.json    lemmas (id = order of first appearance) + affix list
  public/quran/pages/NNN.json  words of one mushaf page
  scripts/quran/.cache/lemma_contexts.json  input for writing lemma meanings
"""
import io
import json
import os
import re
import socket
import sys
import time
import urllib.request
import zipfile
from collections import OrderedDict, defaultdict
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8")

# Force IPv4: on some networks Python tries IPv6 first and waits ~60 s for a
# timeout on every request (curl falls back instantly).
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only(host, port, family=0, *args, **kwargs):
    return _orig_getaddrinfo(host, port, socket.AF_INET, *args, **kwargs)


socket.getaddrinfo = _ipv4_only

ROOT =os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, "scripts", "quran", ".cache")
OUT = os.path.join(ROOT, "public", "quran")
PAGES_OUT = os.path.join(OUT, "pages")

MORPH_URL = "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt"
RU_WBW_URL = ("https://github.com/SakinaDevGroup/quran-word-by-word-russian/"
              "releases/download/v1.0/quran.word.by.word.russian.zip")
QC_PAGE_URL = ("https://api.quran.com/api/v4/verses/by_page/{page}?words=true"
               "&word_fields=text_uthmani,location&per_page=50&page={n}")
QC_CHAPTERS_URL = "https://api.quran.com/api/v4/chapters?language=en"

TOTAL_PAGES = 604
PGN_RE = re.compile(r"^[123][MF]?[SDP]$")
TRAIL_PUNCT = " ,.;:!?«»\"'“”()"


# ── download helpers ─────────────────────────────────────────────────
def fetch(url: str, retries: int = 4) -> bytes:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ArabicPath-build/1.0"})
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:  # noqa: BLE001 — network flakiness, retry
            if attempt == retries - 1:
                raise RuntimeError(f"download failed: {url}: {e}") from e
            time.sleep(1.5 * (attempt + 1))
    raise AssertionError("unreachable")


def cached(name: str, url: str) -> bytes:
    path = os.path.join(CACHE, name)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return f.read()
    data = fetch(url)
    with open(path, "wb") as f:
        f.write(data)
    return data


def cached_json(name: str, url: str):
    return json.loads(cached(name, url).decode("utf-8-sig"))


# ── 1. morphology: prefixes / lemma / root / pronoun suffixes per word ──
def load_morphology():
    raw = cached("quran-morphology.txt", MORPH_URL).decode("utf-8")
    words = OrderedDict()
    for line in raw.splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        loc, form, tag, feats = line.split("\t")
        s, a, w, _k = map(int, loc.split(":"))
        words.setdefault((s, a, w), []).append((form, tag, feats.split("|")))

    def feat(fs, key):
        for f in fs:
            if f.startswith(key + ":"):
                return f[len(key) + 1:]
        return None

    out = {}
    for key, segs in words.items():
        prefixes, suffixes, stem = [], [], None
        for form, tag, fs in segs:
            if "PREF" in fs:
                if stem is None:
                    prefixes.append(f"{fs[0]}:{feat(fs, 'LEM') or form}")
                continue
            if stem is None and feat(fs, "LEM") is not None:
                stem = (form, tag, fs)
                continue
            if stem is not None and "PRON" in fs:
                pgn = next((f for f in fs if PGN_RE.match(f)), None)
                if pgn:
                    suffixes.append(pgn)
        if stem is None:  # should not happen; keep the word learnable anyway
            stem = segs[0]
        form, tag, fs = stem
        fine = "PN" if "PN" in fs else "ADJ" if "ADJ" in fs else (
            fs[0] if not fs[0].startswith(("ROOT:", "LEM:")) else tag)
        out[key] = {
            "lemma": feat(fs, "LEM") or form,
            "root": feat(fs, "ROOT") or "",
            "pos": fine,
            "pre": prefixes,
            "suf": suffixes,
        }
    return out


# ── 2. Russian word-by-word ─────────────────────────────────────────
def load_russian():
    z = zipfile.ZipFile(io.BytesIO(cached("ru_wbw.zip", RU_WBW_URL)))
    data = json.loads(z.read("quran_wbw_ru.json").decode("utf-8-sig"))
    ru = {}
    for w in data:
        if w.get("char_type") != "word":
            continue
        s, a, p = map(int, w["location"].split(":"))
        ru[(s, a, p)] = "" if w.get("is_fallback") else w["translation"].strip(TRAIL_PUNCT)
    return ru


# ── 3. Quran.com: every verse of every page ─────────────────────────
def load_page_verses(page: int):
    verses, n = [], 1
    while True:
        d = cached_json(f"qc_page_{page:03d}_{n}.json", QC_PAGE_URL.format(page=page, n=n))
        verses += d["verses"]
        nxt = (d.get("pagination") or {}).get("next_page")
        if not nxt:
            return verses
        n = nxt


def load_all_verses():
    with ThreadPoolExecutor(6) as pool:
        per_page = list(pool.map(load_page_verses, range(1, TOTAL_PAGES + 1)))
    verses = {}
    for vs in per_page:
        for v in vs:
            verses.setdefault(v["verse_key"], v)
    return verses


def clean(s):
    return (s or "").strip()


def main():
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(PAGES_OUT, exist_ok=True)

    morph = load_morphology()
    ru = load_russian()
    verses = load_all_verses()
    chapters = cached_json("qc_chapters_en.json", QC_CHAPTERS_URL)["chapters"]
    print(f"morphology words: {len(morph)}  ru words: {len(ru)}  verses: {len(verses)}  chapters: {len(chapters)}")

    def vkey(k):
        s, a = map(int, k.split(":"))
        return (s, a)

    lemma_ids, lemmas = {}, []          # lemma string -> id; id -> [ar, root, pos, count, first_loc]
    affix_ids, affixes = {}, []         # "PRE:DET:ال" / "SUF:3MP" -> id
    contexts = defaultdict(list)        # lemma id -> [(en, ru, loc)]
    pages = defaultdict(list)           # page -> [ayah fragments]
    page_meta = {}                      # page -> (juz, hizb)
    errors = []
    word_total = 0

    def affix_id(key):
        if key not in affix_ids:
            affix_ids[key] = len(affixes)
            affixes.append(key.split(":"))
        return affix_ids[key]

    for vk in sorted(verses, key=vkey):
        v = verses[vk]
        s, a = vkey(vk)
        words = [w for w in v["words"] if w["char_type_name"] == "word"]
        for w in words:
            pos_ = w["position"]
            m = morph.get((s, a, pos_))
            if m is None:
                errors.append(f"no morphology for {s}:{a}:{pos_}")
                continue
            word_total += 1
            lem = m["lemma"]
            if lem not in lemma_ids:
                lemma_ids[lem] = len(lemmas)
                lemmas.append([lem, m["root"], m["pos"], 0, f"{s}:{a}:{pos_}"])
            lid = lemma_ids[lem]
            lemmas[lid][3] += 1
            en = clean((w.get("translation") or {}).get("text"))
            ru_t = ru.get((s, a, pos_), "")
            if len(contexts[lid]) < 4 and (en, ru_t) not in [(c[0], c[1]) for c in contexts[lid]]:
                contexts[lid].append((en, ru_t, f"{s}:{a}:{pos_}"))
            page = w["page_number"]
            page_meta.setdefault(page, (v["juz_number"], v["hizb_number"]))
            frags = pages[page]
            if not frags or frags[-1]["k"] != vk:
                frags.append({"k": vk, "f": pos_, "w": []})
            frags[-1]["w"].append([
                clean(w["text_uthmani"]),
                lid,
                [affix_id("PRE:" + p) for p in m["pre"]],
                [affix_id("SUF:" + x) for x in m["suf"]],
                en,
                ru_t,
                clean((w.get("transliteration") or {}).get("text")),
            ])

    # per-ayah word-count check against the corpus
    corpus_counts = defaultdict(int)
    for (s, a, _w) in morph:
        corpus_counts[(s, a)] += 1
    for vk, v in verses.items():
        n_qc = sum(1 for w in v["words"] if w["char_type_name"] == "word")
        if n_qc != corpus_counts[vkey(vk)]:
            errors.append(f"word count differs at {vk}: quran.com {n_qc} vs corpus {corpus_counts[vkey(vk)]}")

    # ── write pages ──
    for p in range(1, TOTAL_PAGES + 1):
        frags = pages.get(p)
        if not frags:
            errors.append(f"empty page {p}")
            continue
        for fr in frags:
            if fr["f"] == 1:
                del fr["f"]           # default: fragment starts at word 1
        juz, hizb = page_meta[p]
        with open(os.path.join(PAGES_OUT, f"{p:03d}.json"), "w", encoding="utf-8") as f:
            json.dump({"p": p, "juz": juz, "hizb": hizb, "a": frags}, f, ensure_ascii=False, separators=(",", ":"))

    # ── index ──
    page_surahs = {p: sorted({int(fr["k"].split(":")[0]) for fr in pages[p]}) for p in pages}
    juz_start, hizb_start = {}, {}
    for p in range(1, TOTAL_PAGES + 1):
        juz, hizb = page_meta[p]
        juz_start.setdefault(juz, p)
        hizb_start.setdefault(hizb, p)
    index = {
        "v": 1,
        "surahs": [{
            "n": c["id"], "ar": c["name_arabic"], "en": c["name_simple"],
            "meaning_en": c["translated_name"]["name"], "ayahs": c["verses_count"],
            "pages": c["pages"], "place": c["revelation_place"],
        } for c in chapters],
        "juz": [{"n": j, "page": juz_start[j]} for j in sorted(juz_start)],
        "hizb": [{"n": h, "page": hizb_start[h]} for h in sorted(hizb_start)],
        "pages": [[page_meta[p][0], page_meta[p][1], page_surahs[p]] for p in range(1, TOTAL_PAGES + 1)],
    }
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

    lexicon = {"v": 1, "fields": ["ar", "root", "pos", "count", "first"], "lemmas": lemmas, "affixes": affixes}
    with open(os.path.join(OUT, "lexicon.json"), "w", encoding="utf-8") as f:
        json.dump(lexicon, f, ensure_ascii=False, separators=(",", ":"))

    ctx = [{"id": i, "ar": l[0], "root": l[1], "pos": l[2], "count": l[3],
            "contexts": [{"en": c[0], "ru": c[1], "loc": c[2]} for c in contexts[i]]}
           for i, l in enumerate(lemmas)]
    with open(os.path.join(CACHE, "lemma_contexts.json"), "w", encoding="utf-8") as f:
        json.dump(ctx, f, ensure_ascii=False, indent=0)

    # ── report ──
    print(f"words: {word_total}  lemmas: {len(lemmas)}  affixes: {len(affixes)}  pages: {len(pages)}  "
          f"juz: {len(juz_start)}  hizb: {len(hizb_start)}")
    print("affixes:", [":".join(x) for x in affixes])
    print("errors:", len(errors))
    for e in errors[:30]:
        print("  ", e)
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())

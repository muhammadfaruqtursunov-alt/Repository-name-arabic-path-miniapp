# -*- coding: utf-8 -*-
"""Short ayah translations + Tafsir as-Sa'di, split per mushaf page.

Translations (all from the Rowwad Translation Center's QuranEnc.com project,
Ahl as-Sunnah wal-Jama'ah aqeedah; the app credits quranenc.com):
    ru  russian_rwwad      Rowwad, Russian
    tj  tajik_arifi        Rowwad, Tajik
    uz  uzbek_mansour      Alauddin Mansour (Cyrillic on QuranEnc -> Latin here)
    en  english_saheeh     Saheeh International
Tafsir (Quran.com API resources):
    ru  170 «Тафсир ас-Саади» (Russian)
    ar  91  «تفسير السعدي»

Run:  py scripts/quran/build_ayah_texts.py
Output: public/quran/trans/{ru,tj,uz,en}/NNN.json   {"2:255": "text", ...}
        public/quran/tafsir/{ru,ar}/NNN.json        {"2:255": "text", ...}
"""
import html
import json
import os
import re
import socket
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8")
_orig = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, *a, **k: _orig(h, p, socket.AF_INET, *a, **k)  # IPv4 (see build_quran_data.py)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, ".cache", "ayah")
PUB = os.path.join(ROOT, "public", "quran")

TRANS = {"ru": "russian_rwwad", "tj": "tajik_arifi", "uz": "uzbek_mansour", "en": "english_saheeh"}
TAFSIR = {"ru": 170, "ar": 91}
QE_URL = "https://quranenc.com/api/v1/translation/sura/{key}/{n}"
TF_URL = "https://api.quran.com/api/v4/tafsirs/{id}/by_chapter/{n}?per_page=300&page={page}"


def fetch_json(url: str, cache_name: str):
    path = os.path.join(CACHE, cache_name)
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ArabicPath-build/1.0"})
            raw = urllib.request.urlopen(req, timeout=90).read().decode("utf-8")
            data = json.loads(raw)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            return data
        except Exception as e:  # noqa: BLE001 — flaky network, retry
            if attempt == 4:
                raise RuntimeError(f"{url}: {e}") from e
            time.sleep(1.5 * (attempt + 1))


# ── Uzbek Cyrillic -> Latin (1995 orthography; ʻ = U+02BB, ʼ = U+02BC) ──
_UZ = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "x", "ц": "ts", "ч": "ch", "ш": "sh", "ъ": "ʼ", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "ё": "yo", "ў": "oʻ", "қ": "q", "ғ": "gʻ", "ҳ": "h",
}
_UZ_VOWELS = set("аеёиоуэюяўАЕЁИОУЭЮЯЎ")


def uz_latin(text: str) -> str:
    out = []
    for i, ch in enumerate(text):
        low = ch.lower()
        if low == "е":
            prev = text[i - 1] if i else " "
            lat = "ye" if (not prev.isalpha() or prev in _UZ_VOWELS or prev in "ъЪ") else "e"
        elif low in _UZ:
            lat = _UZ[low]
        else:
            out.append(ch)
            continue
        out.append(lat.capitalize() if ch != low and lat else lat)
    return "".join(out)


FOOTNOTE = re.compile(r"\s*\[\d+\]")


def clean_translation(lang: str, text: str) -> str:
    t = FOOTNOTE.sub("", text or "")
    t = re.sub(r"^\s*\d+\.\s*", "", t)              # "2. Text" numbering
    t = " ".join(t.split())
    return uz_latin(t) if lang == "uz" else t


BLOCK = re.compile(r"</(p|div|h\d|li)>|<br\s*/?>", re.I)


def clean_tafsir(raw: str) -> str:
    t = BLOCK.sub("\n", raw or "")
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    lines = [" ".join(l.split()) for l in t.split("\n")]
    return "\n".join(l for l in lines if l)


def fetch_translation(args):
    lang, n = args
    d = fetch_json(QE_URL.format(key=TRANS[lang], n=n), f"{TRANS[lang]}_{n:03d}.json")
    return lang, n, {f"{n}:{int(x['aya'])}": clean_translation(lang, x["translation"]) for x in d["result"]}


def fetch_tafsir(args):
    lang, n = args
    out, page = {}, 1
    while page:
        d = fetch_json(TF_URL.format(id=TAFSIR[lang], n=n, page=page), f"tafsir_{lang}_{n:03d}_{page}.json")
        for x in d["tafsirs"]:
            out[x["verse_key"]] = clean_tafsir(x["text"])
        page = (d.get("pagination") or {}).get("next_page")
    return lang, n, out


def main() -> int:
    os.makedirs(CACHE, exist_ok=True)
    jobs_t = [(l, n) for l in TRANS for n in range(1, 115)]
    jobs_f = [(l, n) for l in TAFSIR for n in range(1, 115)]
    trans = {l: {} for l in TRANS}
    tafsir = {l: {} for l in TAFSIR}
    with ThreadPoolExecutor(6) as pool:
        for lang, _n, d in pool.map(fetch_translation, jobs_t):
            trans[lang].update(d)
        print("translations fetched:", {l: len(v) for l, v in trans.items()})
        for lang, _n, d in pool.map(fetch_tafsir, jobs_f):
            tafsir[lang].update(d)
        print("tafsir fetched:", {l: len(v) for l, v in tafsir.items()})

    # as-Sa'di comments on groups of ayahs: the text sits on the first ayah of the
    # group and the following ayahs are empty — show the group's text for them too.
    def ayah_order(k):
        s, a = map(int, k.split(":"))
        return (s, a)
    for lang in TAFSIR:
        last_surah, last_text, filled = 0, "", 0
        for k in sorted(trans["ru"], key=ayah_order):
            s = ayah_order(k)[0]
            if s != last_surah:
                last_surah, last_text = s, ""
            if tafsir[lang].get(k):
                last_text = tafsir[lang][k]
            elif last_text:
                tafsir[lang][k] = last_text
                filled += 1
        print(f"tafsir {lang}: filled {filled} ayahs from their group's first ayah")

    missing = {l: 0 for l in list(TRANS) + ["tafsir_" + t for t in TAFSIR]}
    size = {}
    for p in range(1, 605):
        page = json.load(open(os.path.join(PUB, "pages", f"{p:03d}.json"), encoding="utf-8"))
        keys = sorted({fr["k"] for fr in page["a"]}, key=lambda k: tuple(map(int, k.split(":"))))
        for lang in TRANS:
            d = {k: trans[lang].get(k, "") for k in keys}
            missing[lang] += sum(1 for v in d.values() if not v)
            _write(os.path.join(PUB, "trans", lang), p, d, size, f"trans_{lang}")
        for lang in TAFSIR:
            d = {k: tafsir[lang].get(k, "") for k in keys if tafsir[lang].get(k)}
            missing["tafsir_" + lang] += len(keys) - len(d)
            _write(os.path.join(PUB, "tafsir", lang), p, d, size, f"tafsir_{lang}")
    print("empty ayah slots:", missing)
    print("sizes (MB):", {k: round(v / 1e6, 2) for k, v in size.items()})
    return 0


def _write(folder, p, data, size, tag):
    os.makedirs(folder, exist_ok=True)
    s = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(folder, f"{p:03d}.json"), "w", encoding="utf-8") as f:
        f.write(s)
    size[tag] = size.get(tag, 0) + len(s.encode("utf-8"))


if __name__ == "__main__":
    sys.exit(main())

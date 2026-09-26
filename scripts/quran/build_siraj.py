# -*- coding: utf-8 -*-
"""Build the «ас-Сирадж» layer: explanations of difficult Quran words.

Source: «السراج في بيان غريب القرآن» — Dr. Muhammad al-Khudairi, text from
al-Maktaba al-Shamila (shamela.ws/book/14531). Credited in the app.

Each book entry is «(ayah) ... {phrase} ... explanation». We attach it to the
exact words of that ayah in the mushaf data (public/quran/pages). The book
uses standard spelling and the mushaf uses Uthmani spelling (صلاة / صلوة),
so words are compared by their consonant "skeleton".

Run:  py scripts/quran/build_siraj.py     (downloads are cached, polite delay)
Output: public/quran/siraj/NNN.json for every mushaf page:
        [[fi, wi, len, phrase, explanation_ar], ...]   wi = -1 → whole ayah
"""
import difflib
import html
import json
import os
import re
import socket
import sys
import time
import urllib.request
from collections import defaultdict

sys.stdout.reconfigure(encoding="utf-8")
_orig = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, *a, **k: _orig(h, p, socket.AF_INET, *a, **k)  # IPv4 (see build_quran_data.py)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, ".cache", "siraj")
PAGES = os.path.join(ROOT, "public", "quran", "pages")
OUT = os.path.join(ROOT, "public", "quran", "siraj")
BOOK_URL = "https://shamela.ws/book/14531/{n}"
BOOK_PAGES = 428

DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
MARKS = re.compile(r"[ً-ٰٟۖ-ۭـ]")      # harakat, dagger alif, Quranic marks, tatweel
PARA = re.compile(r"<p>(.*?)</p>", re.S)
TAG = re.compile(r"<[^>]+>")
HEADING = re.compile(r"ترتيبها\s*([٠-٩\d]+)")
ENTRY = re.compile(r"\(([٠-٩\d]+)\)\s*\.\.\.\s*\{([^}]+)\}\s*\.\.\.\s*(.+)", re.S)


def fetch_page(n: int) -> str:
    path = os.path.join(CACHE, f"{n:03d}.html")
    if os.path.exists(path):
        return open(path, encoding="utf-8").read()
    for attempt in range(4):
        try:
            req = urllib.request.Request(BOOK_URL.format(n=n), headers={"User-Agent": "Mozilla/5.0 ArabicPath-build"})
            data = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
            with open(path, "w", encoding="utf-8") as f:
                f.write(data)
            time.sleep(0.6)            # be polite to the library
            return data
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise RuntimeError(f"shamela page {n}: {e}") from e
            time.sleep(2 * (attempt + 1))
    raise AssertionError


def skeleton(word: str) -> str:
    """Consonant skeleton: no marks, unified alif/hamza/ya, long vowels dropped."""
    w = MARKS.sub("", word)
    w = w.translate(str.maketrans({"ٱ": "ا", "أ": "ا", "إ": "ا", "آ": "ا", "ى": "ي", "ة": "ه", "ؤ": "ء", "ئ": "ء"}))
    w = re.sub(r"[^ء-ي]", "", w)
    return re.sub(r"[اوي]", "", w) or w


def parse_book():
    entries, surah = [], 0
    for n in range(1, BOOK_PAGES + 1):
        raw = fetch_page(n)
        m = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', raw, re.S)
        if not m:
            continue
        for p in PARA.findall(m.group(1)):
            text = html.unescape(TAG.sub("", p)).strip()
            h = HEADING.search(text)
            if h:
                surah = int(h.group(1).translate(DIGITS))
                continue
            e = ENTRY.match(text)
            if e and surah:
                entries.append((surah, int(e.group(1).translate(DIGITS)), e.group(2).strip(), " ".join(e.group(3).split())))
    return entries


def load_mushaf():
    """verse key -> list of (page, fi, wi, skeleton)."""
    words = defaultdict(list)
    for p in range(1, 605):
        data = json.load(open(os.path.join(PAGES, f"{p:03d}.json"), encoding="utf-8"))
        for fi, fr in enumerate(data["a"]):
            for wi, w in enumerate(fr["w"]):
                words[fr["k"]].append((p, fi, wi, skeleton(w[0])))
    return words


def locate(ayah_words, phrase):
    """Best matching run of words for the phrase; returns (index, length, score)."""
    target = [skeleton(x) for x in phrase.split() if skeleton(x)]
    if not target or not ayah_words:
        return None
    k = min(len(target), len(ayah_words))
    joined_t = " ".join(target)
    best = (0.0, 0)
    for i in range(0, len(ayah_words) - k + 1):
        cand = " ".join(w[3] for w in ayah_words[i:i + k])
        score = difflib.SequenceMatcher(None, joined_t, cand).ratio()
        if score > best[0]:
            best = (score, i)
    return best[1], k, best[0]


def main() -> int:
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    entries = parse_book()
    mushaf = load_mushaf()
    per_page = defaultdict(list)
    matched = ayah_level = missing = 0
    for s, a, phrase, expl in entries:
        aw = mushaf.get(f"{s}:{a}")
        if not aw:
            missing += 1
            continue
        loc = locate(aw, phrase)
        if loc and loc[2] >= 0.6:
            i, k, _ = loc
            p, fi, wi, _sk = aw[i]
            per_page[p].append([fi, wi, k, phrase, expl])
            matched += 1
        else:
            p, fi, _wi, _sk = aw[0]
            per_page[p].append([fi, -1, 0, phrase, expl])
            ayah_level += 1
    for p in range(1, 605):
        with open(os.path.join(OUT, f"{p:03d}.json"), "w", encoding="utf-8") as f:
            json.dump(per_page.get(p, []), f, ensure_ascii=False, separators=(",", ":"))
    print(f"book entries: {len(entries)}  matched to words: {matched}  ayah-level: {ayah_level}  "
          f"bad ayah ref: {missing}  pages with entries: {len(per_page)}")
    surahs = sorted({e[0] for e in entries})
    print("surahs covered:", len(surahs), "first/last:", surahs[:3], surahs[-3:])
    return 0


if __name__ == "__main__":
    sys.exit(main())

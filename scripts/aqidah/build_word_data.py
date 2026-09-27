# -*- coding: utf-8 -*-
"""Строит словарь слов для тренажёра "Акида" (тап по слову -> перевод):
берёт короткие переводы слов из уже собранного корпуса Корана (public/quran/pages/*.json)
там, где формы совпадают, а для остальных использует scripts/aqidah/manual_glosses.json.
Выход: public/aqidah/lexicon.json — [[normKey, arDisplay, ruGloss], ...] (id = индекс).
"""
import json
import os
import re
import glob
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUBLIC = os.path.join(ROOT, "public")

DIACRITICS_RE = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]")
TOKEN_RE = re.compile(r"[ؐ-ؚء-ٰٟۖ-ۭ࣓-ࣿ]+")
ALEF_MAP = str.maketrans("إأآٱ", "اااا")


def strip_diacritics(s: str) -> str:
    return DIACRITICS_RE.sub("", s).replace("ـ", "")


def norm(w: str) -> str:
    w = strip_diacritics(w)
    w = w.translate(ALEF_MAP)
    w = w.replace("ى", "ي").replace("ة", "ه")
    return w


def build_quran_surface_gloss():
    """normKey -> самый частый краткий перевод слова во всём Коране."""
    surface_gloss = defaultdict(Counter)
    for fp in glob.glob(os.path.join(PUBLIC, "quran", "pages", "*.json")):
        d = json.load(open(fp, encoding="utf-8"))
        for ayah in d["a"]:
            for w in ayah["w"]:
                text, _lid, _pre, _suf, _en, ru, _tr = w
                surface_gloss[norm(text)][ru] += 1
    return {k: v.most_common(1)[0][0] for k, v in surface_gloss.items()}


def aqidah_words():
    """normKey -> (Counter of display forms, total count), в порядке первого появления."""
    order = []
    display = defaultdict(Counter)
    for name in ("usul_ru.json", "qawaid_ru.json"):
        data = json.load(open(os.path.join(HERE, name), encoding="utf-8"))
        for lesson in data["lessons"]:
            for pt in lesson["points"]:
                for tok in TOKEN_RE.findall(pt["ar"]):
                    n = norm(tok)
                    if len(n) < 2:
                        continue
                    if n not in display:
                        order.append(n)
                    display[n][tok] += 1
    return order, display


def main():
    quran_gloss = build_quran_surface_gloss()
    manual_gloss = json.load(open(os.path.join(HERE, "manual_glosses.json"), encoding="utf-8"))
    order, display = aqidah_words()

    lexicon = []
    missing = []
    for n in order:
        gloss = manual_gloss.get(n) or quran_gloss.get(n)
        if not gloss:
            missing.append(n)
            gloss = "?"
        ar_display = display[n].most_common(1)[0][0]
        lexicon.append([n, ar_display, gloss])

    out_dir = os.path.join(PUBLIC, "aqidah")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "lexicon.json"), "w", encoding="utf-8") as f:
        json.dump(lexicon, f, ensure_ascii=False)

    print(f"lexicon size: {len(lexicon)}")
    print(f"missing glosses: {len(missing)}")
    if missing:
        print(missing[:50])


if __name__ == "__main__":
    main()

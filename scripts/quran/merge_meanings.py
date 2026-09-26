# -*- coding: utf-8 -*-
"""Merge lemma meanings + affix explanations + surah names into public/quran.

Inputs:
  public/quran/lexicon.json                   lemma / affix order (from build_quran_data.py)
  scripts/quran/.cache/tr/mean_NN.json        lemma meanings {id: {tj, ru, uz, en}} written by translators
  scripts/quran/texts.py                      affix explanations, ru / uz surah names
  scripts/quran/.cache/quran_metadata.zip     Tajik surah names (SakinaDevGroup)
  scripts/quran/.cache/qc_chapters_en.json    English surah names (Quran.com)
Outputs:
  public/quran/meanings/{tj,ru,uz,en}.json    {"v", "reviewed", "lemmas": [...], "affixes": [...]}
  public/quran/surah_names.json               {"ru": [...114], "uz": [...], "tj": [...], "en": [...]}

Run:  py scripts/quran/merge_meanings.py            (fails on any missing / invalid meaning)
      py scripts/quran/merge_meanings.py --partial  (missing meanings become "")
"""
import glob
import io
import json
import os
import re
import sys
import zipfile

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import texts  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(ROOT, "public", "quran")
CACHE = os.path.join(HERE, ".cache")
LANGS = ("tj", "ru", "uz", "en")

CYR = re.compile(r"[Ѐ-ӿ]")
ARAB = re.compile(r"[؀-ۿ]")
LAT = re.compile(r"[A-Za-z]")

# Corrections after review: lemma id -> {lang: text}
OVERRIDES: dict = {}


def uz(s: str) -> str:
    return s.replace("^", "ʻ").replace("~", "ʼ")


def problems_for(lang: str, text: str) -> list:
    out = []
    if not text.strip():
        return ["empty"]
    if ARAB.search(text):
        out.append("arabic script")
    if ";" in text:
        out.append("semicolon")
    if text != text.strip() or text.endswith("."):
        out.append("whitespace/trailing period")
    if lang in ("uz", "en") and CYR.search(text):
        out.append("cyrillic in latin language")
    if lang in ("tj", "ru") and LAT.search(text) and not CYR.search(text):
        out.append("latin only in cyrillic language")
    if lang == "uz" and re.search(r"[`'‘’]", text):
        out.append("uzbek apostrophe must be ʻ or ʼ")
    return out


def main() -> int:
    partial = "--partial" in sys.argv
    lex = json.load(open(os.path.join(PUB, "lexicon.json"), encoding="utf-8"))
    n_lem = len(lex["lemmas"])
    affix_keys = [":".join(a) for a in lex["affixes"]]

    merged = {}
    for path in sorted(glob.glob(os.path.join(CACHE, "tr", "mean_*.json"))):
        part = json.load(open(path, encoding="utf-8"))
        dup = set(part) & set(merged)
        if dup:
            print(f"duplicate ids in {os.path.basename(path)}: {sorted(dup)[:5]}")
        merged.update(part)
    for lid, fix in OVERRIDES.items():
        merged.setdefault(str(lid), {}).update(fix)

    missing = [i for i in range(n_lem) if str(i) not in merged]
    bad = []
    for lid, m in merged.items():
        for lang in LANGS:
            for p in problems_for(lang, m.get(lang, "")):
                bad.append((lid, lang, p, m.get(lang, "")))
    print(f"lemmas: {n_lem}  with meanings: {n_lem - len(missing)}  missing: {len(missing)}  problems: {len(bad)}")
    for b in bad[:40]:
        print("  ", b)
    if (missing or bad) and not partial:
        print("Refusing to write: fix problems or run with --partial")
        return 1

    missing_affix = [k for k in affix_keys if k not in texts.AFFIXES]
    if missing_affix:
        print("affix explanations missing for:", missing_affix)
        return 1

    os.makedirs(os.path.join(PUB, "meanings"), exist_ok=True)
    for li, lang in enumerate(LANGS):
        col = {"ru": 0, "tj": 1, "uz": 2, "en": 3}[lang]
        doc = {
            "v": 1,
            "reviewed": False,   # AI-written; flip after a scholar has checked the language
            "lemmas": [(merged.get(str(i), {}).get(lang) or "") for i in range(n_lem)],
            "affixes": [uz(texts.AFFIXES[k][col]) if lang == "uz" else texts.AFFIXES[k][col] for k in affix_keys],
        }
        with open(os.path.join(PUB, "meanings", f"{lang}.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))

    md = json.loads(zipfile.ZipFile(os.path.join(CACHE, "quran_metadata.zip"))
                    .read("quran_metadata.json").decode("utf-8-sig"))["data"]["surahs"]
    ch = json.load(open(os.path.join(CACHE, "qc_chapters_en.json"), encoding="utf-8"))["chapters"]
    names = {
        "ru": texts.SURAH_RU,
        "uz": [uz(x) for x in texts.SURAH_UZ],
        "tj": [s["name_tajik"] for s in sorted(md, key=lambda s: s["number"])],
        "en": [c["name_simple"] for c in sorted(ch, key=lambda c: c["id"])],
    }
    for lang, lst in names.items():
        assert len(lst) == 114, (lang, len(lst))
    with open(os.path.join(PUB, "surah_names.json"), "w", encoding="utf-8") as f:
        json.dump(names, f, ensure_ascii=False, separators=(",", ":"))
    print("written: meanings/{tj,ru,uz,en}.json, surah_names.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""Add translations of the «ас-Сирадж» explanations to public/quran/siraj/NNN.json.

Input:  scripts/quran/.cache/sj/tr_NN.json  {"page:index": {"tj": ..., "ru": ..., "uz": ..., "en": ...}}
Output: each entry of public/quran/siraj/NNN.json gets a 6th element — an
        object with the available translations. Re-running is safe.

Run:  py scripts/quran/merge_siraj_tr.py [--partial]
"""
import glob
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SIRAJ = os.path.join(ROOT, "public", "quran", "siraj")
LANGS = ("tj", "ru", "uz", "en")
CYR = re.compile(r"[Ѐ-ӿ]")
ARAB = re.compile(r"[؀-ۿ]")


def main() -> int:
    partial = "--partial" in sys.argv
    tr = {}
    for path in sorted(glob.glob(os.path.join(HERE, ".cache", "sj", "tr_*.json"))):
        tr.update(json.load(open(path, encoding="utf-8")))

    total, bad, missing = 0, [], 0
    for p in range(1, 605):
        path = os.path.join(SIRAJ, f"{p:03d}.json")
        entries = json.load(open(path, encoding="utf-8"))
        for i, e in enumerate(entries):
            total += 1
            t = tr.get(f"{p}:{i}")
            if not t:
                missing += 1
                continue
            clean = {}
            for lang in LANGS:
                v = (t.get(lang) or "").strip()
                if not v:
                    continue
                if ARAB.search(v) or (lang in ("uz", "en") and CYR.search(v)):
                    bad.append((f"{p}:{i}", lang, v))
                    continue
                clean[lang] = v
            e[5:] = [clean] if clean else []
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
    print(f"entries: {total}  translated: {total - missing}  missing: {missing}  rejected fields: {len(bad)}")
    for b in bad[:20]:
        print("  ", b)
    return 0 if partial or (not missing and not bad) else 1


if __name__ == "__main__":
    sys.exit(main())

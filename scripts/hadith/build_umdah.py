# -*- coding: utf-8 -*-
"""«Умдат аль-Ахкам» (изд. д-ра Абдульмухсина аль-Касима, Шамила 538): .cache/raw_umdah.txt -> public/mutun/umdah.json.
Главы = «باب» (красным), у каждой note = название «كتاب». Красный текст книги (c5) -> маркеры U+E000..U+E001.
Номер хадиса выносится отдельной плашкой «[N]»."""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, ".cache", "raw_umdah.txt")
OUT = os.path.join(HERE, "..", "..", "public", "mutun", "umdah.json")
RED_OPEN, RED_CLOSE = chr(0xE000), chr(0xE001)
DIA = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")
NUM = re.compile(r"^([٠-٩]+)\s*-\s*")
AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def nd(t): return DIA.sub("", re.sub(r"<[^>]+>", "", t)).strip()


def clean(t):
    t = re.sub(r"<c2>\([٠-٩0-9]+\)</c2>", "", t)           # сноски издателя
    t = re.sub(r"<c5>(.*?)</c5>", RED_OPEN + r"\1" + RED_CLOSE, t, flags=re.S)
    t = re.sub(r"</?c[2345]>", "", t)
    t = re.sub(r"\s+([،؛:.؟)»])", r"\1", t)                 # пробел перед знаком после удалённой сноски
    return re.sub(r"\s+", " ", t).strip()


rows = []
for x in open(SRC, encoding="utf-8").read().split("\n"):
    pg, _, t = x.partition("|")
    if t.strip(): rows.append((int(pg), t.strip()))

# начало самих хадисов: первая строка «كتاب الطهارة»
start = next(i for i, (_, t) in enumerate(rows) if nd(t).startswith("كتاب الطهارة"))
kitab, chapters, cur = "", [], None
for pg, t in rows[start:]:
    n = nd(t)
    if re.match(r"^كتاب\s", n) and len(n) < 40:
        kitab = clean(t)
        cur = {"title_ar": kitab, "note": "", "points": []}
        chapters.append(cur)
        continue
    if re.match(r"^باب\b", n) and len(n) < 90:
        cur = {"title_ar": clean(t), "note": kitab, "points": []}
        chapters.append(cur)
        continue
    if cur is None: continue
    c = clean(t)
    m = NUM.match(c)
    if m: c = f"[{m.group(1)}] " + c[m.end():]
    cur["points"].append({"ar": c})

chapters = [c for c in chapters if c["points"]]
nh = sum(1 for c in chapters for p in c["points"] if p["ar"].startswith("["))
json.dump({"id": "umdah", "level": 0, "title_ar": "العُمْدَةُ فِي الأَحْكَامِ", "chapters": chapters},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("chapters", len(chapters), "points", sum(len(c["points"]) for c in chapters), "numbered hadiths", nh)
nums = [int(p["ar"][1:p["ar"].index("]")].translate(AR_DIGITS)) for c in chapters for p in c["points"] if p["ar"].startswith("[")]
print("hadith numbers", min(nums), max(nums), "missing:", sorted(set(range(1, max(nums) + 1)) - set(nums))[:20])
for c in chapters[:3]:
    print(c["title_ar"], "|", c["note"], "|", len(c["points"]), "|", c["points"][0]["ar"][:80])

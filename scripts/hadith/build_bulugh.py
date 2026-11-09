# -*- coding: utf-8 -*-
"""«Булюг аль-Марам» (Ибн Хаджар): арабский матн хадисов -> public/mutun/bulugh.json (книга для раздела «Хадисы»).
Источник: github.com/AhmedBaset/hadith-json (db/by_book/other_books/bulugh_almaram.json), скачан в scripts/hadith/.cache/.
Берём ТОЛЬКО арабский матн хадиса; английский перевод и сноски издателя (тахридж) отбрасываем."""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, ".cache", "bulugh.json")
OUT = os.path.join(HERE, "..", "..", "public", "mutun", "bulugh.json")
PART = 25  # хадисов в одной «части» (читалка не должна быть бесконечной)

RLM = "‏"
FOOT = re.compile(r"\s+\d+\s*" + RLM + r"?\s*\.\s*" + RLM)  # начало сноски издателя: " 1‏ .‏"


def clean(t: str) -> str:
    m = FOOT.search(t)
    if m:
        t = t[: m.start()]
    t = t.replace(RLM, "").replace("{", "«").replace("}", "»")
    t = re.sub(r"\s*-\s*", " - ", t)
    t = t.replace("ْ ", "ْ ") if False else t
    return re.sub(r"\s+", " ", t).strip(" ]")


d = json.load(open(SRC, encoding="utf-8"))
kitab = {c["id"]: c["arabic"] for c in d["chapters"]}
by = {}
for h in d["hadiths"]:
    by.setdefault(h["chapterId"], []).append(h)

chapters = []
for cid in sorted(by):
    hs = by[cid]
    for i in range(0, len(hs), PART):
        grp = hs[i : i + PART]
        chapters.append({
            "title_ar": kitab[cid],
            "note": f"{grp[0]['idInBook']}–{grp[-1]['idInBook']}",
            "points": [{"ar": f"[{h['idInBook']}] " + clean(h["arabic"])} for h in grp],
        })
json.dump({"id": "bulugh", "level": 0, "title_ar": "بُلُوغُ المَرَامِ مِنْ أَدِلَّةِ الأَحْكَامِ", "chapters": chapters},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("chapters", len(chapters), "hadiths", sum(len(c["points"]) for c in chapters))
for c in chapters[:2]:
    print(c["title_ar"], c["note"], c["points"][0]["ar"][:140])

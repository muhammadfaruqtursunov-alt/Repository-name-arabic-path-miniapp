# -*- coding: utf-8 -*-
"""Склеивает страницы шамелы в один текст и режет на "пункты" (параграфы) —
атомарная единица урока, как аят у Корана. Чистит служебные фразы шамелы
(коллофон в конце, "(الأصل الأول)" маркеры остаются — это настоящие заголовки).
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache", "raw")
OUT = os.path.join(HERE, ".cache", "segmented")
os.makedirs(OUT, exist_ok=True)

TRAILERS = [
    r"\(تمت الأصول الثلاثة.*?\)",
    r"\(تمت وصلى الله على محمد وآله وصحبه وسلم\)",
]


def segment(name: str):
    pages = json.load(open(os.path.join(CACHE, f"{name}.json"), encoding="utf-8"))
    full = "\n".join(p["text"] for p in pages if p["text"])
    for pat in TRAILERS:
        full = re.sub(pat, "", full)
    # параграфы уже разделены \n (из <p> тегов); чистим пустые и дубликаты пробелов
    paras = [re.sub(r"\s+", " ", p).strip() for p in full.split("\n")]
    paras = [p for p in paras if p]
    out_path = os.path.join(OUT, f"{name}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(paras, f, ensure_ascii=False, indent=2)
    print(f"{name}: {len(paras)} paragraphs -> {out_path}")
    return paras


if __name__ == "__main__":
    segment("usul")
    segment("qawaid")

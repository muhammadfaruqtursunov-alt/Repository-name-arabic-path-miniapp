# -*- coding: utf-8 -*-
"""Словарь слов для «Мутун»: public/mutun/lexicon.json = [[normKey, форма, перевод]].
Источники по приоритету: manual_glosses.json (ручные, mutun) > aqidah/manual_glosses.json > готовый aqidah-лексикон > корпус Корана.
Слова без перевода в словарь не попадают (тап по ним не активен). missing.json — список для дописывания вручную."""
import glob, json, os, re, sys
from collections import Counter, defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "aqidah"))
from build_word_data import build_quran_surface_gloss, norm, TOKEN_RE  # noqa: E402
PUB = os.path.join(HERE, "..", "..", "public")

quran = build_quran_surface_gloss()
manual = json.load(open(os.path.join(HERE, "..", "aqidah", "manual_glosses.json"), encoding="utf-8"))
mp = os.path.join(HERE, "manual_glosses.json")
if os.path.exists(mp): manual.update(json.load(open(mp, encoding="utf-8")))
old = {e[0]: e[2] for e in json.load(open(os.path.join(PUB, "aqidah", "lexicon.json"), encoding="utf-8")) if e[2] != "?"}

disp, cnt = defaultdict(Counter), Counter()
for f in glob.glob(os.path.join(PUB, "mutun", "*.json")):
    if f.endswith(("index.json", "lexicon.json")): continue
    for ch in json.load(open(f, encoding="utf-8"))["chapters"]:
        for p in ch["points"]:
            for t in TOKEN_RE.findall(re.sub(r"\[[^\]]*\]", "", p["ar"])):
                n = norm(t)
                if len(n) >= 2: disp[n][t] += 1; cnt[n] += 1
lex, missing = [], []
for n, _ in cnt.most_common():
    g = manual.get(n) or old.get(n) or quran.get(n)
    if g: lex.append([n, disp[n].most_common(1)[0][0], g])
    else: missing.append([n, cnt[n], disp[n].most_common(1)[0][0]])
json.dump(lex, open(os.path.join(PUB, "mutun", "lexicon.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump(missing, open(os.path.join(HERE, "missing.json"), "w", encoding="utf-8"), ensure_ascii=False)
tot = sum(cnt.values()); hit = sum(cnt[e[0]] for e in lex)
print("forms", len(cnt), "glossed", len(lex), "coverage", round(hit / tot * 100), "% of tokens")

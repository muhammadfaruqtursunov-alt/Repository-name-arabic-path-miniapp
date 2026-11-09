# -*- coding: utf-8 -*-
"""raw/{1..4}.txt -> public/mutun/{index,<book>}.json  (книги -> главы -> абзацы). Заголовки глав отдельно."""
import os, re, json, sys
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public", "mutun")
os.makedirs(OUT, exist_ok=True)

# (уровень, id, название ru, стартовая страница кеша, тип: prose|verse)
BOOKS = [
 (1, "nawaqid", "Навакыд аль-Ислям", "Аннулирующие Ислам", 16, "prose"),
 (1, "qawaid", "Аль-Кава'ид аль-Арба'", "Четыре правила", 22, "prose"),
 (1, "usul", "Аль-Усуль ас-Саляса", "Три основы", 34, "prose"),
 (1, "arbain", "Аль-Арба'ин ан-Нававия", "Сорок хадисов ан-Навави", 68, "prose"),
 (2, "tuhfa", "Тухфат аль-Атфаль", "Дар детям (таджвид)", 16, "verse"),
 (2, "shurut", "Шурут ас-Салят", "Условия молитвы", 33, "prose"),
 (2, "tawhid", "Китаб ат-Тавхид", "Книга единобожия", 64, "prose"),
 (3, "baiquniyya", "Аль-Байкунийя", "Терминология хадисоведения", 16, "verse"),
 (3, "ilbiri", "Мансума аль-Ильбири", "Наставление Абу Исхака аль-Ильбири", 25, "verse"),
 (3, "ajurrumiyya", "Аль-Аджуррумийя", "Основы арабской грамматики", 46, "prose"),
 (3, "wasitiyya", "Аль-Васитийя", "Акида аль-Васития", 92, "prose"),
 (4, "waraqat", "Аль-Варакат", "Основы фикха", 16, "prose"),
 (4, "unwan", "Унван аль-Хикам", "Заглавие мудростей", 56, "verse"),
 (4, "rahbiyya", "Ар-Рахбийя", "Наследственное право", 70, "verse"),
 (4, "tahawiyya", "Аль-Акида ат-Тахавийя", "Акида ат-Тахави", 118, "prose"),
]
TITLES = {"tuhfa": "تُحْفَةُ الأَطْفَالِ", "shurut": "شُرُوطُ الصَّلَاةِ وَأَرْكَانُهَا وَوَاجِبَاتُهَا", "tawhid": "كِتَابُ التَّوْحِيدِ", "baiquniyya": "المَنْظُومَةُ البَيْقُونِيَّةُ", "ajurrumiyya": "المُقَدِّمَةُ الآجُرُّومِيَّةُ", "wasitiyya": "العَقِيدَةُ الوَاسِطِيَّةُ"}
LEVEL_END = {1: 10**9, 2: 10**9, 3: 10**9, 4: 10**9}

def load(lv):
    rows = []
    for x in open(os.path.join(HERE, "raw", f"{lv}.txt"), encoding="utf-8").read().split("\n"):
        pg, t = x.split("|", 1)
        rows.append((int(pg), t.strip()))
    return rows

DIA = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
def nd(t): return DIA.sub("", re.sub(r"<[^>]+>", "", t)).strip()
def plain(t): return re.sub(r"<[^>]+>", "", t).strip()
HEAD = re.compile(r"^(بَابُ|بَابٌ|بَابِ|فَصْلٌ|فَصْلُ|كِتَابُ|الحَدِيثُ|الأَصْلُ|القَاعِدَةُ|مُقَدِّمَةٌ|المُقَدِّمَةُ|خَاتِمَةٌ)(\s|$)")
VERSE = re.compile(r"^[٠-٩0-9]+\s*[-–ـ]\s*")

def clean(t):
    t = re.sub(r"<c2>\([٠-٩0-9]+\)</c2>", "", t)       # сноски издателя
    t = re.sub(r"</?c[2345]>", "", t)                   # цветовые классы Шамилы не нужны
    t = re.sub(r"<c3>(.*?)</c3>", r"\1", t)
    t = t.replace("النَّبِيِّصَلَّى", "النَّبِيِّ صَلَّى")
    return re.sub(r"\s+", " ", t).strip()

def parse(lv, start, end, kind):
    rows = [(p, t) for p, t in load(lv) if start <= p < end]
    chapters, cur, front = [], None, True
    title = None
    skip_ms = False
    seps = []
    out = []
    for pg, t in rows:
        raw = t
        pl = plain(t)
        if not pl: continue
        if title is None:
            title = ""
            if not pl.startswith("بِسْمِ"): title = pl; continue   # название книги (первая строка)
        if front:
            n = nd(raw)
            if "النسخ المعتمدة" in n: skip_ms = True; continue
            if skip_ms and re.match(r"^[-ـ*]\s|^\(", n): continue
            if n.startswith("بسم الله"): skip_ms = False; front = False
            elif skip_ms: front = False
            elif re.match(r"^(ل\S* |مع زياده|محمد بن|رحمه|الامام|\(|[-ـ*]\s)", n) or "(ت " in n or "عدد الابيات" in n or n.startswith("[البحر") or "الاربعون النووية" in n or n.startswith("وقواعد الاحكام"): continue
            else: front = False
        if "النسخ المعتمدة" in nd(raw) or re.match(r"^[-ـ]\s*نسخ", nd(raw)): continue
        if re.match(r"^(\*\s*){3}", pl) and "…" not in pl:
            seps.append(len(out) and sum(len(c["points"]) for c in chapters)); continue
        if pl.startswith("* * *"): continue
        if nd(raw).startswith("تم ") or re.fullmatch(r"\[[٠-٩0-9]+\]", pl): continue
        if "<c4>[عدد الأبيات" in raw or "<c4>[البحر" in raw: continue
        m4 = re.fullmatch(r"\[(.+)\]", pl) if "<c4>" in raw else None
        is_head = bool(m4) or (HEAD.match(pl) and len(pl) < 90 and "<c5>" not in raw[:6])
        if kind == "verse" and not is_head and not VERSE.match(pl) and len(pl) < 70 and "…" not in pl and not pl.startswith("بِسْمِ") and not nd(raw).startswith("و"):
            is_head = True
        if is_head:
            h = m4.group(1) if m4 else clean(raw)
            # «بَابُ» + заголовок на следующей строке
            if out and out[-1].get("_open"):
                pass
            cur = {"title_ar": clean(h), "points": [], "_open": bool(re.fullmatch(r"(بَابُ|بَابٌ|فَصْلٌ|كِتَابُ)", clean(h)))}
            chapters.append(cur); out.append(cur); continue
        if cur and cur.get("_open"):
            cur["title_ar"] += " " + clean(raw); cur["_open"] = False; continue
        if cur is None:
            cur = {"title_ar": "", "points": [], "_open": False}; chapters.append(cur); out.append(cur)
        c = clean(raw)
        if cur["points"] and cur["points"][-1]["ar"].count("{") > cur["points"][-1]["ar"].count("}"):
            cur["points"][-1]["ar"] += " " + c; continue
        if kind == "verse":
            m = VERSE.match(c)
            if m: c = "[" + re.sub(r"\s*[-–ـ]\s*$", "", m.group(0)).strip() + "] " + c[m.end():]
        # хвост предыдущего абзаца: аят/хадис, разорванный переносом строки
        cur["points"].append({"ar": c})
    for ch in chapters: ch.pop("_open", None)
    if len([c for c in chapters if c["title_ar"]]) <= 2 and sum(len(c["points"]) for c in chapters) > 60 and len(chapters) <= 2 and kind == "prose":
        allp = [p for c in chapters for p in c["points"]]
        cuts = sorted(set(x for x in seps if 0 < x < len(allp)))
        parts, last = [], 0
        for x in cuts + [len(allp)]:
            if x - last >= 14 or x == len(allp):
                parts.append({"title_ar": "", "points": allp[last:x]}); last = x
        if len(parts) > 1 and len(parts[-1]["points"]) < 8: parts[-2]["points"] += parts.pop()["points"]
        if len(parts) > 1: chapters = parts
    res = []
    for c in chapters:
        n = len(c["points"])
        if not c["title_ar"] and n > 40:
            k = -(-n // 30); sz = -(-n // k)
            res += [{"title_ar": "", "points": c["points"][i:i + sz]} for i in range(0, n, sz)]
        else: res.append(c)
    return title, res

index = []
bylevel = {}
for b in BOOKS: bylevel.setdefault(b[0], []).append(b)
for lv, bs in bylevel.items():
    for i, (l, bid, tru, sub, start, kind) in enumerate(bs):
        end = bs[i + 1][4] if i + 1 < len(bs) else 10**9
        if bid == "arbain" or i + 1 == len(bs): end = 10**9
        title, chs = parse(l, start, end, kind)
        title = TITLES.get(bid) or title
        chs = [c for c in chs if c["points"] or c["title_ar"]]
        tp = os.path.join(HERE, "translations", bid + ".json")
        tr = json.load(open(tp, encoding="utf-8")) if os.path.exists(tp) else {}
        for lg in ("ru", "tj", "uz"):
            lp = os.path.join(HERE, "translations", f"{bid}.{lg}.json")
            if os.path.exists(lp): tr[lg] = json.load(open(lp, encoding="utf-8"))
        if tr:
            flat = [p for c in chs for p in c["points"]]
            for lang, arr in tr.items():
                if len(arr) != len(flat): print("!! translation length mismatch", bid, lang, len(arr), len(flat)); continue
                for pt, tx in zip(flat, arr): pt[lang] = tx
        n = sum(len(c["points"]) for c in chs)
        json.dump({"id": bid, "level": l, "title_ar": title, "chapters": chs}, open(os.path.join(OUT, bid + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        index.append({"id": bid, "level": l, "title_ar": title, "title_ru": tru, "sub_ru": sub, "chapters": len(chs), "points": n})
        print(l, bid, title, len(chs), n)
json.dump(index, open(os.path.join(OUT, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

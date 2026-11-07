# -*- coding: utf-8 -*-
"""Сырой разбор: .cache/{level}/NNN.html -> raw/{level}.txt (по строке на абзац, маркеры классов)."""
import os, re, html, sys
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))

def paras(h):
    i = h.find('class="nass')
    if i < 0: return []
    j = h.find('<div id="appended_pages"', i)
    seg = h[i:j if j > 0 else None]
    out = []
    for p in re.findall(r"<p>(.*?)</p>", seg, re.S):
        p = re.sub(r'<a href="#p\d+" class="btn_tag.*?</a>', "", p, flags=re.S)
        p = re.sub(r'<span[^>]*class="anchor"[^>]*></span>', "", p)
        p = re.sub(r'<span class="(c\d)">(.*?)</span>', lambda m: f"<{m.group(1)}>{m.group(2)}</{m.group(1)}>", p, flags=re.S)
        p = re.sub(r"<(?!/?c\d>)[^>]+>", "", p)
        out.append(html.unescape(p).strip())
    return out

os.makedirs(os.path.join(HERE, "raw"), exist_ok=True)
for lv in "1234":
    d = os.path.join(HERE, ".cache", lv)
    lines = []
    for f in sorted(os.listdir(d)):
        for p in paras(open(os.path.join(d, f), encoding="utf-8").read()):
            lines.append(f"{f[:3]}|{p}")
    open(os.path.join(HERE, "raw", lv + ".txt"), "w", encoding="utf-8").write("\n".join(lines))
    print(lv, len(lines))

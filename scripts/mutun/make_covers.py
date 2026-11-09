# -*- coding: utf-8 -*-
"""Обложки-иллюстрации 4 мустава (public/mutun/covers/L{n}.svg). Свои, не копия печатных обложек.
Чтобы поставить настоящие фото, положите public/mutun/covers/L{n}.jpg и поменяйте расширение в Mutun.tsx (COVER_EXT)."""
import os, math
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "mutun", "covers")
os.makedirs(OUT, exist_ok=True)
LEVELS = [
    ("المستوى الأول", "#0F4D3A", "#1F7A5C"),
    ("المستوى الثاني", "#6B1E2E", "#A03347"),
    ("المستوى الثالث", "#1B2F5C", "#2F5290"),
    ("المستوى الرابع", "#4A3216", "#8A6A2F"),
]
def star(cx, cy, r, n=8):
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n - math.pi / 2
        rr = r if i % 2 == 0 else r * 0.62
        pts.append(f"{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}")
    return " ".join(pts)
for i, (lvl, c1, c2) in enumerate(LEVELS, 1):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c2}"/><stop offset="1" stop-color="{c1}"/></linearGradient></defs>
<rect width="300" height="420" rx="14" fill="url(#g)"/>
<rect x="14" y="14" width="272" height="392" rx="8" fill="none" stroke="#E0B86A" stroke-width="2.5"/>
<rect x="22" y="22" width="256" height="376" rx="5" fill="none" stroke="#E0B86A" stroke-width="1" opacity=".6"/>
<polygon points="{star(150, 150, 70)}" fill="none" stroke="#E0B86A" stroke-width="2.5"/>
<polygon points="{star(150, 150, 46)}" fill="#E0B86A" opacity=".18" stroke="#E0B86A" stroke-width="1.5"/>
<circle cx="150" cy="150" r="9" fill="#E0B86A"/>
<text x="150" y="272" text-anchor="middle" font-family="'Amiri','Scheherazade New','Noto Naskh Arabic',serif" font-size="40" fill="#F6E7C1">متون طالب العلم</text>
<line x1="70" y1="292" x2="230" y2="292" stroke="#E0B86A" stroke-width="1.5"/>
<text x="150" y="336" text-anchor="middle" font-family="'Amiri','Scheherazade New','Noto Naskh Arabic',serif" font-size="30" fill="#E0B86A">{lvl}</text>
<text x="150" y="380" text-anchor="middle" font-family="sans-serif" font-size="13" letter-spacing="3" fill="#F6E7C1" opacity=".85">LEVEL {i}</text>
</svg>'''
    open(os.path.join(OUT, f"L{i}.svg"), "w", encoding="utf-8").write(svg)
print("ok")

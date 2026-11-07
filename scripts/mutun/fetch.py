# -*- coding: utf-8 -*-
"""Скачивает страницы 4 мустава «متون طالب العلم» (shamela.ws/book/{570,571,573,574}).
Сохраняет сырой HTML в scripts/mutun/.cache/{book}/{page}.html (кэш, вежливая задержка)."""
import os, re, socket, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
_o = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, *a, **k: _o(h, p, socket.AF_INET, *a, **k)

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = {1: 570, 2: 571, 3: 573, 4: 574}


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ArabicPath-build"})
            return urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "ignore")
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                print("FAILED", url, e)
                return ""
            time.sleep(2)


for level, bid in BOOKS.items():
    d = os.path.join(HERE, ".cache", str(level))
    os.makedirs(d, exist_ok=True)
    idx = get(f"https://shamela.ws/book/{bid}")
    last = max(int(x) for x in re.findall(rf"/book/{bid}/(\d+)", idx))
    # в оглавлении видны только начала глав — реальный конец ищем по пустым страницам
    n, empty = 1, 0
    while empty < 3:
        p = os.path.join(d, f"{n:03d}.html")
        if not os.path.exists(p):
            h = get(f"https://shamela.ws/book/{bid}/{n}")
            time.sleep(0.5)
            open(p, "w", encoding="utf-8").write(h)
        else:
            h = open(p, encoding="utf-8").read()
        empty = empty + 1 if 'class="nass' not in h else 0
        n += 1
    print(f"level {level}: pages 1..{n - 4}")

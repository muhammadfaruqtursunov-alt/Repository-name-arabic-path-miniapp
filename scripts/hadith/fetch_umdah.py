# -*- coding: utf-8 -*-
"""Скачивает «Умдат аль-Ахкам» (издание д-ра Абдульмухсина аль-Касима, shamela.ws/book/538) в scripts/hadith/.cache/umdah/NNN.html."""
import os, re, socket, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
_o = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, *a, **k: _o(h, p, socket.AF_INET, *a, **k)

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, ".cache", "umdah")
os.makedirs(D, exist_ok=True)


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


n, empty = 1, 0
while empty < 3:
    p = os.path.join(D, f"{n:03d}.html")
    if os.path.exists(p):
        h = open(p, encoding="utf-8").read()
    else:
        h = get(f"https://shamela.ws/book/538/{n}")
        time.sleep(0.5)
        open(p, "w", encoding="utf-8").write(h)
    empty = empty + 1 if 'class="nass' not in h else 0
    n += 1
print("pages 1..", n - 4)

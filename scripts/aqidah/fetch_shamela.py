# -*- coding: utf-8 -*-
"""Скачивает и очищает текст «Аль-Усуль ас-Саляса» и «Аль-Каваид аль-Арба»
с al-Maktaba al-Shamila (shamela.ws/book/239), тот же приём, что в
scripts/quran/build_siraj.py (IPv4-патч, кэш, вежливая задержка).

Запуск: py scripts/aqidah/fetch_shamela.py
Выход: scripts/aqidah/.cache/raw/{usul,qawaid}.json — список {page, html_text}
"""
import json
import os
import re
import socket
import sys
import time
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
_orig = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, *a, **k: _orig(h, p, socket.AF_INET, *a, **k)

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache", "raw")
os.makedirs(CACHE, exist_ok=True)
BOOK_URL = "https://shamela.ws/book/239/{n}"

NASS_RE = re.compile(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', re.S)
TAG_RE = re.compile(r"<[^>]+>")


def fetch_page(n: int) -> str:
    path = os.path.join(CACHE, f"{n:03d}.html")
    if os.path.exists(path):
        return open(path, encoding="utf-8").read()
    for attempt in range(4):
        try:
            req = urllib.request.Request(BOOK_URL.format(n=n), headers={"User-Agent": "Mozilla/5.0 ArabicPath-build"})
            data = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
            with open(path, "w", encoding="utf-8") as f:
                f.write(data)
            time.sleep(0.6)
            return data
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                print(f"  page {n}: FAILED {e}")
                return ""
            time.sleep(2)
    return ""


def extract_text(html: str) -> str:
    m = NASS_RE.search(html)
    if not m:
        return ""
    inner = m.group(1)
    inner = re.sub(r'<a[^>]*class="btn_tag[^"]*"[^>]*>.*?</a>', "", inner, flags=re.S)
    inner = re.sub(r"<span[^>]*class=\"anchor\"[^>]*></span>", "", inner)
    inner = inner.replace("<p>", "\n").replace("</p>", "\n")
    inner = inner.replace("<br>", "\n").replace("<br/>", "\n")
    inner = TAG_RE.sub("", inner)
    import html as htmllib
    inner = htmllib.unescape(inner)
    inner = re.sub(r"[ \t]+", " ", inner)
    inner = re.sub(r"\n{2,}", "\n", inner).strip()
    return inner


def dump_range(name: str, pages: range):
    out = []
    for n in pages:
        raw = fetch_page(n)
        text = extract_text(raw)
        print(f"  {name} page {n}: {len(text)} chars")
        out.append({"page": n, "text": text})
    out_path = os.path.join(CACHE, f"{name}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"-> {out_path}")


if __name__ == "__main__":
    print("Al-Usul al-Thalatha (pages 6-25):")
    dump_range("usul", range(6, 26))
    print("Al-Qawaid al-Arba (pages 40-50):")
    dump_range("qawaid", range(40, 51))

"""
Собирает единый поисковый индекс для тренажёра слов Корана:
public/quran/search/{lang}.json = {"сура:аят": [страница, "текст перевода"]}
public/quran/search/ar.json     = {"сура:аят": [страница, "арабский текст аята"]}

Источники (уже собраны build_quran_data.py / build_ayah_texts.py):
- public/quran/pages/NNN.json   -> номер страницы + арабский текст по словам
- public/quran/trans/{lang}/NNN.json -> короткий перевод смысла аята
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PAGES_DIR = ROOT / "public" / "quran" / "pages"
TRANS_DIR = ROOT / "public" / "quran" / "trans"
OUT_DIR = ROOT / "public" / "quran" / "search"
LANGS = ["ru", "tj", "uz", "en"]


def ayah_to_page() -> dict[str, int]:
    mapping: dict[str, int] = {}
    for f in sorted(PAGES_DIR.glob("*.json")):
        page = json.loads(f.read_text(encoding="utf-8"))
        p = page["p"]
        for frag in page["a"]:
            key = frag["k"]
            if key not in mapping:
                mapping[key] = p
    return mapping


def arabic_text_by_ayah() -> dict[str, list]:
    """Собирает арабский текст аята по словам мусхафа — аят может быть
    разбит на фрагменты между соседними страницами, склеиваем по порядку."""
    out: dict[str, list[str]] = {}
    first_page: dict[str, int] = {}
    for f in sorted(PAGES_DIR.glob("*.json")):
        page = json.loads(f.read_text(encoding="utf-8"))
        p = page["p"]
        for frag in page["a"]:
            key = frag["k"]
            if key not in first_page:
                first_page[key] = p
            out.setdefault(key, []).extend(w[0] for w in frag["w"])
    return {k: [first_page[k], " ".join(words)] for k, words in out.items()}


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    a2p = ayah_to_page()
    print(f"ayah->page: {len(a2p)} entries")

    arabic = arabic_text_by_ayah()
    ar_path = OUT_DIR / "ar.json"
    ar_path.write_text(json.dumps(arabic, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"ar: {len(arabic)} ayahs -> {ar_path} ({ar_path.stat().st_size / 1024:.0f} KB)")

    for lang in LANGS:
        lang_dir = TRANS_DIR / lang
        if not lang_dir.exists():
            print(f"skip {lang}: no trans dir")
            continue
        merged: dict[str, list] = {}
        for f in sorted(lang_dir.glob("*.json")):
            texts = json.loads(f.read_text(encoding="utf-8"))
            for key, text in texts.items():
                page = a2p.get(key)
                if page is None or not text:
                    continue
                merged[key] = [page, text]
        out_path = OUT_DIR / f"{lang}.json"
        out_path.write_text(json.dumps(merged, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{lang}: {len(merged)} ayahs -> {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()

"""
Собирает единый поисковый индекс для тренажёра слов Корана:
public/quran/search/{lang}.json = {"сура:аят": [страница, "текст перевода"]}

Источники (уже собраны build_quran_data.py / build_ayah_texts.py):
- public/quran/pages/NNN.json   -> номер страницы для каждого аята
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


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    a2p = ayah_to_page()
    print(f"ayah->page: {len(a2p)} entries")

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

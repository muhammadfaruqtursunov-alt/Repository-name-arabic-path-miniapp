# -*- coding: utf-8 -*-
"""
Морфологический разбор словаря "Акида" (корень, порода/باب, время, لицо/род/число)
через CAMeL Tools (двигатель разбора) с классификацией по традиционной системе
Сарфа (как в "ат-Тасриф аль-Иззи" и в src/utils/sarfConjugator.ts этого приложения) —
а не по английским компьютерно-лингвистическим меткам CAMeL.

Разбор делается В КОНТЕКСТЕ предложения (MLE-дизамбигуатор), а не изолированно —
иначе, как показал опыт с "ас-Сирадж", частые слова получают неверный разбор.

Требует: scripts/aqidah/.venv_morph (Python 3.12 + camel-tools + calima-msa-r13 data).
Выход: public/aqidah/morphology.json — normKey -> разбор.
"""
import json
import os
import re
from collections import Counter, defaultdict

from camel_tools.disambig.mle import MLEDisambiguator
from camel_tools.morphology.database import MorphologyDB
from camel_tools.morphology.analyzer import Analyzer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUBLIC = os.path.join(ROOT, "public")

DIACRITICS_RE = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]")
TOKEN_RE = re.compile(r"[ؐ-ؚء-ٰٟۖ-ۭ࣓-ࣿ]+")
ALEF_MAP = str.maketrans("إأآٱ", "اااا")


def strip_diacritics(s: str) -> str:
    return DIACRITICS_RE.sub("", s).replace("ـ", "")


def norm(w: str) -> str:
    w = strip_diacritics(w)
    w = w.translate(ALEF_MAP)
    return w.replace("ى", "ي").replace("ة", "ه")


# ── Классификация по وزن/pattern — традиционные породы (ат-Тасриф аль-Иззи) ──
# Ключ — pattern от CAMeL с огласовками; сверено вручную на образцах глаголов.
VERB_FORMS = {
    "1َ2َ3َ":       ("فَعَلَ — الثلاثي المجرد",  "Мужаррад I (فَعَلَ)"),
    "1َ2ِ3َ":       ("فَعَلَ — الثلاثي المجرد",  "Мужаррад I (فَعَلَ، ضَرَبَ/عَلِمَ)"),
    "1َ2ُ3َ":       ("فَعُلَ — الثلاثي المجرد",  "Мужаррад I (فَعُلَ، كَرُمَ)"),
    "1َ2َّ3َ":       ("فَعَّلَ — الباب الثاني",   "2-я порода — فَعَّلَ"),
    "1ا3َ":         ("فَعَلَ — الأجوف",          "Мужаррад I, аджвеф (пустой, напр. قَالَ)"),
    "1َ2َى":         ("فَعَلَ — الناقص",          "Мужаррад I, накис (недостаточный, напр. رَمَى)"),
    "1ا2َ3َ":       ("فَاعَلَ — الباب الثالث",   "3-я порода — فَاعَلَ"),
    "أَ1ْ2َ3َ":     ("أَفْعَلَ — الباب الرابع",  "4-я порода — أَفْعَلَ"),
    "تَ1َ2َّ3َ":    ("تَفَعَّلَ — الباب الخامس", "5-я порода — تَفَعَّلَ"),
    "تَ1ا2َ3َ":     ("تَفَاعَلَ — الباب السادس", "6-я порода — تَفَاعَلَ"),
    "ٱِنْ1َ2َ3َ":   ("انْفَعَلَ — الباب السابع", "7-я порода — انْفَعَلَ"),
    "ٱِ1ْتَ2َ3َ":   ("افْتَعَلَ — الباب الثامن", "8-я порода — افْتَعَلَ"),
    "ٱِ1ْ2َ3َّ":    ("افْعَلَّ — الباب التاسع",  "9-я порода — افْعَلَّ"),
    "ٱِسْتَ1ْ2َ3َ": ("اسْتَفْعَلَ — الباب العاشر", "10-я порода — اسْتَفْعَلَ"),
    "1َ2ْ3َ4َ":     ("فَعْلَلَ — الرباعي المجرد", "Рубаъи мужаррад — فَعْلَلَ"),
    "تَ1َ2ْ3َ4َ":   ("تَفَعْلَلَ — الرباعي المزيد", "Рубаъи мазид — تَفَعْلَلَ"),
}

ASP_LABEL = {"p": ("الْمَاضِي", "Прошедшее (ماضي)"), "i": ("الْمُضَارِع", "Наст.-буд. (مضارع)"), "c": ("الْأَمْر", "Повеление (أمر)")}
VOX_LABEL = {"a": ("مَعْلُوم", "действительный залог"), "p": ("مَجْهُول", "страдательный залог")}
POS_LABEL = {
    "verb": ("فِعْل", "глагол"), "noun": ("اِسْم", "существительное"),
    "noun_prop": ("اِسْم عَلَم", "имя собственное"), "adj": ("صِفَة", "прилагательное"),
    "prep": ("حَرْف جَرّ", "предлог"), "conj": ("حَرْف عَطْف", "союз"),
    "conj_sub": ("حَرْف مَصْدَرِيّ", "подчинительный союз"), "part": ("حَرْف", "частица"),
    "pron": ("ضَمِير", "местоимение"), "adv": ("ظَرْف", "наречие"),
    "verb_pseudo": ("فِعْل نَاقِص", "недостаточный глагол"),
}
GEN_LABEL = {"m": "м.р.", "f": "ж.р."}
NUM_LABEL = {"s": "ед.ч.", "d": "дв.ч.", "p": "мн.ч."}
PER_LABEL = {"1": "1-е лицо", "2": "2-е лицо", "3": "3-е лицо"}


# Отсортировано по убыванию длины — приставочные местоимения (رحمك، قاتلهم)
# добавляются к pattern ПОСЛЕ последнего корневого радикала, поэтому ищем
# самый длинный известный wazn, которым pattern НАЧИНАЕТСЯ.
_SORTED_FORMS = sorted(VERB_FORMS.items(), key=lambda kv: -len(kv[0]))


def classify_pattern(pattern: str):
    # приставки-союзы (وَ، فَ) стоят перед wazn и не относятся к породе
    pattern = re.sub(r"^[وف]َ", "", pattern)
    for key, val in _SORTED_FORMS:
        if pattern.startswith(key):
            return val
    return (None, None)


_lex_form_cache: dict[str, tuple] = {}


def form_from_lex(lex_analyzer: Analyzer, lex: str):
    """Порода определяется по словарной форме (لemma), а не по словоформе
    в тексте — иначе pattern «плывёт» от лица/числа/времени (يعبدون vs عَبَد)."""
    if lex in _lex_form_cache:
        return _lex_form_cache[lex]
    bare = norm(lex)
    result = (None, None)
    for a in lex_analyzer.analyze(bare):
        if a.get("pos") == "verb" and a.get("asp") == "p":
            result = classify_pattern(a.get("pattern", ""))
            break
    _lex_form_cache[lex] = result
    return result


def load_points():
    """Все пункты (ar) из обеих книг Акиды + их точки разбиения на слова."""
    out = []
    for name in ("usul", "qawaid"):
        data = json.load(open(os.path.join(PUBLIC, "aqidah", f"{name}.json"), encoding="utf-8"))
        for lesson in data["lessons"]:
            for pt in lesson["points"]:
                out.append(pt["ar"])
    return out


def main():
    lexicon = json.load(open(os.path.join(PUBLIC, "aqidah", "lexicon.json"), encoding="utf-8"))
    lex_keys = {e[0] for e in lexicon}
    print(f"lexicon: {len(lex_keys)} words")

    points = load_points()
    print(f"points: {len(points)}")

    disambig = MLEDisambiguator.pretrained("calima-msa-r13")
    lex_analyzer = Analyzer(MorphologyDB.builtin_db("calima-msa-r13"))

    # normKey -> Counter из (pos, root, lex, asp, vox, mod, per, gen, num)
    votes: dict[str, Counter] = defaultdict(Counter)

    BATCH = 40
    for bi in range(0, len(points), BATCH):
        batch = points[bi:bi + BATCH]
        for text in batch:
            toks = TOKEN_RE.findall(text)
            words = [t for t in toks if len(norm(t)) >= 2]
            if not words:
                continue
            try:
                results = disambig.disambiguate(words)
            except Exception as e:
                print("skip point (disambig error):", e)
                continue
            for w, r in zip(words, results):
                key = norm(w)
                if key not in lex_keys or not r.analyses:
                    continue
                a = r.analyses[0].analysis
                sig = (
                    a.get("pos", "na"), a.get("root", "na"), a.get("lex", "na"),
                    a.get("asp", "na"), a.get("vox", "na"), a.get("mod", "na"),
                    a.get("per", "na"), a.get("gen", "na"), a.get("num", "na"),
                )
                votes[key][sig] += 1
        print(f"  processed {min(bi + BATCH, len(points))}/{len(points)} points, {len(votes)} words analyzed so far")

    out = {}
    for key, counter in votes.items():
        (pos, root, lex, asp, vox, mod, per, gen, num), _cnt = counter.most_common(1)[0]
        bad_root = root in ("na", "NTWS") or "#" in (root or "")
        entry = {"root": None if bad_root else root}
        pos_ar, pos_ru = POS_LABEL.get(pos, (None, None))
        entry["pos"] = {"ar": pos_ar, "ru": pos_ru} if pos_ar else None
        if pos == "verb":
            form_ar, form_ru = form_from_lex(lex_analyzer, lex) if lex != "na" else (None, None)
            entry["form"] = {"ar": form_ar, "ru": form_ru} if form_ar else None
            asp_l = ASP_LABEL.get(asp)
            vox_l = VOX_LABEL.get(vox)
            entry["tense"] = {"ar": asp_l[0], "ru": asp_l[1]} if asp_l else None
            entry["voice"] = {"ar": vox_l[0], "ru": vox_l[1]} if vox_l else None
            parts = []
            if per in PER_LABEL: parts.append(PER_LABEL[per])
            if gen in GEN_LABEL: parts.append(GEN_LABEL[gen])
            if num in NUM_LABEL: parts.append(NUM_LABEL[num])
            entry["agreement_ru"] = ", ".join(parts) if parts else None
        else:
            entry["form"] = None
            entry["tense"] = None
            entry["voice"] = None
            entry["agreement_ru"] = None
        out[key] = entry

    out_path = os.path.join(PUBLIC, "aqidah", "morphology.json")
    json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"saved {len(out)} entries -> {out_path}")
    missing = len(lex_keys) - len(out)
    print(f"words with no analysis found in any point: {missing}")


if __name__ == "__main__":
    main()

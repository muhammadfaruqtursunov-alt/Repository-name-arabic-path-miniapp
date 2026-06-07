// ============================================================================
// ГЛАГОЛЫ ДЛЯ ТЕСТА ПО СА́РФУ — по 20 из каждой из 3 групп (بابов).
// Все глаголы — صحيح سالم (здоровые), поэтому движок sarfConjugator даёт
// абсолютно правильный تصريف. Из этих групп не выходим (ТЗ).
//
//   Группа 1: نَصَرَ – يَنْصُرُ  (فَعَلَ يَفْعُلُ)
//   Группа 2: ضَرَبَ – يَضْرِبُ  (فَعَلَ يَفْعِلُ)
//   Группа 3: عَلِمَ – يَعْلَمُ  (فَعِلَ يَفْعَلُ)
// ============================================================================

import { conjugate } from '../utils/sarfConjugator';
import type { SarfGroup, ConjResult } from '../utils/sarfConjugator';

export interface SarfVerb {
  id: string;
  root: [string, string, string]; // ف ع ل (без огласовок)
  group: SarfGroup;
  ru: string;                       // значение
}

export const SARF_GROUPS: { group: SarfGroup; ar: string; model: string; ru: string; pattern: string }[] = [
  { group: 1, ar: 'نَصَرَ – يَنْصُرُ', model: 'نَصَرَ', ru: 'Группа 1', pattern: 'فَعَلَ يَفْعُلُ' },
  { group: 2, ar: 'ضَرَبَ – يَضْرِبُ', model: 'ضَرَبَ', ru: 'Группа 2', pattern: 'فَعَلَ يَفْعِلُ' },
  { group: 3, ar: 'عَلِمَ – يَعْلَمُ', model: 'عَلِمَ', ru: 'Группа 3', pattern: 'فَعِلَ يَفْعَلُ' },
];

// ── Группа 1 — نَصَرَ يَنْصُرُ ───────────────────────────────────────────────
export const GROUP1: SarfVerb[] = [
  { id: 'nsr', root: ['ن', 'ص', 'ر'], group: 1, ru: 'помогать' },
  { id: 'ktb', root: ['ك', 'ت', 'ب'], group: 1, ru: 'писать' },
  { id: 'khrj', root: ['خ', 'ر', 'ج'], group: 1, ru: 'выходить' },
  { id: 'dkhl', root: ['د', 'خ', 'ل'], group: 1, ru: 'входить' },
  { id: 'tlb', root: ['ط', 'ل', 'ب'], group: 1, ru: 'требовать, искать' },
  { id: 'qtl', root: ['ق', 'ت', 'ل'], group: 1, ru: 'убивать' },
  { id: 'khlq', root: ['خ', 'ل', 'ق'], group: 1, ru: 'создавать' },
  { id: 'rzq', root: ['ر', 'ز', 'ق'], group: 1, ru: 'наделять уделом' },
  { id: 'sjd', root: ['س', 'ج', 'د'], group: 1, ru: 'падать ниц' },
  { id: 'shkr', root: ['ش', 'ك', 'ر'], group: 1, ru: 'благодарить' },
  { id: 'abd', root: ['ع', 'ب', 'د'], group: 1, ru: 'поклоняться' },
  { id: 'nzr', root: ['ن', 'ظ', 'ر'], group: 1, ru: 'смотреть' },
  { id: 'drs', root: ['د', 'ر', 'س'], group: 1, ru: 'изучать' },
  { id: 'dhkr', root: ['ذ', 'ك', 'ر'], group: 1, ru: 'поминать' },
  { id: 'skn', root: ['س', 'ك', 'ن'], group: 1, ru: 'проживать' },
  { id: 'nshr', root: ['ن', 'ش', 'ر'], group: 1, ru: 'распространять' },
  { id: 'hkm', root: ['ح', 'ك', 'م'], group: 1, ru: 'судить, править' },
  { id: 'qad', root: ['ق', 'ع', 'د'], group: 1, ru: 'сидеть' },
  { id: 'nql', root: ['ن', 'ق', 'ل'], group: 1, ru: 'переносить' },
  { id: 'mkth', root: ['م', 'ك', 'ث'], group: 1, ru: 'пребывать' },
];

// ── Группа 2 — ضَرَبَ يَضْرِبُ ───────────────────────────────────────────────
export const GROUP2: SarfVerb[] = [
  { id: 'drb', root: ['ض', 'ر', 'ب'], group: 2, ru: 'бить, ударять' },
  { id: 'jls', root: ['ج', 'ل', 'س'], group: 2, ru: 'сидеть' },
  { id: 'ghsl', root: ['غ', 'س', 'ل'], group: 2, ru: 'мыть' },
  { id: 'hml', root: ['ح', 'م', 'ل'], group: 2, ru: 'нести' },
  { id: 'arf', root: ['ع', 'ر', 'ف'], group: 2, ru: 'знать, узнавать' },
  { id: 'ksb', root: ['ك', 'س', 'ب'], group: 2, ru: 'зарабатывать' },
  { id: 'srf', root: ['ص', 'ر', 'ف'], group: 2, ru: 'расходовать' },
  { id: 'ghfr', root: ['غ', 'ف', 'ر'], group: 2, ru: 'прощать' },
  { id: 'mlk', root: ['م', 'ل', 'ك'], group: 2, ru: 'владеть' },
  { id: 'sbr', root: ['ص', 'ب', 'ر'], group: 2, ru: 'терпеть' },
  { id: 'kdhb', root: ['ك', 'ذ', 'ب'], group: 2, ru: 'лгать' },
  { id: 'qdr', root: ['ق', 'د', 'ر'], group: 2, ru: 'мочь, предопределять' },
  { id: 'khlt', root: ['خ', 'ل', 'ط'], group: 2, ru: 'смешивать' },
  { id: 'nzl', root: ['ن', 'ز', 'ل'], group: 2, ru: 'спускаться' },
  { id: 'hbs', root: ['ح', 'ب', 'س'], group: 2, ru: 'удерживать' },
  { id: 'ksr', root: ['ك', 'س', 'ر'], group: 2, ru: 'ломать' },
  { id: 'ghlb', root: ['غ', 'ل', 'ب'], group: 2, ru: 'побеждать' },
  { id: 'srq', root: ['س', 'ر', 'ق'], group: 2, ru: 'красть' },
  { id: 'aqd', root: ['ع', 'ق', 'د'], group: 2, ru: 'завязывать, заключать' },
  { id: 'qsm', root: ['ق', 'س', 'م'], group: 2, ru: 'делить' },
];

// ── Группа 3 — عَلِمَ يَعْلَمُ ───────────────────────────────────────────────
export const GROUP3: SarfVerb[] = [
  { id: 'alm', root: ['ع', 'ل', 'م'], group: 3, ru: 'знать' },
  { id: 'fhm', root: ['ف', 'ه', 'م'], group: 3, ru: 'понимать' },
  { id: 'shrb', root: ['ش', 'ر', 'ب'], group: 3, ru: 'пить' },
  { id: 'lbs', root: ['ل', 'ب', 'س'], group: 3, ru: 'одеваться' },
  { id: 'sm', root: ['س', 'م', 'ع'], group: 3, ru: 'слышать' },
  { id: 'frh', root: ['ف', 'ر', 'ح'], group: 3, ru: 'радоваться' },
  { id: 'tab', root: ['ت', 'ع', 'ب'], group: 3, ru: 'уставать' },
  { id: 'rkb', root: ['ر', 'ك', 'ب'], group: 3, ru: 'садиться верхом' },
  { id: 'hfz', root: ['ح', 'ف', 'ظ'], group: 3, ru: 'хранить, заучивать' },
  { id: 'hzn', root: ['ح', 'ز', 'ن'], group: 3, ru: 'печалиться' },
  { id: 'ajb', root: ['ع', 'ج', 'ب'], group: 3, ru: 'удивляться' },
  { id: 'krh', root: ['ك', 'ر', 'ه'], group: 3, ru: 'ненавидеть' },
  { id: 'shhd', root: ['ش', 'ه', 'د'], group: 3, ru: 'свидетельствовать' },
  { id: 'aml', root: ['ع', 'م', 'ل'], group: 3, ru: 'делать, работать' },
  { id: 'hmd', root: ['ح', 'م', 'د'], group: 3, ru: 'восхвалять' },
  { id: 'dhk', root: ['ض', 'ح', 'ك'], group: 3, ru: 'смеяться' },
  { id: 'ghdb', root: ['غ', 'ض', 'ب'], group: 3, ru: 'гневаться' },
  { id: 'skht', root: ['س', 'خ', 'ط'], group: 3, ru: 'негодовать' },
  { id: 'lab', root: ['ل', 'ع', 'ب'], group: 3, ru: 'играть' },
  { id: 'slm', root: ['س', 'ل', 'م'], group: 3, ru: 'быть невредимым' },
];

export const ALL_SARF_VERBS: SarfVerb[] = [...GROUP1, ...GROUP2, ...GROUP3];

export function verbsByGroup(group: SarfGroup | 'all'): SarfVerb[] {
  if (group === 'all') return ALL_SARF_VERBS;
  return ALL_SARF_VERBS.filter((v) => v.group === group);
}

// Кэш разборов, чтобы не пересчитывать спряжение на каждый рендер.
const _cache = new Map<string, ConjResult>();
export function verbForms(v: SarfVerb): ConjResult {
  let r = _cache.get(v.id);
  if (!r) {
    r = conjugate(v.root, v.group);
    _cache.set(v.id, r);
  }
  return r;
}

export function verbDictionary(v: SarfVerb): { madi: string; mudari: string } {
  const r = verbForms(v);
  return { madi: r.madi, mudari: r.mudari };
}

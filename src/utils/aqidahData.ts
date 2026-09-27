/**
 * Статические данные раздела «Акида» (public/aqidah/, готовятся
 * scripts/aqidah/*.py + ручной перевод *_ru.json). Грузим по требованию.
 */
export interface AqidahPoint { ar: string; ru: string }
export interface AqidahLesson { title_ru: string; points: AqidahPoint[] }
export interface AqidahBookData { lessons: AqidahLesson[] }

export type AqidahBookId = 'usul' | 'qawaid';

/** [нормализованный ключ, форма для показа, краткий перевод] — id слова = индекс в массиве. */
export type AqidahLexEntry = [string, string, string];

const BASE = '/aqidah/';
const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`${BASE}${path}`).then(r => {
      if (!r.ok) throw new Error(`aqidah data ${path}: HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

export function loadAqidahBook(id: AqidahBookId): Promise<AqidahBookData> {
  return load<AqidahBookData>(`${id}.json`);
}

export function loadAqidahLexicon(): Promise<AqidahLexEntry[]> {
  return load<AqidahLexEntry[]>('lexicon.json');
}

// ── Токенизация арабского текста для тап-по-слову (зеркалит scripts/aqidah/build_word_data.py) ──
const DIACRITICS_RE = /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]/g;
const TOKEN_RE = /[ؐ-ؚء-ٰٟۖ-ۭ࣓-ࣿ]+/g;
const ALEF_RE = /[إأآٱ]/g;

export function normalizeAqidahWord(w: string): string {
  return w.replace(DIACRITICS_RE, '').replace(/ـ/g, '')
    .replace(ALEF_RE, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
}

export type ArPart = { word: true; text: string; key: string } | { word: false; text: string };

/** Разбивает арабский текст на куски: слова (тап-по-слову) + прочее (пробелы, скобки, цифры аятов). */
export function splitArabicForTap(text: string): ArPart[] {
  const parts: ArPart[] = [];
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text))) {
    if (m.index > last) parts.push({ word: false, text: text.slice(last, m.index) });
    const tok = m[0];
    const key = normalizeAqidahWord(tok);
    parts.push(key.length >= 2 ? { word: true, text: tok, key } : { word: false, text: tok });
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push({ word: false, text: text.slice(last) });
  return parts;
}

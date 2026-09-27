/**
 * Статические данные раздела «Акида» (public/aqidah/, готовятся
 * scripts/aqidah/*.py + ручной перевод *_ru.json). Грузим по требованию.
 */
export interface AqidahPoint { ar: string; ru: string }
export interface AqidahLesson { title_ru: string; points: AqidahPoint[] }
export interface AqidahBookData { lessons: AqidahLesson[] }

export type AqidahBookId = 'usul' | 'qawaid';

const BASE = '/aqidah/';
const cache = new Map<AqidahBookId, Promise<AqidahBookData>>();

export function loadAqidahBook(id: AqidahBookId): Promise<AqidahBookData> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`${BASE}${id}.json`).then(r => {
      if (!r.ok) throw new Error(`aqidah data ${id}: HTTP ${r.status}`);
      return r.json() as Promise<AqidahBookData>;
    });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

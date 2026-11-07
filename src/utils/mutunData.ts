/**
 * Данные раздела «Мутун талиб аль-ильм» (public/mutun/, готовятся scripts/mutun/*.py).
 * index.json — список книг; <id>.json — главы и абзацы; lexicon.json — слова для тапа.
 */
import type { Lang } from '../i18n';
import type { AqidahLexEntry } from './aqidahData';
import { L } from '../components/quran/qi18n';

export interface MutunPoint { ar: string; ru?: string; tj?: string; uz?: string }
export interface MutunChapter { title_ar: string; points: MutunPoint[] }
export interface MutunBook { id: string; level: number; title_ar: string; chapters: MutunChapter[] }
export interface MutunIndexEntry {
  id: string; level: number; title_ar: string; title_ru: string; sub_ru: string; chapters: number; points: number;
}

const cache = new Map<string, Promise<unknown>>();
function load<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`/mutun/${path}`).then(r => {
      if (!r.ok) throw new Error(`mutun data ${path}: HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

export const loadMutunIndex = () => load<MutunIndexEntry[]>('index.json');
export const loadMutunBook = (id: string) => load<MutunBook>(`${id}.json`);
export const loadMutunLexicon = () => load<AqidahLexEntry[]>('lexicon.json');

/** Перевод пункта на язык ученика (с падением на русский); null — перевода ещё нет. */
export function mutunPointText(pt: MutunPoint, lang: Lang): string | null {
  const t = lang === 'uz' ? pt.uz : lang === 'tj' ? pt.tj : pt.ru;
  return t ?? pt.ru ?? null;
}

/** Заголовок главы: арабский (красным); у безымянных частей — «Начало»/«Часть N». */
export function mutunChapterLabel(ch: MutunChapter, idx: number, lang: Lang): { text: string; ar: boolean } {
  if (ch.title_ar) return { text: ch.title_ar, ar: true };
  const n = idx + 1;
  return idx === 0
    ? { text: L(lang, 'Начало', 'Beginning', 'Boshlanishi', 'Оғоз'), ar: false }
    : { text: L(lang, `Часть ${n}`, `Part ${n}`, `${n}-qism`, `Қисми ${n}`), ar: false };
}

/**
 * Статические данные тренажёра слов Корана (public/quran/, собираются
 * scripts/quran/build_quran_data.py). Грузим по требованию и держим в памяти.
 */
import type { Lang } from '../i18n';

export interface SurahInfo {
  n: number; ar: string; en: string; meaning_en: string;
  ayahs: number; pages: [number, number]; place: string;
}
export interface QuranIndex {
  surahs: SurahInfo[];
  juz: { n: number; page: number }[];
  hizb: { n: number; page: number }[];
  pages: [number, number, number[]][];   // [juz, hizb, surahs] для страниц 1..604
}
/** [текст, id леммы, id приставок, id окончаний, en, ru, транслит] */
export type PageWord = [string, number, number[], number[], string, string, string];
export interface AyahFragment { k: string; f?: number; w: PageWord[] }
export interface QuranPageData { p: number; juz: number; hizb: number; a: AyahFragment[] }
/** [арабская лемма, корень, часть речи, сколько раз в Коране, первое место s:a:w] */
export type Lemma = [string, string, string, number, string];
export interface Lexicon { lemmas: Lemma[]; affixes: string[][] }
export interface Meanings { reviewed: boolean; lemmas: string[]; affixes: string[] }
export type SurahNames = Record<'ru' | 'uz' | 'tj' | 'en', string[]>;

export const TOTAL_PAGES = 604;
const BASE = '/quran/';

const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(BASE + path).then(r => {
      if (!r.ok) throw new Error(`quran data ${path}: HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path));   // не кэшируем ошибку — можно повторить
    cache.set(path, p);
  }
  return p;
}

export function meaningLang(lang: Lang): 'ru' | 'uz' | 'tj' | 'en' {
  return lang === 'ar' ? 'ru' : lang;
}

export const loadIndex = () => load<QuranIndex>('index.json');
export const loadLexicon = () => load<Lexicon>('lexicon.json');
export const loadSurahNames = () => load<SurahNames>('surah_names.json');
export const loadMeanings = (lang: Lang) => load<Meanings>(`meanings/${meaningLang(lang)}.json`);
export const loadPage = (p: number) => load<QuranPageData>(`pages/${String(p).padStart(3, '0')}.json`);

/** «ас-Сирадж»: [индекс фрагмента, индекс слова (-1 = весь аят), сколько слов, фраза, объяснение] */
export type SirajEntry = [number, number, number, string, string];
/** Объяснения «Сираджа» для страницы (пустой список, если файла нет). */
export const loadSiraj = (p: number) =>
  load<SirajEntry[]>(`siraj/${String(p).padStart(3, '0')}.json`).catch(() => [] as SirajEntry[]);

/** Предзагрузка соседней страницы, чтобы следующий урок открывался мгновенно. */
export function prefetchPage(p: number) {
  if (p >= 1 && p <= TOTAL_PAGES) loadPage(p).catch(() => {});
}

export function surahName(names: SurahNames | null, lang: Lang, s: SurahInfo): string {
  const key = meaningLang(lang);
  return names?.[key]?.[s.n - 1] ?? s.en;
}

/** Номер слова в аяте для i-го слова фрагмента (фрагмент может начинаться не с 1-го слова). */
export function wordPosition(frag: AyahFragment, i: number): number {
  return (frag.f ?? 1) + i;
}

export function parseKey(k: string): [number, number] {
  const [s, a] = k.split(':').map(Number);
  return [s, a];
}

/** Уникальные леммы страницы в порядке первого появления. */
export function pageLemmas(page: QuranPageData): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const fr of page.a) for (const w of fr.w) {
    if (!seen.has(w[1])) { seen.add(w[1]); out.push(w[1]); }
  }
  return out;
}

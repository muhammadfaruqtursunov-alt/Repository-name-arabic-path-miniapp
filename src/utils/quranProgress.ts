/**
 * Прогресс ученика в тренажёре слов Корана — хранится у самого ученика:
 * Telegram CloudStorage (синхронизируется между его устройствами) + localStorage.
 * В нашу базу уходят только цифры для статистики.
 *
 * Выученные леммы — битовая маска (4 800 бит ≈ 800 символов base64): влезает
 * в один ключ CloudStorage (лимит 4 096 символов).
 */
import { useEffect, useState } from 'react';

const LEMMA_BITS = 4800;
const AFFIX_BITS = 64;
const PAGE_BITS = 605;          // индексы 1..604
const LS_KEY = 'ap_quran_v1';
const CLOUD_KEYS = ['q_lem', 'q_aff', 'q_pg', 'q_meta'] as const;

/** Чтецы (everyayah.com). name — кириллицей (ru/tj), latin — для en/uz. */
export const RECITERS = [
  { id: 'Husary_Muallim_128kbps', name: 'Хусари · Муаллим', latin: 'Husary · Muallim' },
  { id: 'Husary_128kbps_Mujawwad', name: 'Хусари · Муджаввад', latin: 'Husary · Mujawwad' },
  { id: 'Alafasy_128kbps', name: 'Мишари Альафаси', latin: 'Mishary Alafasy' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Миншави · Муратталь', latin: 'Minshawy · Murattal' },
] as const;

interface Meta { last: number; reciter: string; lastReview: number; updated: number }

interface State {
  lemmas: Uint8Array;
  affixes: Uint8Array;
  pages: Uint8Array;
  meta: Meta;
}

const bytes = (bits: number) => new Uint8Array(Math.ceil(bits / 8));

function toB64(a: Uint8Array): string {
  let s = '';
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s);
}

function fromB64(s: string | undefined, bits: number): Uint8Array {
  const out = bytes(bits);
  if (!s) return out;
  try {
    const raw = atob(s);
    for (let i = 0; i < Math.min(raw.length, out.length); i++) out[i] = raw.charCodeAt(i);
  } catch { /* повреждённые данные — начинаем с нуля */ }
  return out;
}

const getBit = (a: Uint8Array, i: number) => (a[i >> 3] & (1 << (i & 7))) !== 0;
function setBit(a: Uint8Array, i: number, on: boolean) {
  if (on) a[i >> 3] |= 1 << (i & 7);
  else a[i >> 3] &= ~(1 << (i & 7));
}
function orInto(dst: Uint8Array, src: Uint8Array) {
  for (let i = 0; i < dst.length; i++) dst[i] |= src[i] ?? 0;
}
function countBits(a: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) { let v = a[i]; while (v) { n += v & 1; v >>= 1; } }
  return n;
}

const defaultMeta = (): Meta => ({ last: 0, reciter: RECITERS[0].id, lastReview: 0, updated: 0 });

function parseMeta(s: string | undefined): Meta {
  try { return { ...defaultMeta(), ...(s ? JSON.parse(s) : {}) }; } catch { return defaultMeta(); }
}

function readLocal(): State {
  let raw: Record<string, string> = {};
  try { raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { /* пусто */ }
  return {
    lemmas: fromB64(raw.q_lem, LEMMA_BITS),
    affixes: fromB64(raw.q_aff, AFFIX_BITS),
    pages: fromB64(raw.q_pg, PAGE_BITS),
    meta: parseMeta(raw.q_meta),
  };
}

const state: State = readLocal();
let version = 0;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function cloud() {
  const tg = window.Telegram?.WebApp;
  if (!tg?.CloudStorage || !tg.initData) return null;
  if (tg.isVersionAtLeast && !tg.isVersionAtLeast('6.9')) return null;
  return tg.CloudStorage;
}

function serialize(): Record<(typeof CLOUD_KEYS)[number], string> {
  return {
    q_lem: toB64(state.lemmas),
    q_aff: toB64(state.affixes),
    q_pg: toB64(state.pages),
    q_meta: JSON.stringify(state.meta),
  };
}

function changed() {
  state.meta.updated = Date.now();
  version++;
  listeners.forEach(fn => fn());
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

function save() {
  saveTimer = null;
  const data = serialize();
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* нет места */ }
  const cs = cloud();
  if (cs) for (const k of CLOUD_KEYS) cs.setItem(k, data[k]);
}

let cloudLoaded: Promise<void> | null = null;

/** Подтягивает прогресс с других устройств ученика (объединяет с локальным). */
export function syncFromCloud(): Promise<void> {
  if (cloudLoaded) return cloudLoaded;
  cloudLoaded = new Promise(resolve => {
    const cs = cloud();
    if (!cs) { resolve(); return; }
    cs.getItems([...CLOUD_KEYS], (err, values) => {
      if (!err && values) {
        orInto(state.lemmas, fromB64(values.q_lem, LEMMA_BITS));
        orInto(state.affixes, fromB64(values.q_aff, AFFIX_BITS));
        orInto(state.pages, fromB64(values.q_pg, PAGE_BITS));
        const m = parseMeta(values.q_meta);
        if (m.updated > state.meta.updated) state.meta = { ...m, lastReview: Math.max(m.lastReview, state.meta.lastReview) };
        version++;
        listeners.forEach(fn => fn());
        save();
      }
      resolve();
    });
  });
  return cloudLoaded;
}

// ── чтение ──
export const isLemmaLearned = (id: number) => getBit(state.lemmas, id);
export const isAffixSeen = (id: number) => getBit(state.affixes, id);
export const isPageDone = (p: number) => getBit(state.pages, p);
export const learnedCount = () => countBits(state.lemmas);
export const pagesDoneCount = () => countBits(state.pages);
export const lastPage = () => state.meta.last;
export const reciter = () => state.meta.reciter;
export const lastReview = () => state.meta.lastReview;
export function learnedLemmaIds(): number[] {
  const out: number[] = [];
  for (let i = 0; i < LEMMA_BITS; i++) if (getBit(state.lemmas, i)) out.push(i);
  return out;
}

// ── запись ──
export function setLemmasLearned(ids: number[], on: boolean) {
  ids.forEach(id => setBit(state.lemmas, id, on));
  changed();
}
export function markAffixesSeen(ids: number[]) {
  if (!ids.length) return;
  ids.forEach(id => setBit(state.affixes, id, true));
  changed();
}
export function markPageDone(p: number) { setBit(state.pages, p, true); changed(); }
export function setLastPage(p: number) { state.meta.last = p; changed(); }
export function setReciter(id: string) { state.meta.reciter = id; changed(); }
export function setLastReview(ts: number) { state.meta.lastReview = ts; changed(); }

/** Первая непройденная страница после последней открытой (или с начала). */
export function nextPageToLearn(): number {
  const start = Math.max(1, state.meta.last);
  for (let p = start; p <= 604; p++) if (!isPageDone(p)) return p;
  for (let p = 1; p < start; p++) if (!isPageDone(p)) return p;
  return start;
}

/** Перерисовывает компонент при любом изменении прогресса. */
export function useQuranProgress(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = () => setV(version);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return v;
}

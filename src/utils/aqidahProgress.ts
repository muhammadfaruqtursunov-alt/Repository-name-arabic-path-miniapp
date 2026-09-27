/**
 * Прогресс ученика в разделе «Акида»: какие уроки пройдены (по каждой книге)
 * и какие слова словаря выучены. Тот же принцип хранения, что и у Корана:
 * Telegram CloudStorage (между устройствами) + localStorage.
 */
import { useEffect, useState } from 'react';
import type { AqidahBookId } from './aqidahData';

/** Размер словаря на момент последней сборки scripts/aqidah/build_word_data.py. */
const WORD_BITS = 1154;

const LS_KEY = 'ap_aqidah_v1';
const CLOUD_KEYS = ['aq_usul', 'aq_qawaid', 'aq_words'] as const;

interface State { usul: Set<number>; qawaid: Set<number>; words: Uint8Array }

function parseSet(s: string | undefined): Set<number> {
  try { return new Set(s ? (JSON.parse(s) as number[]) : []); } catch { return new Set(); }
}
function serializeSet(s: Set<number>): string { return JSON.stringify([...s]); }

const wordBytes = () => new Uint8Array(Math.ceil(WORD_BITS / 8));
function toB64(a: Uint8Array): string {
  let s = '';
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s);
}
function fromB64(s: string | undefined): Uint8Array {
  const out = wordBytes();
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

function readLocal(): State {
  let raw: Record<string, string> = {};
  try { raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { /* пусто */ }
  return { usul: parseSet(raw.aq_usul), qawaid: parseSet(raw.aq_qawaid), words: fromB64(raw.aq_words) };
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

function changed() {
  version++;
  listeners.forEach(fn => fn());
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

function serialize() {
  return { aq_usul: serializeSet(state.usul), aq_qawaid: serializeSet(state.qawaid), aq_words: toB64(state.words) };
}

function save() {
  saveTimer = null;
  const data = serialize();
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* нет места */ }
  const cs = cloud();
  if (cs) for (const k of CLOUD_KEYS) cs.setItem(k, data[k]);
}

let cloudLoaded: Promise<void> | null = null;

export function syncAqidahFromCloud(): Promise<void> {
  if (cloudLoaded) return cloudLoaded;
  cloudLoaded = new Promise(resolve => {
    const cs = cloud();
    if (!cs) { resolve(); return; }
    cs.getItems([...CLOUD_KEYS], (err, values) => {
      if (!err && values) {
        for (const id of parseSet(values.aq_usul)) state.usul.add(id);
        for (const id of parseSet(values.aq_qawaid)) state.qawaid.add(id);
        orInto(state.words, fromB64(values.aq_words));
        version++;
        listeners.forEach(fn => fn());
        save();
      }
      resolve();
    });
  });
  return cloudLoaded;
}

export const isLessonDone = (book: AqidahBookId, lessonIdx: number) => state[book].has(lessonIdx);
export const lessonsDoneCount = (book: AqidahBookId) => state[book].size;
export function markLessonDone(book: AqidahBookId, lessonIdx: number) {
  state[book].add(lessonIdx);
  changed();
}

export const isWordLearned = (id: number) => getBit(state.words, id);
export const learnedWordCount = () => countBits(state.words);
export function setWordsLearned(ids: number[], on: boolean) {
  if (!ids.length) return;
  ids.forEach(id => setBit(state.words, id, on));
  changed();
}

/** Перерисовывает компонент при любом изменении прогресса. */
export function useAqidahProgress(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = () => setV(version);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return v;
}

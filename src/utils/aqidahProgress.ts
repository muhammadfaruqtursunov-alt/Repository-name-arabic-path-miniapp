/**
 * Прогресс ученика в разделе «Акида» — какие уроки (группы пунктов) пройдены,
 * по каждой книге отдельно. Тот же принцип хранения, что и у Корана:
 * Telegram CloudStorage (между устройствами) + localStorage.
 */
import { useEffect, useState } from 'react';
import type { AqidahBookId } from './aqidahData';

const LS_KEY = 'ap_aqidah_v1';
const CLOUD_KEYS = ['aq_usul', 'aq_qawaid'] as const;

interface State { usul: Set<number>; qawaid: Set<number> }

function parseSet(s: string | undefined): Set<number> {
  try { return new Set(s ? (JSON.parse(s) as number[]) : []); } catch { return new Set(); }
}
function serializeSet(s: Set<number>): string { return JSON.stringify([...s]); }

function readLocal(): State {
  let raw: Record<string, string> = {};
  try { raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { /* пусто */ }
  return { usul: parseSet(raw.aq_usul), qawaid: parseSet(raw.aq_qawaid) };
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

function save() {
  saveTimer = null;
  const data = { aq_usul: serializeSet(state.usul), aq_qawaid: serializeSet(state.qawaid) };
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

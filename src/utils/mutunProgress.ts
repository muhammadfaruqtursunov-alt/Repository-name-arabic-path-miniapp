/**
 * Какие главы Мутун пройдены. localStorage + Telegram CloudStorage (между устройствами).
 * Ключ главы: "<книга>:<номер главы>".
 */
import { useEffect, useState } from 'react';
import { cloudGetChunked, cloudSetChunked } from './tgCloud';

const LS_KEY = 'ap_mutun_done_v1';
const listeners = new Set<() => void>();

function readLocal(): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    return new Set(Array.isArray(v) ? (v as string[]) : []);
  } catch { return new Set(); }
}

let done = readLocal();

function commit(next: Set<string>) {
  done = next;
  const text = JSON.stringify([...done]);
  try { localStorage.setItem(LS_KEY, text); } catch { /* нет места */ }
  cloudSetChunked('mu_done', text);
  listeners.forEach(fn => fn());
}

export const isChapterDone = (book: string, idx: number) => done.has(`${book}:${idx}`);
export const bookDoneCount = (book: string) => [...done].filter(k => k.startsWith(`${book}:`)).length;

export function markChapterDone(book: string, idx: number) {
  if (done.has(`${book}:${idx}`)) return;
  commit(new Set(done).add(`${book}:${idx}`));
}

let synced = false;
/** Подтягивает прогресс из облака Telegram и объединяет с локальным. */
export async function syncMutunProgressFromCloud() {
  if (synced) return;
  synced = true;
  try {
    const text = await cloudGetChunked('mu_done');
    if (!text) return;
    const remote = JSON.parse(text) as string[];
    const merged = new Set([...done, ...remote]);
    if (merged.size !== done.size) commit(merged);
  } catch { /* облако недоступно */ }
}

export function useMutunProgress() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
}

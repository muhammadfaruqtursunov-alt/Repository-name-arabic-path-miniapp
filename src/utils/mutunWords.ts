/**
 * «Мои слова»: слова из Мутун, которые ученик отметил как незнакомые.
 * localStorage + Telegram CloudStorage (кусками), чтобы слова не терялись при очистке данных.
 */
import { useEffect, useState } from 'react';
import { cloudGetChunked, cloudSetChunked } from './tgCloud';

export interface SavedWord { k: string; ar: string; gl: string; at: number }

const LS_KEY = 'ap_mutun_words_v1';
const listeners = new Set<() => void>();

function read(): SavedWord[] {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    return Array.isArray(v) ? (v as SavedWord[]) : [];
  } catch { return []; }
}

let words: SavedWord[] = read();

function commit(next: SavedWord[]) {
  words = next;
  const text = JSON.stringify(words);
  try { localStorage.setItem(LS_KEY, text); } catch { /* нет места */ }
  cloudSetChunked('mu_w', text);
  listeners.forEach(fn => fn());
}

export const isWordSaved = (k: string) => words.some(w => w.k === k);

export function toggleSavedWord(w: Omit<SavedWord, 'at'>) {
  commit(isWordSaved(w.k) ? words.filter(x => x.k !== w.k) : [{ ...w, at: Date.now() }, ...words]);
}

export function removeSavedWord(k: string) { commit(words.filter(w => w.k !== k)); }

let synced = false;
/** Подтягивает слова из облака Telegram и объединяет с локальными (новые сверху). */
export async function syncMutunWordsFromCloud() {
  if (synced) return;
  synced = true;
  try {
    const text = await cloudGetChunked('mu_w');
    if (!text) return;
    const remote = JSON.parse(text) as SavedWord[];
    const have = new Set(words.map(w => w.k));
    const extra = remote.filter(w => !have.has(w.k));
    if (extra.length) commit([...words, ...extra].sort((a, b) => b.at - a.at));
  } catch { /* облако недоступно */ }
}

export function useSavedWords(): SavedWord[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return words;
}

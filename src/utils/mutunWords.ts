/**
 * «Мои слова»: слова из Мутун, которые ученик отметил как незнакомые.
 * Хранится в localStorage этого устройства (облако Telegram слишком мало для списка).
 */
import { useEffect, useState } from 'react';

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
  try { localStorage.setItem(LS_KEY, JSON.stringify(words)); } catch { /* нет места */ }
  listeners.forEach(fn => fn());
}

export const isWordSaved = (k: string) => words.some(w => w.k === k);

export function toggleSavedWord(w: Omit<SavedWord, 'at'>) {
  commit(isWordSaved(w.k) ? words.filter(x => x.k !== w.k) : [{ ...w, at: Date.now() }, ...words]);
}

export function removeSavedWord(k: string) { commit(words.filter(w => w.k !== k)); }

export function useSavedWords(): SavedWord[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return words;
}

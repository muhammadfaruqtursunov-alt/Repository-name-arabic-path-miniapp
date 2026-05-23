export interface SRSWord {
  word_id: number;
  ar: string;
  trans: string;
  correct: string; // translation in user's language
  due: number;     // timestamp ms
  interval: number; // days
  ease: number;    // 1.3 – 2.5
}

const KEY = 'ap_srs_words';

export function getSRSWords(): SRSWord[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function save(words: SRSWord[]) {
  localStorage.setItem(KEY, JSON.stringify(words));
}

export function addWrongWord(word_id: number, ar: string, trans: string, correct: string) {
  const words = getSRSWords();
  const existing = words.find(w => w.word_id === word_id);
  if (existing) {
    // Wrong again — shorten interval
    existing.interval = Math.max(1, Math.floor(existing.interval * 0.5));
    existing.ease = Math.max(1.3, existing.ease - 0.2);
    existing.due = Date.now() + existing.interval * 86_400_000;
  } else {
    words.push({ word_id, ar, trans, correct, due: Date.now() + 86_400_000, interval: 1, ease: 2.0 });
  }
  save(words);
}

export function markWordKnown(word_id: number) {
  const words = getSRSWords();
  const w = words.find(w => w.word_id === word_id);
  if (!w) return;
  w.interval = Math.round(w.interval * w.ease);
  w.ease = Math.min(2.5, w.ease + 0.1);
  w.due = Date.now() + w.interval * 86_400_000;
  save(words);
}

export function getDueWords(): SRSWord[] {
  const now = Date.now();
  return getSRSWords().filter(w => w.due <= now);
}

export function getAllSRSWords(): SRSWord[] {
  return getSRSWords();
}

export function clearSRSWord(word_id: number) {
  save(getSRSWords().filter(w => w.word_id !== word_id));
}

export function isWordSaved(word_id: number): boolean {
  return getSRSWords().some(w => w.word_id === word_id);
}

// Manual bookmark save — doesn't apply wrong-answer penalty
export function saveWordManually(word_id: number, ar: string, trans: string, correct: string) {
  const words = getSRSWords();
  if (words.some(w => w.word_id === word_id)) return; // already saved
  words.push({ word_id, ar, trans, correct, due: Date.now(), interval: 1, ease: 2.0 });
  save(words);
}

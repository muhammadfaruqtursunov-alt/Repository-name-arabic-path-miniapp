/**
 * Тренажёр слов — свои наборы слов с переводом.
 * Хранится локально (localStorage), логика повторяет уроки/тесты курса:
 * карточки → визуальный тест → письменный тест.
 */

export interface TrainerWord {
  ar: string;      // арабское слово
  tr?: string;     // транслитерация (необязательно)
  trans: string;   // перевод
}

export interface TrainerSet {
  id: string;
  name: string;
  words: TrainerWord[];
  created: number;
}

const SETS_KEY = 'ap_trainer_sets';
const PROG_KEY = 'ap_trainer_prog';

// ── Хранилище наборов ────────────────────────────────────────────
export function loadSets(): TrainerSet[] {
  try {
    const raw = localStorage.getItem(SETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as TrainerSet[]) : [];
  } catch {
    return [];
  }
}

function saveSets(sets: TrainerSet[]): void {
  try {
    localStorage.setItem(SETS_KEY, JSON.stringify(sets));
  } catch {
    /* хранилище недоступно — молча игнорируем */
  }
}

export function upsertSet(set: TrainerSet): void {
  const sets = loadSets();
  const i = sets.findIndex((s) => s.id === set.id);
  if (i >= 0) sets[i] = set;
  else sets.unshift(set);
  saveSets(sets);
}

export function deleteSet(id: string): void {
  saveSets(loadSets().filter((s) => s.id !== id));
}

export function newId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ── Разбор вставленного текста ───────────────────────────────────
// Поддерживаем: "كتاب — книга", "كتاب - книга", "كتاب | книга",
// "كتاب = книга", таб, а также 3 части: "كتاب — kitab — книга".
const SEP = /\s*(?:—|–|\||=|\t|\s-\s)\s*/;

export function parseWords(text: string): TrainerWord[] {
  const out: TrainerWord[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(SEP).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;              // нет перевода — пропускаем
    if (parts.length === 2) {
      out.push({ ar: parts[0], trans: parts[1] });
    } else {
      // 3+ частей: арабский — транслитерация — перевод (остальноеклеим в перевод)
      out.push({ ar: parts[0], tr: parts[1], trans: parts.slice(2).join(', ') });
    }
  }
  return out;
}

// ── Сравнение письменного ответа ─────────────────────────────────
// Диапазон Unicode "combining diacritical marks" (U+0300–U+036F), собран
// через String.fromCharCode, чтобы не тащить в исходник escape-последовательности.
const REMOVE_ACCENTS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

export function normAnswer(s: string): string {
  return s
    .normalize('NFKC')            // полноширинные/составные символы → обычные
    .replace(REMOVE_ACCENTS, '')  // убрать диакритику (стресс-ударение, которое
                                   // телефон иногда сам подставляет при автокоррекции)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"'`()[\]«»""'']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Допустимые варианты перевода: "книга, том" / "книга; том" / "книга (том)" /
 * "книга [уточнение]". Содержимое скобок считаем и альтернативой (через
 * запятую), и необязательным уточнением — ответ засчитывается и без него,
 * чтобы студента не наказывало за короткий, но верный ответ.
 */
export function answerVariants(trans: string): string[] {
  const out = new Set<string>();

  const asAlternatives = trans.replace(/[([]/g, ',').replace(/[)\]]/g, ',');
  for (const v of asAlternatives.split(/[,;/]/)) {
    const n = normAnswer(v);
    if (n) out.add(n);
  }

  const withoutParenthetical = trans.replace(/[([][^)\]]*[)\]]/g, '');
  for (const v of withoutParenthetical.split(/[,;/]/)) {
    const n = normAnswer(v);
    if (n) out.add(n);
  }

  return [...out];
}

// ── Утилиты ──────────────────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Прогресс по набору (визуальный / письменный тест) ────────────
type ProgMap = Record<string, { visual?: boolean; written?: boolean }>;

function loadProg(): ProgMap {
  try {
    const raw = localStorage.getItem(PROG_KEY);
    return raw ? (JSON.parse(raw) as ProgMap) : {};
  } catch {
    return {};
  }
}

function saveProg(p: ProgMap): void {
  try {
    localStorage.setItem(PROG_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function markTrainerPassed(setId: string, mode: 'visual' | 'written'): void {
  const p = loadProg();
  p[setId] = { ...(p[setId] ?? {}), [mode]: true };
  saveProg(p);
}

export function isTrainerPassed(setId: string, mode: 'visual' | 'written'): boolean {
  return loadProg()[setId]?.[mode] === true;
}

export function resetTrainerProgress(setId: string): void {
  const p = loadProg();
  delete p[setId];
  saveProg(p);
}

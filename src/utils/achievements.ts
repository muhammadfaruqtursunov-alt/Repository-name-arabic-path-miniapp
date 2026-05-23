export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

// 12 achievements — 3 rows × 4 columns
// Row 1: vocabulary  Row 2: streak  Row 3: tests + books
export const ACHIEVEMENTS: Achievement[] = [
  // ── Row 1: словарный запас ─────────────────────────────────────
  { id: 'word_1',    emoji: '🌱', title: 'Первое слово', desc: 'Выучил первое слово'       },
  { id: 'word_10',   emoji: '🌿', title: '10 слов',      desc: 'Выучил 10 слов'            },
  { id: 'word_50',   emoji: '🌳', title: '50 слов',      desc: 'Выучил 50 слов'            },
  { id: 'word_100',  emoji: '⭐', title: '100 слов',     desc: 'Выучил 100 слов'           },
  // ── Row 2: серия дней ─────────────────────────────────────────
  { id: 'streak_3',  emoji: '🔥', title: '3 дня',        desc: 'Занимался 3 дня подряд'    },
  { id: 'streak_7',  emoji: '⚡', title: '7 дней',       desc: 'Занимался 7 дней подряд'   },
  { id: 'streak_14', emoji: '💫', title: '14 дней',      desc: 'Занимался 14 дней подряд'  },
  { id: 'streak_30', emoji: '🏆', title: '30 дней',      desc: 'Занимался 30 дней подряд'  },
  // ── Row 3: тесты + книги ──────────────────────────────────────
  { id: 'tests_100', emoji: '🎯', title: '100 тестов',   desc: 'Прошёл 100 тестов'         },
  { id: 'tests_500', emoji: '💎', title: '500 тестов',   desc: 'Прошёл 500 тестов'         },
  { id: 'book_1',    emoji: '📚', title: 'Том 1',        desc: 'Завершил первый том'       },
  { id: 'crown',     emoji: '👑', title: 'Все тома',     desc: 'Завершил все три тома'     },
];

const KEY = 'ap_achievements';

export function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function saveUnlocked(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function checkAchievements(params: {
  totalLearned: number;
  streak: number;
  questionsAsked: number;
  book1Complete?: boolean;
  allBooksComplete?: boolean;
}): Achievement[] {
  const unlocked = getUnlocked();
  const newlyUnlocked: Achievement[] = [];

  function tryUnlock(id: string) {
    if (unlocked.includes(id)) return;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    unlocked.push(id);
    newlyUnlocked.push(ach);
  }

  // Vocabulary
  if (params.totalLearned >= 1)   tryUnlock('word_1');
  if (params.totalLearned >= 10)  tryUnlock('word_10');
  if (params.totalLearned >= 50)  tryUnlock('word_50');
  if (params.totalLearned >= 100) tryUnlock('word_100');

  // Streak
  if (params.streak >= 3)  tryUnlock('streak_3');
  if (params.streak >= 7)  tryUnlock('streak_7');
  if (params.streak >= 14) tryUnlock('streak_14');
  if (params.streak >= 30) tryUnlock('streak_30');

  // Tests (proxy: totalLearned — every word requires passing tests)
  if (params.totalLearned >= 100) tryUnlock('tests_100');
  if (params.totalLearned >= 500) tryUnlock('tests_500');

  // Books
  if (params.book1Complete)    tryUnlock('book_1');
  if (params.allBooksComplete) tryUnlock('crown');

  if (newlyUnlocked.length > 0) saveUnlocked(unlocked);
  return newlyUnlocked;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_test',   emoji: '🌱', title: 'Первый шаг',      desc: 'Прошёл первый тест' },
  { id: 'words_50',     emoji: '📖', title: '50 слов',         desc: 'Выучил 50 слов' },
  { id: 'words_100',    emoji: '📚', title: '100 слов',        desc: 'Выучил 100 слов' },
  { id: 'words_200',    emoji: '🎓', title: '200 слов',        desc: 'Выучил 200 слов' },
  { id: 'streak_7',     emoji: '🔥', title: '7 дней подряд',   desc: 'Занимался 7 дней без перерыва' },
  { id: 'streak_30',    emoji: '⚡', title: '30 дней подряд',  desc: 'Занимался 30 дней без перерыва' },
  { id: 'perfect_test', emoji: '💎', title: 'Без ошибок',      desc: 'Прошёл тест без единой ошибки' },
];

const KEY = 'ap_achievements';

export function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function saveUnlocked(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

// Returns list of newly unlocked achievement IDs
export function checkAchievements(params: {
  totalLearned: number;
  streak: number;
  questionsAsked: number;
  perfectTest?: boolean;
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

  if (params.questionsAsked > 0)       tryUnlock('first_test');
  if (params.totalLearned >= 50)        tryUnlock('words_50');
  if (params.totalLearned >= 100)       tryUnlock('words_100');
  if (params.totalLearned >= 200)       tryUnlock('words_200');
  if (params.streak >= 7)               tryUnlock('streak_7');
  if (params.streak >= 30)              tryUnlock('streak_30');
  if (params.perfectTest)               tryUnlock('perfect_test');

  if (newlyUnlocked.length > 0) saveUnlocked(unlocked);
  return newlyUnlocked;
}

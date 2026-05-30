/**
 * Отслеживает прохождение тестов (визуальный + письменный) в localStorage.
 * Используется для блокировки следующего урока.
 */

function storageKey(bookId: number, lesson: number, mode: 'visual' | 'written'): string {
  return `ap_test_${bookId}_${lesson}_${mode}`;
}

export function markTestPassed(bookId: number, lesson: number, mode: 'visual' | 'written'): void {
  try {
    localStorage.setItem(storageKey(bookId, lesson, mode), '1');
  } catch {}
}

export function isTestPassed(bookId: number, lesson: number, mode: 'visual' | 'written'): boolean {
  try {
    return localStorage.getItem(storageKey(bookId, lesson, mode)) === '1';
  } catch {
    return false;
  }
}

/**
 * Урок N открыт если:
 *   - N <= currentLesson (уже пройден или текущий)
 *   - ИЛИ оба теста урока N-1 сданы
 */
export function isLessonAccessible(
  bookId: number,
  lesson: number,
  currentLesson: number,
): boolean {
  if (lesson <= currentLesson) return true;
  const prev = lesson - 1;
  return isTestPassed(bookId, prev, 'visual') && isTestPassed(bookId, prev, 'written');
}

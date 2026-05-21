/* Arabic Path — API client
 * All requests are authenticated via X-Init-Data header (Telegram initData).
 * BASE_URL points to the Railway backend.
 */

const BASE_URL = 'https://arabskiy-put-v2-production.up.railway.app';

function getInitData(): string {
  try {
    return window.Telegram?.WebApp?.initData ?? '';
  } catch {
    return '';
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Init-Data': getInitData(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────

export interface UserProfile {
  user_id: number;
  name: string;
  lang: string;
  current_book: number;
  current_lesson: number;
  streak: number;
  total_learned: number;
  rank: number | null;
  total_students: number;
  book_info: {
    title_ru: string; title_tj: string; title_en: string;
    author: string; level_emoji: string; total_lessons: number;
  };
  book_progress: { learned: number; total: number; pct: number };
}

export interface VolumeInfo {
  book_id: number;
  title: string; title_ru: string; author: string;
  level: number; level_emoji: string;
  total_lessons: number; total_words: number;
  learned_words: number; pct: number;
  is_current: boolean;
}

export interface LessonInfo {
  lesson: number;
  total_words: number; learned_words: number; pct: number;
  is_current: boolean;
}

export interface WordCard {
  id: number; ar: string; trans: string; translation: string;
  ru: string; tj: string; en: string; uz: string;
}

export interface QuizChoice { label: string; word_id: number; }
export interface QuizQuestion {
  idx: number; total: number; word_id: number; ar: string; trans: string; mode: string;
  choices?: QuizChoice[];
  prompt?: string;
}
export interface QuizAnswerResult {
  correct: boolean; done?: boolean; feedback: string;
  failures?: number; reset?: boolean; motivation?: string;
  next?: QuizQuestion;
}

export interface GuideSection {
  key: string; emoji: string; title: string; phrase_count: number;
}

export interface GuidePhrase { ar: string; trans: string; translation: string; }
export interface GuideSectionContent {
  key: string; emoji: string; title: string; phrases: GuidePhrase[];
}

export interface GuideChoice { ref: string; label: string; }
export interface GuideQuestion {
  idx: number; total: number; correct_ref: string; ar: string; trans: string; mode: string;
  choices?: GuideChoice[];
}
export interface GuideAnswerResult {
  correct: boolean; done?: boolean; feedback: string;
  failures?: number; reset?: boolean; motivation?: string;
  next?: GuideQuestion;
}

export interface Stats {
  total_learned: number; streak: number; questions_asked: number;
  books: { book_id: number; total: number; learned: number; pct: number }[];
}

export interface Question {
  id: number; question: string; answer: string | null;
  answered: boolean; created_at: string | null;
}

// ── API functions ─────────────────────────────────────────────────

export const api = {
  // User
  getUser: () => request<UserProfile>('GET', '/api/webapp/user'),
  createUser: (name: string, lang: string, tg_id: number) =>
    request<{ ok: boolean }>('POST', '/api/webapp/user', { name, lang, tg_id }),
  setLang: (lang: string) =>
    request<{ ok: boolean }>('PUT', '/api/webapp/user/lang', { lang }),
  setName: (name: string) =>
    request<{ ok: boolean }>('PUT', '/api/webapp/user/name', { name }),

  // Volumes & Lessons
  getVolumes: () => request<VolumeInfo[]>('GET', '/api/webapp/volumes'),
  getLessons: (book: number) =>
    request<LessonInfo[]>('GET', `/api/webapp/volume/${book}/lessons`),
  getLesson: (book: number, lesson: number) =>
    request<{ book_id: number; lesson: number; words: WordCard[] }>(
      'GET', `/api/webapp/lesson/${book}/${lesson}`
    ),

  // Quiz
  startQuiz: (book: number, lesson: number, mode = 'visual') =>
    request<QuizQuestion>('POST', '/api/webapp/quiz/start', { book, lesson, mode }),
  answerQuiz: (word_id: number, chosen_id: number, mode = 'visual', typed?: string) =>
    request<QuizAnswerResult>('POST', '/api/webapp/quiz/answer',
      { word_id, chosen_id: chosen_id ?? -1, mode, typed }),

  // Umrah guide
  getUmrahSections: () => request<GuideSection[]>('GET', '/api/webapp/umrah/sections'),
  getUmrahSection: (key: string) =>
    request<GuideSectionContent>('GET', `/api/webapp/umrah/section/${key}`),
  startUmrahQuiz: (section_key: string, count = 10) =>
    request<GuideQuestion>('POST', '/api/webapp/umrah/quiz/start', { section_key, count }),
  answerUmrahQuiz: (
    correct_ref: string,
    lang: string,
    mode = 'visual',
    chosen_ref?: string,
    typed?: string,
  ) =>
    request<GuideAnswerResult>('POST', '/api/webapp/umrah/quiz/answer',
      { correct_ref, lang, mode, chosen_ref, typed }),

  // Stats
  getStats: () => request<Stats>('GET', '/api/webapp/stats'),

  // Teacher Q&A
  askQuestion: (question: string) =>
    request<{ ok: boolean; id: number }>('POST', '/api/webapp/question', { question }),
  getQuestions: () => request<Question[]>('GET', '/api/webapp/questions'),
};

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

export interface TeacherStats {
  total_students: number;
  active_students: number;
  total_words_learned: number;
  unanswered_questions: number;
  students: {
    user_id: number; name: string;
    current_book: number; current_lesson: number;
    learned: number; total_app_time: number;
  }[];
}

export interface UserProfile {
  user_id: number;
  name: string;
  lang: string;
  is_teacher: boolean;
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

export interface ReminderSettings {
  reminder_time: string | null;
  timezone: string;
}

export interface Stats {
  total_learned: number; streak: number; questions_asked: number;
  total_app_time: number;  // seconds
  books: { book_id: number; total: number; learned: number; pct: number }[];
}

export interface Question {
  id: number; question: string; answer: string | null;
  answered: boolean; created_at: string | null;
}

export interface TeacherQuestion {
  id: number; user_id: number; user_name: string;
  question: string; created_at: string | null;
}

export interface AllQuestion {
  id: number; user_id: number; user_name: string;
  question: string; answer: string | null;
  answered: boolean; created_at: string | null;
}

export interface AllStudent {
  user_id: number; name: string;
  current_book: number; current_lesson: number;
  learned: number; total_app_time: number;
}

export interface LazyStudent {
  user_id: number; name: string; lang: string;
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
  getReminder: () => request<ReminderSettings>('GET', '/api/webapp/user/reminder'),
  setReminder: (reminder_time: string | null, timezone: string) =>
    request<{ ok: boolean }>('PUT', '/api/webapp/user/reminder', { reminder_time, timezone }),

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

  // App config
  getAppConfig: () => request<{ bg_url: string }>('GET', '/api/webapp/config'),

  // Teacher
  getTeacherStats: () => request<TeacherStats>('GET', '/api/webapp/teacher/stats'),
  teacherGetQuestions: () => request<TeacherQuestion[]>('GET', '/api/webapp/teacher/questions'),
  teacherAnswerQuestion: (id: number, answer: string) =>
    request<{ ok: boolean }>('POST', `/api/webapp/teacher/answer/${id}`, { answer }),
  teacherBroadcast: (message: string) =>
    request<{ ok: boolean; sent: number; failed: number }>('POST', '/api/webapp/teacher/broadcast', { message }),
  teacherPersonalMessage: (user_id: number, message: string) =>
    request<{ ok: boolean }>('POST', '/api/webapp/teacher/message', { user_id, message }),
  setGlobalBg: (bg_url: string) =>
    request<{ ok: boolean }>('POST', '/api/webapp/teacher/config/bg', { bg_url }),

  // Stats
  getStats: () => request<Stats>('GET', '/api/webapp/stats'),
  addSession: (seconds: number) =>
    request<{ ok: boolean }>('POST', '/api/webapp/user/session', { seconds }),

  // Teacher Q&A
  askQuestion: (question: string) =>
    request<{ ok: boolean; id: number }>('POST', '/api/webapp/question', { question }),
  getQuestions: () => request<Question[]>('GET', '/api/webapp/questions'),

  // Extended teacher
  teacherGetAllStudents: () => request<AllStudent[]>('GET', '/api/webapp/teacher/students/all'),
  teacherGetLazy: () => request<LazyStudent[]>('GET', '/api/webapp/teacher/lazy'),
  teacherGetAllQuestions: () => request<AllQuestion[]>('GET', '/api/webapp/teacher/questions/all'),
  teacherResetStudent: (user_id: number) =>
    request<{ ok: boolean }>('POST', '/api/webapp/teacher/student/reset', { user_id }),
};

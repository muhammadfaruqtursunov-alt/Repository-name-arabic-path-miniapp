import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, MoonStar } from 'lucide-react';
import type { Lang } from '../i18n';
import { loadAqidahBook, loadAqidahLexicon } from '../utils/aqidahData';
import type { AqidahBookData, AqidahBookId, AqidahLexEntry } from '../utils/aqidahData';
import {
  isLessonDone, lessonsDoneCount, syncAqidahFromCloud, useAqidahProgress,
} from '../utils/aqidahProgress';
import { L } from '../components/quran/qi18n';
import AqidahLesson from './AqidahLesson';

interface Props {
  lang: Lang;
  onBack: () => void;
  onLocalBack: (fn: null | (() => void)) => void;
}

type View =
  | { kind: 'home' }
  | { kind: 'book'; book: AqidahBookId }
  | { kind: 'lesson'; book: AqidahBookId; idx: number };

const BOOKS: { id: AqidahBookId; title: (l: Lang) => string; subtitle: (l: Lang) => string }[] = [
  {
    id: 'usul',
    title: l => L(l, 'Три основы', 'The Three Fundamentals', 'Uch asos', 'Се асос'),
    subtitle: l => L(l, 'Кто твой Господь, твоя религия, твой пророк', 'Your Lord, your religion, your Prophet', 'Sizning Robbingiz, diningiz, payg‘ambaringiz', 'Парвардигори ту, дини ту, паёмбари ту'),
  },
  {
    id: 'qawaid',
    title: l => L(l, 'Четыре правила', 'The Four Rules', 'Toʻrt qoida', 'Чор қоида'),
    subtitle: l => L(l, 'Как распознать многобожие', 'How to recognize shirk', 'Shirkni qanday tanish mumkin', 'Чӣ гуна ширкро шинохт'),
  },
];

export default function Aqidah({ lang, onBack, onLocalBack }: Props) {
  useAqidahProgress();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [data, setData] = useState<Partial<Record<AqidahBookId, AqidahBookData>>>({});
  const [error, setError] = useState<AqidahBookId | null>(null);
  const [lexicon, setLexicon] = useState<AqidahLexEntry[] | null>(null);

  useEffect(() => { void syncAqidahFromCloud(); }, []);

  useEffect(() => {
    for (const b of BOOKS) {
      loadAqidahBook(b.id)
        .then(d => setData(prev => (prev[b.id] ? prev : { ...prev, [b.id]: d })))
        .catch(() => setError(b.id));
    }
    loadAqidahLexicon().then(setLexicon).catch(() => {});
  }, []);

  const lexIndex = useMemo(() => new Map((lexicon ?? []).map((e, i) => [e[0], i] as const)), [lexicon]);

  useEffect(() => {
    const parent: View | null =
      view.kind === 'lesson' ? { kind: 'book', book: view.book }
      : view.kind === 'book' ? { kind: 'home' }
      : null;
    onLocalBack(parent ? () => setView(parent) : null);
    return () => onLocalBack(null);
  }, [view, onLocalBack]);

  const header = (title: string, back: () => void) => (
    <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
      <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
        <ChevronLeft size={24} />
      </button>
      <h1 className="title-card" style={{ flex: 1 }}>{title}</h1>
    </div>
  );

  if (view.kind === 'home') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(L(lang, 'Акида', 'Aqidah', 'Aqida', 'Ақида'), onBack)}
        <div className="page-content">
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
            {L(lang, 'Основы вероучения Ахлю-Сунна, урок за уроком', 'Fundamentals of Ahl as-Sunnah creed, lesson by lesson', 'Ahli Sunna aqidasining asoslari, dars-baʼdars', 'Асосҳои ақидаи Аҳли Суннат, дарс ба дарс')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BOOKS.map(b => {
              const total = data[b.id]?.lessons.length ?? 0;
              const done = lessonsDoneCount(b.id);
              return (
                <button key={b.id} className="glass-card" onClick={() => setView({ kind: 'book', book: b.id })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', padding: '14px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MoonStar size={22} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="title-card" style={{ fontSize: 14 }}>{b.title(lang)}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{b.subtitle(lang)}</div>
                    {total > 0 && (
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        {done} / {total} {L(lang, 'уроков', 'lessons', 'dars', 'дарс')}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const book = view.book;
  const meta = BOOKS.find(b => b.id === book)!;
  const bookData = data[book];

  if (error === book) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(meta.title(lang), () => setView({ kind: 'home' }))}
        <div className="page-content">
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>
            {L(lang, 'Нет связи. Попробуйте позже.', 'No connection. Try again later.', 'Aloqa yoʻq. Keyinroq urinib koʻring.', 'Пайваст нест. Баъдтар кӯшиш кунед.')}
          </p>
        </div>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(meta.title(lang), () => setView({ kind: 'home' }))}
        <div className="page-content">
          <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (view.kind === 'book') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(meta.title(lang), () => setView({ kind: 'home' }))}
        <div className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookData.lessons.map((lesson, idx) => (
              <button key={idx} className="glass-card" onClick={() => setView({ kind: 'lesson', book, idx })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '12px 14px' }}>
                <span className="surah-medal">{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title-card" style={{ fontSize: 14 }}>{lesson.title_ru}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {lesson.points.length} {L(lang, 'пунктов', 'points', 'band', 'банд')}
                  </div>
                </div>
                {isLessonDone(book, idx) ? <CheckCircle2 size={18} color="var(--accent-teal)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // view.kind === 'lesson'
  if (!lexicon) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(bookData.lessons[view.idx].title_ru, () => setView({ kind: 'book', book }))}
        <div className="page-content">
          <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  const isLast = view.idx === bookData.lessons.length - 1;
  return (
    <AqidahLesson
      key={`${book}-${view.idx}`}
      lang={lang}
      book={book}
      lessonIdx={view.idx}
      lesson={bookData.lessons[view.idx]}
      lexicon={lexicon}
      lexIndex={lexIndex}
      isLast={isLast}
      onExit={() => setView({ kind: 'book', book })}
      onNext={() => setView({ kind: 'lesson', book, idx: view.idx + 1 })}
    />
  );
}

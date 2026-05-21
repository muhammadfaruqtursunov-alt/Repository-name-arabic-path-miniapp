import { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { LessonInfo } from '../api/client';
import ProgressBar from '../components/ProgressBar';

interface Props {
  lang: Lang;
  bookId: number;
  currentLesson: number;
  onBack: () => void;
  onStartLesson: (bookId: number, lesson: number) => void;
}

export default function VolumeScreen({ lang, bookId, currentLesson, onBack, onStartLesson }: Props) {
  const [lessons, setLessons] = useState<LessonInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLessons(bookId).then(setLessons).finally(() => setLoading(false));
  }, [bookId]);

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>
          📖 {t(lang, `book_${bookId}` as 'book_1')} — {t(lang, 'medina')}
        </h1>
      </div>

      {/* Lesson list */}
      <div className="page-content">
        {loading ? (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>{t(lang, 'loading')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lessons.map((l) => {
              const isDone    = l.pct === 100;
              const isCurrent = l.is_current;

              return (
                <div
                  key={l.lesson}
                  className={`glass-card${isCurrent ? ' glass-card--gold' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onStartLesson(bookId, l.lesson)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge--muted text-badge">
                        {String(l.lesson).padStart(2, '0')}
                      </span>
                      <span className="title-card">
                        {t(lang, 'lesson_num')} {l.lesson}
                      </span>
                    </div>
                    {isDone
                      ? <CheckCircle2 size={18} color="var(--accent-teal)" />
                      : isCurrent
                        ? <span className="badge badge--gold text-badge">{t(lang, 'current_badge')}</span>
                        : null}
                  </div>
                  <ProgressBar pct={l.pct} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {l.learned_words} / {l.total_words} {t(lang, 'words_count')}
                    </span>
                    <span style={{ fontSize: 12, color: isDone ? 'var(--accent-teal)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {l.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom button */}
      <div style={{ padding: '12px 16px 24px', background: 'var(--bg-deep)' }}>
        <button
          className="btn btn-primary"
          onClick={() => onStartLesson(bookId, currentLesson)}
        >
          {t(lang, 'btn_continue_lesson')}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2, Lock } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { LessonInfo } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import { isLessonAccessible } from '../utils/lessonProgress';

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 6, width: '80%', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lessons.map((l) => {
              const isDone      = l.pct === 100;
              const isCurrent   = l.is_current;
              const accessible  = isLessonAccessible(bookId, l.lesson, currentLesson);
              const locked      = !accessible;

              return (
                <div
                  key={l.lesson}
                  className={`glass-card${isCurrent ? ' glass-card--gold' : ''}`}
                  style={{
                    cursor: locked ? 'default' : 'pointer',
                    opacity: locked ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onClick={() => !locked && onStartLesson(bookId, l.lesson)}
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
                    {locked
                      ? <Lock size={16} color="var(--text-muted)" />
                      : isDone
                        ? <CheckCircle2 size={18} color="var(--accent-teal)" />
                        : isCurrent
                          ? <span className="badge badge--gold text-badge">{t(lang, 'current_badge')}</span>
                          : null}
                  </div>
                  <ProgressBar pct={l.pct} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {locked
                        ? (lang === 'ru' ? '🔒 Сдайте тесты урока ' + (l.lesson - 1)
                          : lang === 'en' ? '🔒 Pass lesson ' + (l.lesson - 1) + ' tests'
                          : lang === 'uz' ? '🔒 ' + (l.lesson - 1) + '-dars testlarini topshiring'
                          : '🔒 Санҷишҳои дарси ' + (l.lesson - 1) + ' -ро гузаред')
                        : `${l.learned_words} / ${l.total_words} ${t(lang, 'words_count')}`}
                    </span>
                    {!locked && (
                      <span style={{ fontSize: 12, color: isDone ? 'var(--accent-teal)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {l.pct}%
                      </span>
                    )}
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

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Eye } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { WordCard } from '../api/client';
import { useSwipe } from '../hooks/useSwipe';

interface Props {
  lang: Lang;
  bookId: number;
  lesson: number;
  onBack: () => void;
  onStartTest: () => void;
}

function getTranslation(card: WordCard, lang: Lang): string {
  if (lang === 'en') return card.en  || card.ru || card.translation;
  if (lang === 'tj') return card.tj  || card.ru || card.translation;
  return card.ru || card.translation;
}

export default function LessonScreen({ lang, bookId, lesson, onBack, onStartTest }: Props) {
  const [words, setWords]       = useState<WordCard[]>([]);
  const [idx, setIdx]           = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    setIdx(0);
    setRevealed(false);
    api.getLesson(bookId, lesson)
      .then(data => setWords(data.words))
      .finally(() => setLoading(false));
  }, [bookId, lesson]);

  const total = words.length;
  const card  = words[idx];
  const isLast = idx === total - 1;

  function goNext() {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setRevealed(false);
    }
  }

  function goPrev() {
    if (idx > 0) {
      setIdx(idx - 1);
      setRevealed(false);
    }
  }

  const handleSwipeLeft  = useCallback(() => goNext(), [idx, total]);
  const handleSwipeRight = useCallback(() => goPrev(), [idx]);
  const swipeHandlers    = useSwipe(handleSwipeLeft, handleSwipeRight);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">{t(lang, 'loading')}</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">Слова не найдены</p>
      </div>
    );
  }

  const progress = ((idx + 1) / total) * 100;

  return (
    <div
      className="screen-enter"
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}
      {...swipeHandlers}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>
          {t(lang, 'lesson_num')} {lesson} — {lang === 'en' ? 'Study' : 'Изучение'}
        </h1>
        <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
          {idx + 1}/{total}
        </span>
      </div>

      {/* ── Progress bar ────────────────────────────────────────── */}
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{
          height: '100%', background: 'var(--accent-teal)',
          width: `${progress}%`, transition: 'width 0.35s ease',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* ── Word card area ──────────────────────────────────────── */}
      <div className="page-content" style={{ paddingTop: 20, display: 'flex', flexDirection: 'column' }}>

        {/* Main flashcard */}
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '32px 20px',
            marginBottom: 20,
            minHeight: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: revealed ? 'default' : 'pointer',
            userSelect: 'none',
          }}
          onClick={() => !revealed && setRevealed(true)}
        >
          {/* Arabic word */}
          <div className="text-arabic-lg" style={{ marginBottom: 10 }}>
            {card.ar}
          </div>

          {/* Transcription */}
          <div className="text-trans" style={{ marginBottom: 20 }}>
            {card.trans}
          </div>

          {/* Translation reveal */}
          {revealed ? (
            <div style={{
              width: '100%',
              borderTop: '1px solid var(--border)',
              paddingTop: 18,
              marginTop: 4,
            }}>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1.4,
              }}>
                {getTranslation(card, lang)}
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              style={{ gap: 6 }}
              onClick={e => { e.stopPropagation(); setRevealed(true); }}
            >
              <Eye size={14} />
              {lang === 'en' ? 'Show translation' : 'Показать перевод'}
            </button>
          )}
        </div>

        {/* Tap hint */}
        {!revealed && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, marginTop: -10 }}>
            👆 {lang === 'en' ? 'Tap the card to reveal' : 'Нажмите на карточку, чтобы открыть перевод'}
          </p>
        )}

        {/* ── Navigation ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={goPrev}
            disabled={idx === 0}
          >
            <ChevronLeft size={18} />
            {lang === 'en' ? 'Back' : 'Назад'}
          </button>

          {isLast ? (
            <button
              className="btn btn-primary"
              style={{ flex: 2, gap: 8 }}
              onClick={onStartTest}
            >
              <GraduationCap size={18} />
              {lang === 'en' ? 'Start Test' : 'Начать тест'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={goNext}
            >
              {lang === 'en' ? 'Next' : 'Далее'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Skip to test (always available) */}
        {!isLast && (
          <button
            className="btn btn-gold"
            style={{ gap: 8 }}
            onClick={onStartTest}
          >
            <GraduationCap size={16} />
            {lang === 'en' ? 'Skip to test' : 'Перейти к тесту'}
          </button>
        )}

        {/* Swipe hint */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14, opacity: 0.7 }}>
          ← → {lang === 'en' ? 'Swipe to navigate' : 'Свайп для навигации'}
        </p>
      </div>
    </div>
  );
}

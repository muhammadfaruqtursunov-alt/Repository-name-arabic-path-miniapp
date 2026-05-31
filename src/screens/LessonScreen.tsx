import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Eye, Volume2, Bookmark, BookmarkCheck } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { WordCard } from '../api/client';
import { useSwipe } from '../hooks/useSwipe';
import { speakArabic } from '../utils/speak';
import { saveWordManually, getSRSWords } from '../utils/srs';

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
  if (lang === 'uz') return card.uz  || card.ru || card.translation;
  return card.ru || card.translation;
}

export default function LessonScreen({ lang, bookId, lesson, onBack, onStartTest }: Props) {
  const [words, setWords]       = useState<WordCard[]>([]);
  const [idx, setIdx]           = useState(0);
  // revealed is sticky — once the user clicks once it stays ON for the whole lesson
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [savedIds, setSavedIds] = useState<Set<number>>(
    () => new Set(getSRSWords().map(w => w.word_id))
  );

  useEffect(() => {
    setLoading(true);
    setIdx(0);
    setRevealed(false); // only reset when a NEW lesson starts
    api.getLesson(bookId, lesson)
      .then(data => setWords(data.words))
      .finally(() => setLoading(false));
  }, [bookId, lesson]);

  const total = words.length;
  const card  = words[idx];
  const isLast = idx === total - 1;

  // Navigation does NOT reset revealed — stays sticky
  function goNext() {
    if (idx < total - 1) setIdx(idx + 1);
  }

  function goPrev() {
    if (idx > 0) setIdx(idx - 1);
  }

  const handleSwipeLeft  = useCallback(() => goNext(), [idx, total]);
  const handleSwipeRight = useCallback(() => goPrev(), [idx]);
  const swipeHandlers    = useSwipe(handleSwipeLeft, handleSwipeRight);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
          <div className="skeleton" style={{ flex: 1, height: 18, marginLeft: 12, borderRadius: 6 }} />
        </div>
        <div style={{ height: 4, background: 'var(--border)' }} />
        <div className="page-content" style={{ paddingTop: 20 }}>
          <div className="glass-card" style={{ padding: '32px 20px', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="skeleton" style={{ width: '60%', height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: '45%', height: 16, borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <div className="skeleton" style={{ flex: 1, height: 52, borderRadius: 14 }} />
            <div className="skeleton" style={{ flex: 1, height: 52, borderRadius: 14 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">{t(lang, 'words_not_found')}</p>
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
          {t(lang, 'lesson_num')} {lesson} — {t(lang, 'lesson_study')}
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
          {/* Arabic word + speak + bookmark */}
          <div style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
            <div className="text-arabic-lg">{card.ar}</div>
            {/* Speak */}
            <button
              onClick={e => { e.stopPropagation(); speakArabic(card.ar); }}
              style={{
                position: 'absolute', top: 0, right: 0,
                background: 'rgba(192,150,60,0.12)',
                border: '1px solid rgba(192,150,60,0.30)',
                borderRadius: 10, padding: '5px 8px',
                cursor: 'pointer', color: 'var(--accent-gold)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Volume2 size={15} />
            </button>
            {/* Bookmark / save */}
            <button
              onClick={e => {
                e.stopPropagation();
                saveWordManually(card.id, card.ar, card.trans, getTranslation(card, lang));
                setSavedIds(prev => new Set([...prev, card.id]));
              }}
              style={{
                position: 'absolute', top: 0, left: 0,
                background: savedIds.has(card.id) ? 'rgba(192,150,60,0.18)' : 'rgba(255,255,255,0.07)',
                border: savedIds.has(card.id) ? '1px solid rgba(192,150,60,0.45)' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '5px 8px',
                cursor: savedIds.has(card.id) ? 'default' : 'pointer',
                color: savedIds.has(card.id) ? 'var(--accent-gold)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
              }}
            >
              {savedIds.has(card.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
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
              {t(lang, 'lesson_show_trans')}
            </button>
          )}
        </div>

        {/* Tap hint — only shown before first reveal */}
        {!revealed && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, marginTop: -10 }}>
            👆 {t(lang, 'lesson_tap_card')}
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
            {t(lang, 'back')}
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={goNext}
            disabled={isLast}
          >
            {t(lang, 'next')}
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Пройти тест — всегда виден */}
        <button
          className="btn btn-gold"
          style={{ gap: 8, fontSize: 15, height: 52 }}
          onClick={onStartTest}
        >
          <GraduationCap size={18} />
          {t(lang, 'btn_start_test')}
        </button>

        {/* Swipe hint */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14, opacity: 0.7 }}>
          ← → {t(lang, 'lesson_swipe_hint')}
        </p>
      </div>
    </div>
  );
}

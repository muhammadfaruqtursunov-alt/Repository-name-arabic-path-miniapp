import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown,
  CheckCircle2, XCircle, Volume2, GraduationCap,
} from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import {
  umrahSections,
  getPhraseTranslation,
  getSectionTitle,
  type UmrahSection,
  type UmrahPhrase,
} from '../data/umrahData';
import { speakArabic } from '../utils/speak';
import { useSwipe } from '../hooks/useSwipe';

interface Props {
  lang: Lang;
  onBack: () => void;
  onLocalBack: (fn: null | (() => void)) => void;
}

type View = 'sections' | 'detail' | 'quiz';

// ─── speaker label ───────────────────────────────────────────
function speakerLabel(ph: UmrahPhrase, lang: Lang): string | null {
  if (!ph.speaker) return null;
  if (ph.speaker === 'student') {
    if (lang === 'en') return '🙏 Pilgrim';
    if (lang === 'uz') return '🙏 Hoji';
    if (lang === 'tj') return '🙏 Ҳоҷӣ';
    return '🙏 Паломник';
  }
  if (ph.speaker === 'police') {
    if (lang === 'en') return '👮 Police';
    if (lang === 'uz') return '👮 Politsiya';
    if (lang === 'tj') return '👮 Полис';
    return '👮 Полиция';
  }
  // arab
  if (lang === 'en') return '🧕 Local';
  if (lang === 'uz') return '🧕 Mahalliy';
  if (lang === 'tj') return '🧕 Маҳаллӣ';
  return '🧕 Местный';
}

// ─── локальный квиз ──────────────────────────────────────────
interface QuizQuestion {
  phrase: UmrahPhrase;
  choices: { label: string; isCorrect: boolean }[];
  idx: number;
  total: number;
}

function buildQuiz(section: UmrahSection, lang: Lang): QuizQuestion[] {
  const allTranslations = umrahSections
    .flatMap(s => s.phrases)
    .map(p => getPhraseTranslation(p, lang));

  const phrases = section.phrases.filter(p => p.ar?.trim());

  return phrases.map((phrase, idx) => {
    const correct = getPhraseTranslation(phrase, lang);
    const pool = [...new Set(allTranslations.filter(tr => tr !== correct))];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const choices = [
      ...pool.slice(0, 3).map(label => ({ label, isCorrect: false })),
      { label: correct, isCorrect: true },
    ];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return { phrase, choices, idx, total: phrases.length };
  });
}

// ─── компонент ───────────────────────────────────────────────
export default function UmrahGuide({ lang, onBack, onLocalBack }: Props) {
  const [view, setView]       = useState<View>('sections');
  const [current, setCurrent] = useState<UmrahSection | null>(null);

  // Регистрируем «шаг назад» на родительский под-вид для плавающей стрелки.
  useEffect(() => {
    const parent: Record<View, View | null> = {
      sections: null, detail: 'sections', quiz: 'detail',
    };
    const p = parent[view];
    onLocalBack(p ? () => setView(p) : null);
    return () => onLocalBack(null);
  }, [view, onLocalBack]);

  // Duolingo navigation
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [playingAr, setPlayingAr] = useState<string | null>(null);

  // quiz
  const [quiz, setQuiz]         = useState<QuizQuestion[]>([]);
  const [quizIdx, setQuizIdx]   = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [done, setDone]         = useState(false);
  const [answered, setAnswered] = useState(false);

  // сброс при смене секции
  useEffect(() => { setPhraseIdx(0); }, [current]);

  const phraseCounts = useMemo(
    () => Object.fromEntries(umrahSections.map(s => [s.key, s.phrases.length])),
    [],
  );

  // ── audio ────────────────────────────────────────────────────
  function speak(ar: string) {
    setPlayingAr(ar);
    speakArabic(ar);
    setTimeout(() => setPlayingAr(null), 2500);
  }

  // ── detail navigation ────────────────────────────────────────
  const total    = current?.phrases.length ?? 0;
  const isFirst  = phraseIdx === 0;
  const isLast   = phraseIdx === total - 1;
  const phrase   = current?.phrases[phraseIdx] ?? null;

  const goNext = useCallback(
    () => setPhraseIdx(i => Math.min(i + 1, total - 1)),
    [total],
  );
  const goPrev = useCallback(
    () => setPhraseIdx(i => Math.max(i - 1, 0)),
    [],
  );
  const swipeHandlers = useSwipe(goNext, goPrev);

  // ── quiz ─────────────────────────────────────────────────────
  function startQuiz() {
    if (!current) return;
    setQuiz(buildQuiz(current, lang));
    setQuizIdx(0);
    setFeedback(null);
    setDone(false);
    setAnswered(false);
    setView('quiz');
  }

  const quizQ = quiz[quizIdx] ?? null;

  function handleAnswer(choice: { label: string; isCorrect: boolean }) {
    if (answered) return;
    setAnswered(true);
    setFeedback({
      correct: choice.isCorrect,
      msg: quizQ ? getPhraseTranslation(quizQ.phrase, lang) : '',
    });
    setTimeout(() => {
      setFeedback(null);
      setAnswered(false);
      if (quizIdx + 1 >= quiz.length) setDone(true);
      else setQuizIdx(q => q + 1);
    }, 950);
  }

  // ═══════════════════════════════════════════════════════════
  // QUIZ VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'quiz') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onClick={() => { setView('detail'); setFeedback(null); setAnswered(false); }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>{t(lang, 'umrah_title')} — тест</h1>
          {!done && quizQ && (
            <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700 }}>
              {quizIdx + 1}/{quiz.length}
            </span>
          )}
        </div>

        <div className="page-content" style={{ paddingTop: 16 }}>
          {done ? (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <div style={{ fontSize: 56 }}>🎉</div>
              <h2 className="title-screen" style={{ marginTop: 16 }}>{t(lang, 'done_title')}</h2>
              <p className="text-muted" style={{ marginTop: 8 }}>{t(lang, 'done_msg')}</p>
              <button className="btn btn-gold" style={{ marginTop: 32 }} onClick={startQuiz}>
                ↺ &nbsp;Ещё раз
              </button>
            </div>
          ) : quizQ ? (
            <>
              <div className="glass-card" style={{ textAlign: 'center', marginBottom: 20, padding: '28px 20px', position: 'relative' }}>
                <button onClick={() => speak(quizQ.phrase.ar)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer',
                    color: playingAr === quizQ.phrase.ar ? 'var(--accent-gold)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                  <Volume2 size={20} />
                </button>
                <div className="text-arabic-lg">{quizQ.phrase.ar}</div>
                {quizQ.phrase.dialect && quizQ.phrase.dialect !== quizQ.phrase.ar && (
                  <div style={{ color: 'var(--accent-gold)', fontSize: 14, marginTop: 6, fontStyle: 'italic' }}>
                    {quizQ.phrase.dialect}
                  </div>
                )}
                <div className="text-trans" style={{ marginTop: 8 }}>{quizQ.phrase.trans}</div>
              </div>
              {feedback && (
                <div className={`glass-card ${feedback.correct ? 'flash-correct' : 'flash-wrong'}`}
                  style={{ marginBottom: 14, borderColor: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)',
                    display: 'flex', gap: 10, alignItems: 'center' }}>
                  {feedback.correct
                    ? <CheckCircle2 size={18} color="var(--accent-teal)" />
                    : <XCircle size={18} color="var(--danger)" />}
                  <span style={{ fontWeight: 600, color: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)', fontSize: 14 }}>
                    {feedback.correct ? t(lang, 'correct_msg') : `${t(lang, 'wrong_msg')} ${feedback.msg}`}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizQ.choices.map((ch, i) => (
                  <button key={i} className="btn btn-ghost"
                    style={{ height: 'auto', padding: '14px', textAlign: 'left', justifyContent: 'flex-start', color: '#FFF', fontWeight: 600 }}
                    disabled={answered} onClick={() => handleAnswer(ch)}>
                    {ch.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // DETAIL VIEW — Duolingo-стиль
  // ═══════════════════════════════════════════════════════════
  if (view === 'detail' && current && phrase) {
    const title      = getSectionTitle(current, lang);
    const translation = getPhraseTranslation(phrase, lang);
    const progress   = ((phraseIdx + 1) / total) * 100;
    const badge      = speakerLabel(phrase, lang);

    return (
      <div
        className="screen-enter"
        style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}
        {...swipeHandlers}
      >
        {/* Header */}
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onClick={() => setView('sections')}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>
            {current.emoji} {title}
          </h1>
          <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
            {phraseIdx + 1}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)' }}>
          <div style={{
            height: '100%', background: 'var(--accent-teal)',
            width: `${progress}%`, transition: 'width 0.35s ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>

        {/* Карточка фразы */}
        <div className="page-content" style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>

          <div className="glass-card" style={{
            textAlign: 'center', padding: '32px 20px 28px',
            marginBottom: 20, minHeight: 240,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Кнопка озвучки */}
            <button
              onClick={() => speak(phrase.ar)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(192,150,60,0.12)',
                border: '1px solid rgba(192,150,60,0.30)',
                borderRadius: 10, padding: '5px 8px',
                cursor: 'pointer',
                color: playingAr === phrase.ar ? 'var(--accent-gold)' : 'var(--text-muted)',
                transition: 'color 0.2s',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Volume2 size={16} />
            </button>

            {/* Бейдж говорящего */}
            {badge && (
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: phrase.speaker === 'police' ? '#ff7070' : 'var(--accent-teal)',
                background: phrase.speaker === 'police' ? 'rgba(220,60,40,0.12)' : 'rgba(0,180,150,0.1)',
                border: `1px solid ${phrase.speaker === 'police' ? 'rgba(220,60,40,0.3)' : 'rgba(0,180,150,0.25)'}`,
                borderRadius: 20, padding: '3px 10px',
                marginBottom: 18,
              }}>
                {badge}
                {phrase.variant && (
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>
                    {phrase.variant === 'pos' ? '✓' : '✗'}
                  </span>
                )}
              </div>
            )}

            {/* Арабский текст */}
            <div dir="rtl" className="text-arabic-lg" style={{ marginBottom: 10, lineHeight: 1.6 }}>
              {phrase.ar}
            </div>

            {/* Транслитерация */}
            <div className="text-trans" style={{ marginBottom: 20 }}>
              {phrase.trans}
            </div>

            {/* Разделитель + перевод */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {translation}
              </div>
            </div>

            {/* Диалект — если есть и отличается */}
            {phrase.dialect && phrase.dialect !== phrase.ar && (
              <div style={{
                marginTop: 14, fontSize: 13,
                color: 'var(--accent-gold)', fontStyle: 'italic',
                background: 'rgba(192,150,60,0.07)',
                borderRadius: 8, padding: '6px 12px',
                width: '100%', textAlign: 'center',
              }}>
                🗣 {phrase.dialect}
              </div>
            )}
          </div>

          {/* Навигация */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }}
              onClick={goPrev} disabled={isFirst}>
              <ChevronLeft size={18} /> {t(lang, 'back')}
            </button>

            {isLast ? (
              <button className="btn btn-primary" style={{ flex: 2, gap: 8 }} onClick={startQuiz}>
                <GraduationCap size={18} />
                {t(lang, 'btn_start_test')}
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={goNext}>
                {t(lang, 'next')} <ChevronRight size={18} />
              </button>
            )}
          </div>

          {/* Подсказка свайп */}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, marginTop: 4 }}>
            ← → {t(lang, 'lesson_swipe_hint')}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SECTIONS LIST
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '40px 20px 28px',
        background: 'linear-gradient(180deg, rgba(13,31,26,0.6) 0%, var(--bg-deep) 100%), url(https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600) center/cover no-repeat',
        textAlign: 'center', position: 'relative',
      }}>
        <button style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <svg width="48" height="64" viewBox="0 0 48 64" fill="none" style={{ marginBottom: 10 }}>
          <circle cx="24" cy="10" r="8" fill="#C9A84C" opacity="0.8" />
          <rect x="10" y="20" width="28" height="36" rx="4" fill="#C9A84C" opacity="0.7" />
          <rect x="8" y="22" width="32" height="4" rx="2" fill="#C9A84C" opacity="0.5" />
        </svg>
        <h1 className="title-screen" style={{ marginBottom: 4 }}>{t(lang, 'umrah_title')}</h1>
        <p className="text-muted" style={{ fontSize: 13 }}>{t(lang, 'umrah_subtitle')}</p>
      </div>

      <div className="page-content" style={{ paddingTop: 12 }}>
        {umrahSections.map(sec => (
          <div key={sec.key} className="glass-card"
            style={{ marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
            onClick={() => { setCurrent(sec); setView('detail'); }}>
            <span style={{ fontSize: 28 }}>{sec.emoji}</span>
            <div style={{ flex: 1 }}>
              <div className="title-card">{getSectionTitle(sec, lang)}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {phraseCounts[sec.key]} {t(lang, 'phrase_count')}
              </div>
            </div>
            <ChevronDown size={18} color="var(--text-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
}

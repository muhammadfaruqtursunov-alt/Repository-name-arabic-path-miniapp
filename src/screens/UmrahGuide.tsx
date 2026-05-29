import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import {
  umrahSections,
  getPhraseTranslation,
  getSectionTitle,
  type UmrahSection,
  type UmrahPhrase,
} from '../data/umrahData';

interface Props {
  lang: Lang;
  onBack: () => void;
}

type View = 'sections' | 'detail' | 'quiz';

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

  const phrases = section.phrases.filter(p => p.ar && p.ar.trim());
  const questions: QuizQuestion[] = [];

  phrases.forEach((phrase, idx) => {
    const correct = getPhraseTranslation(phrase, lang);
    const pool = [...new Set(allTranslations.filter(tr => tr !== correct))];
    // shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const choices = [
      ...pool.slice(0, 3).map(label => ({ label, isCorrect: false })),
      { label: correct, isCorrect: true },
    ];
    // shuffle choices
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    questions.push({ phrase, choices, idx, total: phrases.length });
  });

  return questions;
}

// ─── компонент ──────────────────────────────────────────────
export default function UmrahGuide({ lang, onBack }: Props) {
  const [view, setView]       = useState<View>('sections');
  const [current, setCurrent] = useState<UmrahSection | null>(null);

  // quiz
  const [quiz, setQuiz]         = useState<QuizQuestion[]>([]);
  const [quizIdx, setQuizIdx]   = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [done, setDone]         = useState(false);
  const [answered, setAnswered] = useState(false);

  const quizQ = quiz[quizIdx] ?? null;

  // Сколько фраз в секции (для отображения счётчика)
  const phraseCounts = useMemo(
    () => Object.fromEntries(umrahSections.map(s => [s.key, s.phrases.length])),
    [],
  );

  function openSection(sec: UmrahSection) {
    setCurrent(sec);
    setView('detail');
  }

  function startQuiz() {
    if (!current) return;
    const questions = buildQuiz(current, lang);
    setQuiz(questions);
    setQuizIdx(0);
    setFeedback(null);
    setDone(false);
    setAnswered(false);
    setView('quiz');
  }

  function handleAnswer(choice: { label: string; isCorrect: boolean }) {
    if (answered) return;
    setAnswered(true);

    if (choice.isCorrect) {
      setFeedback({ correct: true, msg: '' });
    } else {
      setFeedback({
        correct: false,
        msg: quizQ ? getPhraseTranslation(quizQ.phrase, lang) : '',
      });
    }

    setTimeout(() => {
      setFeedback(null);
      setAnswered(false);
      if (quizIdx + 1 >= quiz.length) {
        setDone(true);
      } else {
        setQuizIdx(prev => prev + 1);
      }
    }, 950);
  }

  // ─── QUIZ VIEW ───────────────────────────────────────────────
  if (view === 'quiz') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onClick={() => { setView('detail'); setFeedback(null); setAnswered(false); }}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>
            {t(lang, 'umrah_title')} — тест
          </h1>
          {quizQ && !done && (
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
              {/* Вопрос */}
              <div className="glass-card" style={{ textAlign: 'center', marginBottom: 20, padding: '28px 20px' }}>
                <div className="text-arabic-lg">{quizQ.phrase.ar}</div>
                {quizQ.phrase.dialect && quizQ.phrase.dialect !== quizQ.phrase.ar && (
                  <div style={{ color: 'var(--accent-gold)', fontSize: 14, marginTop: 6, fontStyle: 'italic' }}>
                    {quizQ.phrase.dialect}
                  </div>
                )}
                <div className="text-trans" style={{ marginTop: 8 }}>{quizQ.phrase.trans}</div>
              </div>

              {/* Фидбек */}
              {feedback && (
                <div
                  className={`glass-card ${feedback.correct ? 'flash-correct' : 'flash-wrong'}`}
                  style={{
                    marginBottom: 14,
                    borderColor: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)',
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}
                >
                  {feedback.correct
                    ? <CheckCircle2 size={18} color="var(--accent-teal)" />
                    : <XCircle size={18} color="var(--danger)" />}
                  <span style={{ fontWeight: 600, color: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)', fontSize: 14 }}>
                    {feedback.correct
                      ? t(lang, 'correct_msg')
                      : `${t(lang, 'wrong_msg')} ${feedback.msg}`}
                  </span>
                </div>
              )}

              {/* Варианты ответа */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizQ.choices.map((ch, i) => (
                  <button
                    key={i}
                    className="btn btn-ghost"
                    style={{
                      height: 'auto', padding: '14px',
                      textAlign: 'left', justifyContent: 'flex-start',
                      color: '#FFFFFF', fontWeight: 600,
                    }}
                    disabled={answered}
                    onClick={() => handleAnswer(ch)}
                  >
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

  // ─── DETAIL VIEW ──────────────────────────────────────────────
  if (view === 'detail' && current) {
    const title = getSectionTitle(current, lang);

    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Шапка */}
        <div style={{
          padding: '40px 20px 24px',
          background: 'linear-gradient(180deg, rgba(13,31,26,0.7) 0%, var(--bg-deep) 100%), url(https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600) center/cover no-repeat',
          textAlign: 'center',
          position: 'relative',
        }}>
          <button
            style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onClick={() => setView('sections')}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{current.emoji}</div>
          <h1 className="title-screen">{title}</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
            {current.phrases.length} {t(lang, 'phrase_count')}
          </div>
        </div>

        {/* Список фраз */}
        <div className="page-content" style={{ paddingTop: 12, paddingBottom: 100 }}>
          {current.phrases.map((ph, i) => {
            const translation = getPhraseTranslation(ph, lang);
            const isSpeaker = !!ph.speaker;
            const isRight = ph.speaker === 'student';
            const isPolice = ph.speaker === 'police';

            if (isSpeaker) {
              // Chat-bubble style
              return (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isRight ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                  gap: 2,
                }}>
                  {/* Имя говорящего */}
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginLeft: isRight ? 0 : 4,
                    marginRight: isRight ? 4 : 0,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {ph.speaker === 'student'
                      ? (lang === 'ru' ? 'Паломник' : lang === 'en' ? 'Pilgrim' : lang === 'uz' ? 'Hoji' : 'Ҳоҷӣ')
                      : isPolice
                        ? (lang === 'ru' ? 'Полиция' : lang === 'en' ? 'Police' : lang === 'uz' ? 'Politsiya' : 'Полис')
                        : (lang === 'ru' ? 'Местный' : lang === 'en' ? 'Local' : lang === 'uz' ? 'Mahalliy' : 'Маҳаллӣ')
                    }
                    {ph.variant && (
                      <span style={{
                        marginLeft: 6,
                        color: ph.variant === 'pos' ? 'var(--accent-teal)' : 'var(--danger)',
                        fontSize: 10,
                      }}>
                        {ph.variant === 'pos' ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  {/* Пузырь */}
                  <div style={{
                    maxWidth: '85%',
                    background: isRight
                      ? 'var(--accent-tint)'
                      : isPolice
                        ? 'rgba(220,60,40,0.12)'
                        : 'var(--bg-card)',
                    border: `1px solid ${isRight ? 'var(--accent-border)' : isPolice ? 'rgba(220,60,40,0.3)' : 'var(--border)'}`,
                    borderRadius: isRight ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '12px 16px',
                  }}>
                    <div dir="rtl" style={{ fontSize: 18, fontFamily: 'var(--font-arabic)', marginBottom: 4, color: 'var(--text-primary)' }}>
                      {ph.ar}
                    </div>
                    {ph.dialect && ph.dialect !== ph.ar && (
                      <div style={{ fontSize: 13, color: 'var(--accent-gold)', fontStyle: 'italic', marginBottom: 3 }}>
                        {ph.dialect}
                      </div>
                    )}
                    <div className="text-trans" style={{ fontSize: 12 }}>{ph.trans}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
                      {translation}
                    </div>
                  </div>
                </div>
              );
            }

            // Обычная карточка
            return (
              <div key={i} className="glass-card" style={{ marginBottom: 10 }}>
                <div dir="rtl" className="text-arabic" style={{ fontSize: 20, marginBottom: 6 }}>
                  {ph.ar}
                </div>
                {ph.dialect && ph.dialect !== ph.ar && (
                  <div style={{ fontSize: 13, color: 'var(--accent-gold)', fontStyle: 'italic', marginBottom: 4 }}>
                    {ph.dialect}
                  </div>
                )}
                <div className="text-trans" style={{ marginBottom: 4 }}>{ph.trans}</div>
                <div className="text-translation">{translation}</div>
              </div>
            );
          })}
        </div>

        {/* Кнопка «Тест» */}
        <div style={{ padding: '12px 16px 24px', background: 'var(--bg-deep)', position: 'sticky', bottom: 0 }}>
          <button className="btn btn-gold" onClick={startQuiz}>
            {t(lang, 'btn_start_test')}
          </button>
        </div>
      </div>
    );
  }

  // ─── SECTIONS LIST ───────────────────────────────────────────
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{
        padding: '40px 20px 28px',
        background: 'linear-gradient(180deg, rgba(13,31,26,0.6) 0%, var(--bg-deep) 100%), url(https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600) center/cover no-repeat',
        textAlign: 'center',
        position: 'relative',
      }}>
        <button
          style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </button>
        {/* Паломник SVG */}
        <svg width="48" height="64" viewBox="0 0 48 64" fill="none" style={{ marginBottom: 10 }}>
          <circle cx="24" cy="10" r="8" fill="#C9A84C" opacity="0.8" />
          <rect x="10" y="20" width="28" height="36" rx="4" fill="#C9A84C" opacity="0.7" />
          <rect x="8" y="22" width="32" height="4" rx="2" fill="#C9A84C" opacity="0.5" />
        </svg>
        <h1 className="title-screen" style={{ marginBottom: 4 }}>{t(lang, 'umrah_title')}</h1>
        <p className="text-muted" style={{ fontSize: 13 }}>{t(lang, 'umrah_subtitle')}</p>
      </div>

      {/* Список секций */}
      <div className="page-content" style={{ paddingTop: 12 }}>
        {umrahSections.map(sec => (
          <div
            key={sec.key}
            className="glass-card"
            style={{ marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
            onClick={() => openSection(sec)}
          >
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

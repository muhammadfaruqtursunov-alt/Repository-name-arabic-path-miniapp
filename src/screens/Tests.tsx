import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, Flame } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { QuizQuestion, QuizAnswerResult } from '../api/client';

type Mode = 'visual' | 'written';

interface Props {
  lang: Lang;
  bookId: number;
  lesson: number;
  onBack: () => void;
}

export default function Tests({ lang, bookId, lesson, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('visual');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [flashClass, setFlashClass] = useState('');

  async function startQuiz(m: Mode) {
    setLoading(true);
    setDone(false);
    setFeedback(null);
    setStreakVal(0);
    setCorrectVal(0);
    setTotalVal(0);
    try {
      const q = await api.startQuiz(bookId, lesson, m);
      setQuestion(q);
      setTotalVal(q.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // helper setters to avoid stale closure issues
  const [streakVal, setStreakVal] = useState(0);
  const [correctVal, setCorrectVal] = useState(0);
  const [totalVal, setTotalVal] = useState(0);

  useEffect(() => { startQuiz(mode); }, [mode, bookId, lesson]);

  async function handleVisualAnswer(chosenId: number) {
    if (!question || loading) return;
    setLoading(true);
    try {
      const res = await api.answerQuiz(question.word_id, chosenId, 'visual');
      handleResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleWrittenAnswer() {
    if (!question || !typed.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.answerQuiz(question.word_id, -1, 'written', typed.trim());
      setTyped('');
      handleResult(res);
    } finally {
      setLoading(false);
    }
  }

  function handleResult(res: QuizAnswerResult) {
    if (res.correct) {
      setFlashClass('flash-correct');
      setStreakVal(s => s + 1);
      setCorrectVal(c => c + 1);
    } else {
      setFlashClass('flash-wrong');
      setStreakVal(0);
    }
    setTimeout(() => setFlashClass(''), 500);

    setFeedback({ correct: res.correct, msg: res.feedback });
    if (res.motivation) setMotivation(res.motivation);

    if (res.done) {
      setDone(true);
      return;
    }
    if (res.next) {
      setTimeout(() => {
        setQuestion(res.next!);
        setFeedback(null);
      }, 800);
    }
  }

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>
          {t(lang, 'lesson_num')} {lesson}
        </h1>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
            <Flame size={14} /> {streakVal}
          </span>
          <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700 }}>
            {correctVal}/{totalVal || question?.total || '?'}
          </span>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
        {(['visual', 'written'] as Mode[]).map((m) => (
          <button
            key={m}
            className={`btn${mode === m ? ' btn-primary' : ' btn-ghost'}`}
            style={{ height: 40, fontSize: 13, flex: 1 }}
            onClick={() => { setMode(m); }}
          >
            {m === 'visual' ? t(lang, 'tab_visual') : t(lang, 'tab_written')}
          </button>
        ))}
      </div>

      <div className={`page-content ${flashClass}`} style={{ paddingTop: 16 }}>
        {loading && !question ? (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>{t(lang, 'loading')}</p>
        ) : done ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 className="title-screen">{t(lang, 'done_title')}</h2>
            <p className="text-muted" style={{ marginTop: 12 }}>{t(lang, 'done_msg')}</p>
            <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={() => startQuiz(mode)}>
              ↺ Повторить
            </button>
          </div>
        ) : question ? (
          <div>
            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {question.idx + 1} {t(lang, 'of')} {question.total}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginBottom: 24 }}>
              <div style={{
                width: `${((question.idx + 1) / question.total) * 100}%`,
                height: '100%', borderRadius: 2, background: 'var(--accent-teal)',
                transition: 'width 0.3s',
              }} />
            </div>

            {/* Arabic word */}
            <div className="glass-card" style={{ textAlign: 'center', marginBottom: 24, padding: '28px 20px' }}>
              <div className="text-arabic-lg">{question.ar}</div>
              <div className="text-muted" style={{ marginTop: 10, fontSize: 15, fontStyle: 'italic' }}>
                {question.trans}
              </div>
              {mode === 'visual' && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
                  {t(lang, 'visual_question')}
                </p>
              )}
              {mode === 'written' && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
                  {t(lang, 'written_question')}
                </p>
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`glass-card ${feedback.correct ? 'flash-correct' : 'flash-wrong'}`}
                style={{
                  marginBottom: 16, padding: '12px 16px',
                  borderColor: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                {feedback.correct
                  ? <CheckCircle2 size={20} color="var(--accent-teal)" />
                  : <XCircle size={20} color="var(--danger)" />}
                <span style={{ color: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)', fontWeight: 600 }}>
                  {feedback.correct ? t(lang, 'correct_msg') : `${t(lang, 'wrong_msg')} ${feedback.msg}`}
                </span>
              </div>
            )}

            {/* Motivation after reset */}
            {motivation && (
              <div className="glass-card glass-card--gold" style={{ marginBottom: 16, fontSize: 13, color: 'var(--accent-gold)' }}>
                {motivation}
              </div>
            )}

            {/* Visual choices */}
            {mode === 'visual' && question.choices && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {question.choices.map((ch, i) => (
                  <button
                    key={i}
                    className="btn btn-ghost"
                    style={{ height: 'auto', padding: '14px 20px', textAlign: 'left', justifyContent: 'flex-start' }}
                    disabled={!!feedback || loading}
                    onClick={() => handleVisualAnswer(ch.word_id)}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            )}

            {/* Written input */}
            {mode === 'written' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  className="input-field"
                  placeholder={t(lang, 'written_placeholder')}
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleWrittenAnswer()}
                  disabled={!!feedback}
                  autoComplete="off"
                />
                <button
                  className="btn btn-primary"
                  disabled={!typed.trim() || !!feedback || loading}
                  onClick={handleWrittenAnswer}
                >
                  {t(lang, 'btn_check')}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

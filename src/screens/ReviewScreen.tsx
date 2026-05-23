import { useState, useCallback } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { getSRSWords, markWordKnown, addWrongWord } from '../utils/srs';
import { speakArabic } from '../utils/speak';
import type { SRSWord } from '../utils/srs';

interface Props {
  lang: Lang;
  onBack: () => void;
}

type Phase = 'start' | 'quiz' | 'done';

export default function ReviewScreen({ lang, onBack }: Props) {
  const allWords = getSRSWords();
  const dueWords = allWords.filter(w => w.due <= Date.now());

  const [phase, setPhase] = useState<Phase>('start');
  const [queue, setQueue] = useState<SRSWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  function startReview(words: SRSWord[]) {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setIdx(0);
    setRevealed(false);
    setCorrect(0);
    setWrong(0);
    setPhase('quiz');
  }

  const advance = useCallback(() => {
    setRevealed(false);
    if (idx + 1 >= queue.length) { setPhase('done'); return; }
    setIdx(i => i + 1);
  }, [idx, queue.length]);

  function handleKnown() {
    markWordKnown(queue[idx].word_id);
    setCorrect(c => c + 1);
    advance();
  }

  function handleForgot() {
    const w = queue[idx];
    addWrongWord(w.word_id, w.ar, w.trans, w.correct);
    setWrong(ww => ww + 1);
    advance();
  }

  const card = queue[idx];
  const progress = queue.length > 0 ? ((idx) / queue.length) * 100 : 0;

  // ── Start screen ────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} onClick={onBack}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>{t(lang, 'review_title')}</h1>
        </div>

        <div className="page-content" style={{ paddingTop: 24 }}>
          {allWords.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p className="title-card" style={{ marginBottom: 8 }}>{t(lang, 'review_empty_title')}</p>
              <p className="text-muted" style={{ fontSize: 13 }}>{t(lang, 'review_empty_desc')}</p>
            </div>
          ) : (
            <>
              {/* Due today */}
              {dueWords.length > 0 && (
                <div className="glass-card glass-card--gold" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div className="title-card">{t(lang, 'review_due_today')}</div>
                      <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {dueWords.length} {t(lang, 'review_words')}
                      </div>
                    </div>
                    <span style={{ fontSize: 32 }}>🔔</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => startReview(dueWords)}>
                    {t(lang, 'review_start_due')}
                  </button>
                </div>
              )}

              {/* All saved words */}
              <div className="glass-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div className="title-card">{t(lang, 'review_all_words')}</div>
                    <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {allWords.length} {t(lang, 'review_words')}
                    </div>
                  </div>
                  <span style={{ fontSize: 32 }}>📚</span>
                </div>
                <button className="btn btn-ghost" onClick={() => startReview(allWords)}>
                  {t(lang, 'review_start_all')}
                </button>
              </div>

              {/* Word list preview */}
              <div className="glass-card">
                <div className="title-card" style={{ marginBottom: 12 }}>{t(lang, 'review_saved_list')}</div>
                {allWords.map((w, i) => (
                  <div key={w.word_id}>
                    {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => speakArabic(w.ar)}
                        style={{ background: 'rgba(192,150,60,0.10)', border: '1px solid rgba(192,150,60,0.25)', borderRadius: 8, padding: '3px 6px', cursor: 'pointer', color: 'var(--accent-gold)', flexShrink: 0, display: 'flex' }}
                      >
                        <span style={{ fontSize: 13 }}>🔊</span>
                      </button>
                      <span className="text-arabic" style={{ fontSize: 18, flex: 1 }}>{w.ar}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.correct}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
                        background: w.due <= Date.now() ? 'rgba(192,57,43,0.15)' : 'rgba(39,174,96,0.12)',
                        color: w.due <= Date.now() ? 'var(--danger)' : 'var(--success)',
                      }}>
                        {w.due <= Date.now() ? t(lang, 'review_overdue') : `${w.interval}д`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Done screen ─────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
        <h2 className="title-screen" style={{ marginBottom: 8 }}>{t(lang, 'review_done_title')}</h2>
        <div style={{ display: 'flex', gap: 20, margin: '16px 0 28px' }}>
          <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 18 }}>✓ {correct}</span>
          <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 18 }}>✗ {wrong}</span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => startReview(queue)}>
          <RotateCcw size={16} /> {t(lang, 'review_again')}
        </button>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onBack}>
          {t(lang, 'back')}
        </button>
      </div>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────────
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{t(lang, 'review_title')}</h1>
        <span style={{ color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700 }}>{idx + 1}/{queue.length}</span>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${progress}%`, transition: 'width 0.3s', borderRadius: '0 2px 2px 0' }} />
      </div>

      <div className="page-content" style={{ paddingTop: 24, display: 'flex', flexDirection: 'column' }}>
        {/* Card */}
        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: '36px 20px', marginBottom: 20, minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: revealed ? 'default' : 'pointer' }}
          onClick={() => !revealed && setRevealed(true)}
        >
          <button
            onClick={e => { e.stopPropagation(); speakArabic(card.ar); }}
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(192,150,60,0.12)', border: '1px solid rgba(192,150,60,0.30)', borderRadius: 10, padding: '5px 8px', cursor: 'pointer', color: 'var(--accent-gold)', display: 'flex' }}
          >
            <span style={{ fontSize: 14 }}>🔊</span>
          </button>

          <div className="text-arabic-lg" style={{ marginBottom: 10 }}>{card.ar}</div>
          <div className="text-trans" style={{ marginBottom: revealed ? 20 : 0 }}>{card.trans}</div>

          {revealed ? (
            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{card.correct}</div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>👆 {t(lang, 'lesson_tap_card')}</p>
          )}
        </div>

        {/* Знал / Не знал */}
        {revealed && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleForgot}>
              <XCircle size={18} /> {t(lang, 'review_forgot')}
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleKnown}>
              <CheckCircle2 size={18} /> {t(lang, 'review_knew')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

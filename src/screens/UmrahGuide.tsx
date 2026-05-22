import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { GuideSection, GuideSectionContent, GuideQuestion, GuideAnswerResult } from '../api/client';

interface Props {
  lang: Lang;
  onBack: () => void;
}

type View = 'sections' | 'detail' | 'quiz';

export default function UmrahGuide({ lang, onBack }: Props) {
  const [view, setView]       = useState<View>('sections');
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [current, setCurrent] = useState<GuideSectionContent | null>(null);
  const [question, setQuestion] = useState<GuideQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getUmrahSections().then(setSections);
  }, []);

  async function openSection(key: string) {
    setLoading(true);
    try {
      const data = await api.getUmrahSection(key);
      setCurrent(data);
      setView('detail');
    } finally {
      setLoading(false);
    }
  }

  async function startTest() {
    if (!current) return;
    setLoading(true);
    setDone(false);
    setFeedback(null);
    try {
      const q = await api.startUmrahQuiz(current.key);
      setQuestion(q);
      setView('quiz');
    } finally {
      setLoading(false);
    }
  }

  async function handleVisualAnswer(chosenRef: string) {
    if (!question || loading) return;
    setLoading(true);
    try {
      const res = await api.answerUmrahQuiz(
        question.correct_ref, lang, 'visual', chosenRef
      );
      handleResult(res);
    } finally {
      setLoading(false);
    }
  }

  function handleResult(res: GuideAnswerResult) {
    setFeedback({ correct: res.correct, msg: res.feedback });
    if (res.done) { setDone(true); return; }
    if (res.next) {
      setTimeout(() => { setQuestion(res.next!); setFeedback(null); }, 900);
    }
  }

  if (view === 'quiz' && question) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onClick={() => { setView('detail'); setFeedback(null); }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>{t(lang, 'umrah_title')} — тест</h1>
          <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700 }}>
            {question.idx + 1}/{question.total}
          </span>
        </div>
        <div className="page-content" style={{ paddingTop: 16 }}>
          {done ? (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <div style={{ fontSize: 56 }}>🎉</div>
              <h2 className="title-screen" style={{ marginTop: 16 }}>{t(lang, 'done_title')}</h2>
              <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={startTest}>↺</button>
            </div>
          ) : (
            <>
              <div className="glass-card" style={{ textAlign: 'center', marginBottom: 20, padding: '28px 20px' }}>
                <div className="text-arabic-lg">{question.ar}</div>
                <div className="text-trans" style={{ marginTop: 10, fontStyle: 'italic', color: 'var(--text-main)' }}>{question.trans}</div>
              </div>
              {feedback && (
                <div className={`glass-card ${feedback.correct ? 'flash-correct' : 'flash-wrong'}`}
                  style={{ marginBottom: 14, borderColor: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  {feedback.correct ? <CheckCircle2 size={18} color="var(--accent-teal)" /> : <XCircle size={18} color="var(--danger)" />}
                  <span style={{ fontWeight: 600, color: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)', fontSize: 14 }}>
                    {feedback.correct ? t(lang, 'correct_msg') : `${t(lang, 'wrong_msg')} ${feedback.msg}`}
                  </span>
                </div>
              )}
              {question.choices && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {question.choices.map((ch, i) => (
                    <button key={i} className="btn btn-ghost"
                      style={{ height: 'auto', padding: '14px', textAlign: 'left', justifyContent: 'flex-start', color: '#FFFFFF', fontWeight: 600 }}
                      disabled={!!feedback || loading}
                      onClick={() => handleVisualAnswer(ch.ref)}>
                      {ch.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (view === 'detail' && current) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Hero */}
        <div className="islamic-header" style={{
          padding: '40px 20px 24px',
          background: 'linear-gradient(180deg, rgba(13,31,26,0.7) 0%, var(--bg-deep) 100%), url(https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600) center/cover no-repeat',
          textAlign: 'center',
        }}>
          <button style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onClick={() => setView('sections')}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{current.emoji}</div>
          <h1 className="title-screen">{current.title}</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
            {current.phrases.length} {t(lang, 'phrase_count')}
          </div>
        </div>

        <div className="page-content" style={{ paddingTop: 12 }}>
          {current.phrases.map((ph, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div className="glass-card">
                <div className="text-arabic" style={{ fontSize: 20, marginBottom: 6, color: 'var(--text-main)' }}>
                  {ph.ar}
                </div>
                <div style={{ color: 'var(--accent-teal)', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>
                  {ph.trans}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-main)' }}>{ph.translation}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px 24px', background: 'var(--bg-deep)' }}>
          <button className="btn btn-gold" onClick={startTest}>
            {t(lang, 'btn_start_test')}
          </button>
        </div>
      </div>
    );
  }

  // Sections list
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div className="islamic-header" style={{
        padding: '40px 20px 28px',
        background: 'linear-gradient(180deg, rgba(13,31,26,0.6) 0%, var(--bg-deep) 100%), url(https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600) center/cover no-repeat',
        textAlign: 'center',
      }}>
        <button style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        {/* Pilgrim silhouette SVG */}
        <svg width="48" height="64" viewBox="0 0 48 64" fill="none" style={{ marginBottom: 10 }}>
          <circle cx="24" cy="10" r="8" fill="#C9A84C" opacity="0.8" />
          <rect x="10" y="20" width="28" height="36" rx="4" fill="#C9A84C" opacity="0.7" />
          <rect x="8" y="22" width="32" height="4" rx="2" fill="#C9A84C" opacity="0.5" />
        </svg>
        <h1 className="title-screen" style={{ marginBottom: 4 }}>{t(lang, 'umrah_title')}</h1>
        <p className="text-muted" style={{ fontSize: 13 }}>{t(lang, 'umrah_subtitle')}</p>
      </div>

      <div className="page-content" style={{ paddingTop: 12 }}>
        {sections.map((sec) => (
          <div key={sec.key}
            className="glass-card"
            style={{ marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
            onClick={() => openSection(sec.key)}
          >
            <span style={{ fontSize: 28 }}>{sec.emoji}</span>
            <div style={{ flex: 1 }}>
              <div className="title-card">{sec.title}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{sec.phrase_count} {t(lang, 'phrase_count')}</div>
            </div>
            <ChevronDown size={18} color="var(--text-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
}

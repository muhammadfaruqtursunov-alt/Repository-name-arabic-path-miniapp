import { useState, useEffect } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { Question } from '../api/client';

interface Props { lang: Lang; onBack: () => void; }

export default function AskTeacher({ lang, onBack }: Props) {
  const [text, setText]         = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const MAX = 500;

  useEffect(() => {
    api.getQuestions().then(setQuestions).catch(() => {});
  }, []);

  async function handleSend() {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await api.askQuestion(text.trim());
      setText('');
      setSent(true);
      const fresh = await api.getQuestions();
      setQuestions(fresh);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{t(lang, 'teacher_title')}</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 16 }}>
        {/* Teacher card */}
        <div className="glass-card glass-card--gold" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0,
          }}>👨‍🏫</div>
          <div>
            <div className="title-card">{t(lang, 'teacher_name')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-teal)' }} />
              <span style={{ color: 'var(--accent-teal)', fontSize: 13 }}>{t(lang, 'teacher_online')}</span>
            </div>
          </div>
        </div>

        {/* Question form */}
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <textarea
            className="input-field"
            placeholder={t(lang, 'question_placeholder')}
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX))}
            style={{ minHeight: 120, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="text-muted" style={{ fontSize: 12 }}>{text.length}/{MAX} {t(lang, 'char_counter')}</span>
          </div>
          {sent ? (
            <div className="glass-card" style={{ borderColor: 'var(--accent-teal)', textAlign: 'center', color: 'var(--accent-teal)', padding: 12 }}>
              {t(lang, 'sent_ok')}
            </div>
          ) : (
            <button className="btn btn-primary" disabled={!text.trim() || loading} onClick={handleSend}>
              <Send size={16} /> {t(lang, 'btn_send')}
            </button>
          )}
        </div>

        {/* History */}
        {questions.length > 0 && (
          <>
            <h2 className="title-card" style={{ marginBottom: 12 }}>{t(lang, 'history_title')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions.map((q) => (
                <div key={q.id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="text-badge text-muted">
                      {q.created_at ? new Date(q.created_at).toLocaleDateString() : ''}
                    </span>
                    <span className={`badge ${q.answered ? 'badge--teal' : 'badge--muted'}`}>
                      {q.answered ? t(lang, 'status_answered') : t(lang, 'status_pending')}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, marginBottom: q.answer ? 10 : 0 }}>{q.question}</p>
                  {q.answer && (
                    <>
                      <div className="gold-divider" />
                      <p style={{ fontSize: 13, color: 'var(--accent-teal)', fontStyle: 'italic' }}>{q.answer}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  MessageCircleQuestion, Megaphone, Mail, ImageIcon,
  Send, Users, CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import type { TeacherStats, TeacherQuestion } from '../api/client';
import type { Lang } from '../i18n';
import Settings from './Settings';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onBgChange: (url: string) => void;
}

// ── Background presets (same as Settings) ─────────────────────────
const BG_PRESETS = [
  { id: 'none',   label: '⬛ Без фона', url: '' },
  { id: 'kaaba',  label: '🕋 Кааба',   url: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1080&auto=format&fit=crop' },
  { id: 'medina', label: '🕌 Медина',  url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1080&auto=format&fit=crop' },
  { id: 'mosque', label: '🌙 Мечеть',  url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1080&auto=format&fit=crop' },
];

type Panel = 'questions' | 'broadcast' | 'message' | 'bg' | null;
type TeacherTab = 'dashboard' | 'settings';

export default function TeacherDashboard({ lang, onLangChange, onBgChange }: Props) {
  const [tab, setTab] = useState<TeacherTab>('dashboard');
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);

  // Questions panel
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [answerDraft, setAnswerDraft] = useState<Record<number, string>>({});
  const [answerSending, setAnswerSending] = useState<number | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());

  // Broadcast panel
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  // Personal message panel
  const [msgStudentId, setMsgStudentId] = useState<number | null>(null);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgResult, setMsgResult] = useState<string | null>(null);

  // Background panel
  const [activeBg, setActiveBg] = useState<string>(() => localStorage.getItem('ap_bg_url') ?? '');
  const [bgSaving, setBgSaving] = useState(false);
  const [bgSaved, setBgSaved] = useState(false);

  useEffect(() => {
    api.getTeacherStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  function togglePanel(p: Panel) {
    if (panel === p) { setPanel(null); return; }
    setPanel(p);
    if (p === 'questions') loadQuestions();
    if (p === 'message' && stats?.students?.length) setMsgStudentId(stats.students[0].user_id);
  }

  async function loadQuestions() {
    try {
      const rows = await api.teacherGetQuestions();
      setQuestions(rows);
    } catch {}
  }

  async function sendAnswer(qId: number) {
    const text = (answerDraft[qId] || '').trim();
    if (!text) return;
    setAnswerSending(qId);
    try {
      await api.teacherAnswerQuestion(qId, text);
      setAnsweredIds(prev => new Set([...prev, qId]));
      setAnswerDraft(prev => ({ ...prev, [qId]: '' }));
      if (stats) setStats({ ...stats, unanswered_questions: Math.max(0, stats.unanswered_questions - 1) });
    } catch (e) {
      alert('Ошибка: ' + String(e));
    } finally {
      setAnswerSending(null);
    }
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const res = await api.teacherBroadcast(broadcastMsg.trim());
      setBroadcastResult(`✅ Отправлено: ${res.sent}, ошибок: ${res.failed}`);
      setBroadcastMsg('');
    } catch (e) {
      setBroadcastResult('❌ Ошибка: ' + String(e));
    } finally {
      setBroadcastSending(false);
    }
  }

  async function sendPersonalMessage() {
    if (!msgStudentId || !msgText.trim()) return;
    setMsgSending(true);
    setMsgResult(null);
    try {
      await api.teacherPersonalMessage(msgStudentId, msgText.trim());
      setMsgResult('✅ Сообщение отправлено');
      setMsgText('');
    } catch (e) {
      setMsgResult('❌ Ошибка: ' + String(e));
    } finally {
      setMsgSending(false);
    }
  }

  async function applyGlobalBg(url: string) {
    setActiveBg(url);
    onBgChange(url);
  }

  async function saveGlobalBg() {
    setBgSaving(true);
    setBgSaved(false);
    try {
      await api.setGlobalBg(activeBg);
      setBgSaved(true);
      setTimeout(() => setBgSaved(false), 2500);
    } catch {}
    finally { setBgSaving(false); }
  }

  const activePresetId = BG_PRESETS.find(p => p.url === activeBg)?.id ?? 'none';

  // ── Settings tab ─────────────────────────────────────────────────
  if (tab === 'settings') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Settings lang={lang} onLangChange={onLangChange} onBgChange={onBgChange} />
        {/* Teacher bottom nav */}
        <TeacherNav tab={tab} setTab={setTab} unanswered={stats?.unanswered_questions ?? 0} />
      </div>
    );
  }

  // ── Dashboard tab ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 90 }}>
        <h1 className="title-screen" style={{ marginBottom: 20 }}>👨‍🏫 Кабинет учителя</h1>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Учеников',      value: stats?.total_students ?? 0,      emoji: '👥' },
            { label: 'Активных',      value: stats?.active_students ?? 0,      emoji: '✅' },
            { label: 'Слов выучено',  value: stats?.total_words_learned ?? 0,  emoji: '📚' },
            { label: 'Вопросов',      value: stats?.unanswered_questions ?? 0, emoji: '❓' },
          ].map(card => (
            <div key={card.label} className="glass-card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 26 }}>{card.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-gold)', marginTop: 4 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <ActionBtn
            icon={<MessageCircleQuestion size={20} />}
            label="Вопросы"
            badge={stats?.unanswered_questions ?? 0}
            active={panel === 'questions'}
            onClick={() => togglePanel('questions')}
            color="var(--accent-teal)"
          />
          <ActionBtn
            icon={<Megaphone size={20} />}
            label="Рассылка"
            active={panel === 'broadcast'}
            onClick={() => togglePanel('broadcast')}
            color="var(--accent-gold)"
          />
          <ActionBtn
            icon={<Mail size={20} />}
            label="Личное сообщение"
            active={panel === 'message'}
            onClick={() => togglePanel('message')}
            color="var(--accent-teal)"
          />
          <ActionBtn
            icon={<ImageIcon size={20} />}
            label="Фон учеников"
            active={panel === 'bg'}
            onClick={() => togglePanel('bg')}
            color="var(--accent-sage)"
          />
        </div>

        {/* ── Questions panel ────────────────────────────────── */}
        {panel === 'questions' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 12 }}>❓ Вопросы учеников</p>
            {questions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет новых вопросов 🎉</p>
            ) : (
              questions.map(q => {
                const done = answeredIds.has(q.id);
                return (
                  <div key={q.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 700 }}>
                        {q.user_name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {q.created_at ? new Date(q.created_at).toLocaleDateString('ru') : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-main)' }}>{q.question}</p>
                    {done ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-teal)', fontSize: 13 }}>
                        <CheckCircle2 size={14} /> Ответ отправлен
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <textarea
                          className="input-field"
                          placeholder="Введите ответ..."
                          value={answerDraft[q.id] ?? ''}
                          onChange={e => setAnswerDraft(p => ({ ...p, [q.id]: e.target.value }))}
                          style={{ flex: 1, minHeight: 70, fontSize: 13 }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ width: 44, padding: 0 }}
                          disabled={answerSending === q.id}
                          onClick={() => sendAnswer(q.id)}
                        >
                          {answerSending === q.id ? '...' : <Send size={16} />}
                        </button>
                      </div>
                    )}
                    <div style={{ height: 1, background: 'var(--border)', marginTop: 12 }} />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Broadcast panel ────────────────────────────────── */}
        {panel === 'broadcast' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 12 }}>📢 Рассылка всем ученикам</p>
            <textarea
              className="input-field"
              placeholder="Введите сообщение для рассылки..."
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <button
              className="btn btn-gold"
              disabled={broadcastSending || !broadcastMsg.trim()}
              onClick={sendBroadcast}
            >
              {broadcastSending ? 'Отправка...' : '📢 Отправить всем'}
            </button>
            {broadcastResult && (
              <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-teal)' }}>{broadcastResult}</p>
            )}
          </div>
        )}

        {/* ── Personal message panel ─────────────────────────── */}
        {panel === 'message' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 12 }}>✉️ Личное сообщение</p>
            {!stats?.students?.length ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет учеников</p>
            ) : (
              <>
                <select
                  className="input-field"
                  style={{ marginBottom: 10 }}
                  value={msgStudentId ?? ''}
                  onChange={e => setMsgStudentId(Number(e.target.value))}
                >
                  {stats.students.map(s => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.name} (Кн.{s.current_book} Ур.{s.current_lesson})
                    </option>
                  ))}
                </select>
                <textarea
                  className="input-field"
                  placeholder="Введите сообщение..."
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <button
                  className="btn btn-primary"
                  disabled={msgSending || !msgText.trim()}
                  onClick={sendPersonalMessage}
                >
                  {msgSending ? 'Отправка...' : '✉️ Отправить'}
                </button>
                {msgResult && (
                  <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-teal)' }}>{msgResult}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Background panel ───────────────────────────────── */}
        {panel === 'bg' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 4 }}>🖼️ Фон для всех учеников</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Выберите фон — ученики увидят его при следующем открытии приложения
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {BG_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyGlobalBg(preset.url)}
                  style={{
                    position: 'relative', height: 80, borderRadius: 14,
                    border: activePresetId === preset.id
                      ? '2.5px solid var(--accent-teal)'
                      : '1.5px solid rgba(45,212,160,0.2)',
                    overflow: 'hidden', cursor: 'pointer',
                    background: preset.url
                      ? `linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.5)), url(${preset.url}) center/cover`
                      : 'rgba(20,45,30,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 150ms',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {preset.label}
                  </span>
                  {activePresetId === preset.id && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--accent-teal)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#021a12', fontWeight: 700,
                    }}>✓</div>
                  )}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              disabled={bgSaving}
              onClick={saveGlobalBg}
            >
              {bgSaved ? '✅ Сохранено!' : bgSaving ? 'Сохраняем...' : '💾 Применить для всех учеников'}
            </button>
          </div>
        )}

        {/* Students list */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} color="var(--accent-teal)" />
            <p className="title-card">Топ учеников</p>
          </div>
          {(stats?.students ?? []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Пока нет учеников</p>
          ) : (
            (stats?.students ?? []).map((s, i) => (
              <div key={s.user_id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 20 }}>{i + 1}.</span>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Т{s.current_book} У{s.current_lesson}</span>
                  <span style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 600 }}>{s.learned} сл.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <TeacherNav tab={tab} setTab={setTab} unanswered={stats?.unanswered_questions ?? 0} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function ActionBtn({ icon, label, badge, active, onClick, color }: {
  icon: React.ReactNode; label: string; badge?: number;
  active: boolean; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: active ? `rgba(45,212,160,0.15)` : 'rgba(20,45,30,0.5)',
        border: `1.5px solid ${active ? 'rgba(45,212,160,0.5)' : 'rgba(45,212,160,0.2)'}`,
        borderRadius: 16, padding: '14px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: 'pointer', transition: 'all 150ms', color,
      }}
    >
      {icon}
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--danger)', color: '#fff',
          borderRadius: '50%', width: 18, height: 18,
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {badge}
        </span>
      )}
      <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: -2 }}>
        {active ? '▲' : '▾'}
      </span>
    </button>
  );
}

function TeacherNav({ tab, setTab, unanswered }: {
  tab: TeacherTab;
  setTab: (t: TeacherTab) => void;
  unanswered: number;
}) {
  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav__item${tab === 'dashboard' ? ' active' : ''}`}
        onClick={() => setTab('dashboard')}
      >
        <Users size={20} />
        <span>Кабинет</span>
      </button>
      <button
        className={`bottom-nav__item${tab === 'settings' ? ' active' : ''}`}
        onClick={() => setTab('settings')}
        style={{ position: 'relative' }}
      >
        {unanswered > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 'calc(50% - 18px)',
            background: 'var(--danger)', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unanswered}
          </span>
        )}
        <MessageCircleQuestion size={20} />
        <span>Настройки</span>
      </button>
    </nav>
  );
}

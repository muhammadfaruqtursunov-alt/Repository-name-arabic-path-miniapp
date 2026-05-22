import { useEffect, useState, useRef, useCallback } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import {
  MessageCircleQuestion, Megaphone, Mail, ImageIcon,
  Send, Users, CheckCircle2, Camera, Trash2,
} from 'lucide-react';
import { formatAppTime } from '../utils/formatTime';
import { api } from '../api/client';
import type { TeacherStats, TeacherQuestion } from '../api/client';
import type { Lang } from '../i18n';
import { resizeImageToDataUrl } from '../utils/imageResize';
import Settings from './Settings';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onBgChange: (url: string) => void;
}

type Panel = 'questions' | 'broadcast' | 'message' | 'bg' | null;
type TeacherTab = 'dashboard' | 'settings';
const TAB_ORDER: TeacherTab[] = ['dashboard', 'settings'];

export default function TeacherDashboard({ lang, onLangChange, onBgChange }: Props) {
  const [tab, setTab] = useState<TeacherTab>('dashboard');

  const handleSwipeLeft = useCallback(() => {
    const idx = TAB_ORDER.indexOf(tab);
    if (idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
  }, [tab]);

  const handleSwipeRight = useCallback(() => {
    const idx = TAB_ORDER.indexOf(tab);
    if (idx > 0) setTab(TAB_ORDER[idx - 1]);
  }, [tab]);

  const swipeHandlers = useSwipe(handleSwipeLeft, handleSwipeRight);
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
  const [globalBg, setGlobalBg] = useState<string>('');        // full-size for local preview
  const [globalBgSmall, setGlobalBgSmall] = useState<string>(''); // 600px/60% for server
  const [bgLoading, setBgLoading] = useState(false);
  const [bgSaving, setBgSaving] = useState(false);
  const [bgSaved, setBgSaved] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getTeacherStats()
      .then(setStats)
      .finally(() => setLoading(false));
    // Load current global bg from server
    api.getAppConfig()
      .then(cfg => {
        if (cfg.bg_url) {
          setGlobalBg(cfg.bg_url);
          setGlobalBgSmall(cfg.bg_url);
        }
      })
      .catch(() => {});
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

  async function handleBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgLoading(true);
    try {
      // Full size for local display
      const full = await resizeImageToDataUrl(file, 1080, 0.75);
      // Small compressed version for server storage (~50-100KB)
      const small = await resizeImageToDataUrl(full, 600, 0.60);
      setGlobalBg(full);
      setGlobalBgSmall(small);
      // Apply to teacher's own screen immediately
      onBgChange(full);
    } catch {
      alert('Не удалось загрузить фото');
    } finally {
      setBgLoading(false);
      if (bgFileRef.current) bgFileRef.current.value = '';
    }
  }

  async function saveGlobalBg() {
    if (!globalBgSmall) return;
    setBgSaving(true);
    setBgSaved(false);
    try {
      await api.setGlobalBg(globalBgSmall);
      setBgSaved(true);
      setTimeout(() => setBgSaved(false), 2500);
    } catch (e) {
      alert('Ошибка: ' + String(e));
    } finally {
      setBgSaving(false);
    }
  }

  async function removeGlobalBg() {
    setGlobalBg('');
    setGlobalBgSmall('');
    onBgChange('');
    try { await api.setGlobalBg(''); } catch {}
  }

  // ── Settings tab ─────────────────────────────────────────────────
  if (tab === 'settings') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} {...swipeHandlers}>
        <Settings lang={lang} onLangChange={onLangChange} onBgChange={onBgChange} />
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
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} {...swipeHandlers}>
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 90 }}>
        <h1 className="title-screen" style={{ marginBottom: 20 }}>👨‍🏫 Кабинет учителя</h1>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Учеников',      value: stats?.total_students ?? 0,      emoji: '📋' },
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
              Загрузите фото — ученики увидят его при следующем открытии приложения
            </p>

            {/* Preview */}
            {globalBg ? (
              <div style={{
                width: '100%', height: 130, borderRadius: 14,
                backgroundImage: `url(${globalBg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                marginBottom: 12, position: 'relative',
                border: '1.5px solid rgba(45,212,160,0.4)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 14,
                  background: 'linear-gradient(rgba(0,0,0,0.15),rgba(0,0,0,0.45))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                    📸 Фото выбрано
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                width: '100%', height: 90, borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px dashed rgba(45,212,160,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, color: 'var(--text-muted)', fontSize: 13,
              }}>
                Фото не выбрано
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={bgFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBgFileChange}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                disabled={bgLoading}
                onClick={() => bgFileRef.current?.click()}
              >
                <Camera size={16} />
                {bgLoading ? 'Загрузка...' : '📷 Выбрать из галереи'}
              </button>
              {globalBg && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: 48, padding: 0 }}
                  onClick={removeGlobalBg}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {globalBg && (
              <button
                className="btn btn-primary"
                disabled={bgSaving}
                onClick={saveGlobalBg}
              >
                {bgSaved ? '✅ Сохранено для всех!' : bgSaving ? 'Сохраняем...' : '💾 Применить для всех учеников'}
              </button>
            )}
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
                  <span style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 500 }}>⏱ {formatAppTime(s.total_app_time ?? 0)}</span>
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
        background: active ? 'rgba(45,212,160,0.15)' : 'rgba(20,45,30,0.5)',
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

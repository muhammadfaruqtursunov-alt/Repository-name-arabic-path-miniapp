import { useEffect, useState, useRef, useCallback } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import {
  MessageCircleQuestion, Megaphone, Mail, ImageIcon,
  Send, Users, CheckCircle2, Camera, Trash2,
  ChevronDown, ChevronUp, History, RefreshCw, RotateCcw,
  Settings2, TrendingUp, BookOpen,
} from 'lucide-react';
import { formatAppTime } from '../utils/formatTime';
import { api } from '../api/client';
import type { TeacherStats, TeacherQuestion, AllQuestion, AllStudent, LazyStudent } from '../api/client';
import type { Lang } from '../i18n';
import { resizeImageToDataUrl } from '../utils/imageResize';
import Settings from './Settings';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onBgChange: (url: string) => void;
  onOpenThemes: () => void;
}

type Panel = 'questions' | 'broadcast' | 'message' | 'bg' | 'lazy_broadcast' | null;
type TeacherTab = 'dashboard' | 'settings';
const TAB_ORDER: TeacherTab[] = ['dashboard', 'settings'];

// ── Rank medal by position ────────────────────────────────────────
function rankMedal(idx: number): string {
  if (idx === 0) return '🥇';
  if (idx === 1) return '🥈';
  if (idx === 2) return '🥉';
  if (idx <= 9)  return '🏅';
  return `${idx + 1}.`;
}

export default function TeacherDashboard({ lang, onLangChange, onBgChange, onOpenThemes }: Props) {
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

  // ── Core data ──────────────────────────────────────────────────
  const [stats, setStats]   = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel]   = useState<Panel>(null);

  // ── Questions ──────────────────────────────────────────────────
  const [questions, setQuestions]         = useState<TeacherQuestion[]>([]);
  const [answeredIds, setAnsweredIds]     = useState<Set<number>>(new Set());
  const [answerDraft, setAnswerDraft]     = useState<Record<number, string>>({});
  const [answerSending, setAnswerSending] = useState<number | null>(null);
  const [showQHistory, setShowQHistory]   = useState(false);
  const [allQuestions, setAllQuestions]   = useState<AllQuestion[]>([]);
  const [allQLoading, setAllQLoading]     = useState(false);

  // ── Student list ───────────────────────────────────────────────
  const [allStudents, setAllStudents]         = useState<AllStudent[]>([]);
  const [allStudentsLoaded, setAllStudentsLoaded] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  // Per-student inline message
  const [studentMsgDraft, setStudentMsgDraft]   = useState<Record<number, string>>({});
  const [studentMsgSending, setStudentMsgSending] = useState<number | null>(null);
  const [studentMsgSent, setStudentMsgSent]     = useState<Set<number>>(new Set());
  const [showMsgFor, setShowMsgFor]             = useState<number | null>(null);

  // Per-student reset confirm
  const [confirmReset, setConfirmReset] = useState<number | null>(null);
  const [resetDone, setResetDone]       = useState<Set<number>>(new Set());
  const [resetBusy, setResetBusy]       = useState(false);

  // ⚙️ Настройки ученика
  const [showSettingsFor, setShowSettingsFor] = useState<number | null>(null);
  const [boostBusy, setBoostBusy]   = useState(false);
  const [boostDone, setBoostDone]   = useState<Set<number>>(new Set());
  const [setBookBusy, setSetBookBusy] = useState(false);
  const [setBookDoneFor, setSetBookDoneFor] = useState<Record<number, number>>({});

  // ── Lazy students ──────────────────────────────────────────────
  const [lazyStudents, setLazyStudents]   = useState<LazyStudent[]>([]);
  const [lazyLoaded, setLazyLoaded]       = useState(false);
  const [showLazy, setShowLazy]           = useState(false);
  const [lazyMsgFor, setLazyMsgFor]       = useState<number | null>(null);
  const [lazyMsgDraft, setLazyMsgDraft]   = useState<Record<number, string>>({});
  const [lazyMsgSending, setLazyMsgSending] = useState<number | null>(null);
  const [lazyMsgSent, setLazyMsgSent]     = useState<Set<number>>(new Set());
  // Lazy broadcast with exclusions
  const [showLazyBroadcast, setShowLazyBroadcast] = useState(false);
  const [lazyExcluded, setLazyExcluded]     = useState<Set<number>>(new Set());
  const [lazyBcastMsg, setLazyBcastMsg]     = useState('');
  const [lazyBcasting, setLazyBcasting]     = useState(false);
  const [lazyBcastResult, setLazyBcastResult] = useState<string | null>(null);

  // ── Question dismissal ─────────────────────────────────────────
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  // ── Broadcast panel ────────────────────────────────────────────
  const [broadcastMsg, setBroadcastMsg]     = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult]   = useState<string | null>(null);

  // ── Personal message panel ─────────────────────────────────────
  const [msgStudentId, setMsgStudentId] = useState<number | null>(null);
  const [msgText, setMsgText]           = useState('');
  const [msgSending, setMsgSending]     = useState(false);
  const [msgResult, setMsgResult]       = useState<string | null>(null);

  // ── Background panel ───────────────────────────────────────────
  const [globalBg, setGlobalBg]           = useState('');
  const [globalBgSmall, setGlobalBgSmall] = useState('');
  const [bgLoading, setBgLoading]         = useState(false);
  const [bgSaving, setBgSaving]           = useState(false);
  const [bgSaved, setBgSaved]             = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  // Активность / история
  const [showActivity, setShowActivity] = useState(false);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    api.getTeacherStats().then(setStats).finally(() => setLoading(false));
    api.getAppConfig().then(cfg => {
      if (cfg.bg_url) { setGlobalBg(cfg.bg_url); setGlobalBgSmall(cfg.bg_url); }
    }).catch(() => {});
    // load full student list up-front for the new-students banner + activity chart
    api.teacherGetAllStudents()
      .then(rows => { setAllStudents(rows); setAllStudentsLoaded(true); })
      .catch(() => {});
  }, []);

  // ── Panel toggle ───────────────────────────────────────────────
  function togglePanel(p: Panel) {
    if (panel === p) { setPanel(null); return; }
    setPanel(p);
    if (p === 'questions') loadQuestions();
    if (p === 'message' && stats?.students?.length) setMsgStudentId(stats.students[0].user_id);
    if (p === 'lazy_broadcast' && !lazyLoaded) {
      api.teacherGetLazy().then(rows => { setLazyStudents(rows); setLazyLoaded(true); }).catch(() => {});
    }
  }

  // ── Question loaders ───────────────────────────────────────────
  async function loadQuestions() {
    try { const rows = await api.teacherGetQuestions(); setQuestions(rows); } catch {}
  }

  async function loadAllQuestions() {
    setAllQLoading(true);
    try { setAllQuestions(await api.teacherGetAllQuestions()); } catch {}
    setAllQLoading(false);
  }

  function toggleQHistory() {
    if (!showQHistory && allQuestions.length === 0) loadAllQuestions();
    setShowQHistory(v => !v);
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
    } catch (e) { alert('Ошибка: ' + String(e)); }
    finally { setAnswerSending(null); }
  }

  // ── Student list helpers ───────────────────────────────────────
  async function loadAllStudents() {
    if (allStudentsLoaded) { setShowAllStudents(true); return; }
    try {
      const rows = await api.teacherGetAllStudents();
      setAllStudents(rows);
      setAllStudentsLoaded(true);
      setShowAllStudents(true);
    } catch {}
  }

  async function sendStudentMsg(userId: number, isLazy = false) {
    const text = isLazy
      ? (lazyMsgDraft[userId] || '').trim()
      : (studentMsgDraft[userId] || '').trim();
    if (!text) return;
    if (isLazy) setLazyMsgSending(userId); else setStudentMsgSending(userId);
    try {
      await api.teacherPersonalMessage(userId, text);
      if (isLazy) {
        setLazyMsgSent(p => new Set([...p, userId]));
        setLazyMsgDraft(p => ({ ...p, [userId]: '' }));
        setLazyMsgFor(null);
      } else {
        setStudentMsgSent(p => new Set([...p, userId]));
        setStudentMsgDraft(p => ({ ...p, [userId]: '' }));
        setShowMsgFor(null);
      }
    } catch (e) { alert('Ошибка: ' + String(e)); }
    finally { if (isLazy) setLazyMsgSending(null); else setStudentMsgSending(null); }
  }

  async function doResetStudent(userId: number) {
    setResetBusy(true);
    try {
      await api.teacherResetStudent(userId);
      setResetDone(p => new Set([...p, userId]));
      setConfirmReset(null);
      // Refresh stats
      api.getTeacherStats().then(setStats).catch(() => {});
    } catch (e) { alert('Ошибка: ' + String(e)); }
    finally { setResetBusy(false); }
  }

  async function doBoostRank(userId: number) {
    setBoostBusy(true);
    try {
      await api.teacherBoostRank(userId);
      setBoostDone(p => new Set([...p, userId]));
      setTimeout(() => setBoostDone(p => { const n = new Set(p); n.delete(userId); return n; }), 2500);
    } catch (e) { alert('Ошибка: ' + String(e)); }
    finally { setBoostBusy(false); }
  }

  async function doSetBook(userId: number, bookId: number) {
    setSetBookBusy(true);
    try {
      await api.teacherSetStudentBook(userId, bookId);
      setSetBookDoneFor(p => ({ ...p, [userId]: bookId }));
      setTimeout(() => setSetBookDoneFor(p => { const n = { ...p }; delete n[userId]; return n; }), 2500);
      api.getTeacherStats().then(setStats).catch(() => {});
    } catch (e) { alert('Ошибка: ' + String(e)); }
    finally { setSetBookBusy(false); }
  }

  async function loadLazy() {
    if (lazyLoaded) { setShowLazy(v => !v); return; }
    try {
      setLazyStudents(await api.teacherGetLazy());
      setLazyLoaded(true);
      setShowLazy(true);
    } catch {}
  }

  // ── Question dismiss / delete ─────────────────────────────────
  function handleMarkRead(id: number) {
    setDismissedIds(prev => new Set([...prev, id]));
    if (stats) setStats({ ...stats, unanswered_questions: Math.max(0, stats.unanswered_questions - 1) });
    api.teacherDismissQuestion(id).catch(() => {});
  }

  function handleDeleteQuestion(id: number) {
    setDismissedIds(prev => new Set([...prev, id]));
    if (stats) setStats({ ...stats, unanswered_questions: Math.max(0, stats.unanswered_questions - 1) });
    api.teacherDeleteQuestion(id).catch(() => {});
  }

  // ── Lazy broadcast ────────────────────────────────────────────
  async function sendLazyBroadcast() {
    const targets = lazyStudents.filter(s => !lazyExcluded.has(s.user_id));
    if (!targets.length || !lazyBcastMsg.trim()) return;
    setLazyBcasting(true); setLazyBcastResult(null);
    let sent = 0, failed = 0;
    for (const s of targets) {
      try { await api.teacherPersonalMessage(s.user_id, lazyBcastMsg.trim()); sent++; }
      catch { failed++; }
    }
    setLazyBcastResult(`✅ Отправлено: ${sent}, ошибок: ${failed}`);
    setLazyBcastMsg('');
    setLazyBcasting(false);
  }

  // ── Broadcast ─────────────────────────────────────────────────
  async function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true); setBroadcastResult(null);
    try {
      const res = await api.teacherBroadcast(broadcastMsg.trim());
      setBroadcastResult(`✅ Отправлено: ${res.sent}, ошибок: ${res.failed}`);
      setBroadcastMsg('');
    } catch (e) { setBroadcastResult('❌ Ошибка: ' + String(e)); }
    finally { setBroadcastSending(false); }
  }

  async function sendPersonalMessage() {
    if (!msgStudentId || !msgText.trim()) return;
    setMsgSending(true); setMsgResult(null);
    try {
      await api.teacherPersonalMessage(msgStudentId, msgText.trim());
      setMsgResult('✅ Сообщение отправлено'); setMsgText('');
    } catch (e) { setMsgResult('❌ Ошибка: ' + String(e)); }
    finally { setMsgSending(false); }
  }

  // ── Background ────────────────────────────────────────────────
  async function handleBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBgLoading(true);
    try {
      const full  = await resizeImageToDataUrl(file, 1080, 0.75);
      const small = await resizeImageToDataUrl(full, 600, 0.60);
      setGlobalBg(full); setGlobalBgSmall(small); onBgChange(full);
    } catch { alert('Не удалось загрузить фото'); }
    finally { setBgLoading(false); if (bgFileRef.current) bgFileRef.current.value = ''; }
  }

  async function saveGlobalBg() {
    if (!globalBgSmall) return;
    setBgSaving(true); setBgSaved(false);
    try { await api.setGlobalBg(globalBgSmall); setBgSaved(true); setTimeout(() => setBgSaved(false), 2500); }
    catch (e) { alert('Ошибка: ' + String(e)); }
    finally { setBgSaving(false); }
  }

  async function removeGlobalBg() {
    setGlobalBg(''); setGlobalBgSmall(''); onBgChange('');
    try { await api.setGlobalBg(''); } catch {}
  }

  // ── Settings tab ──────────────────────────────────────────────
  if (tab === 'settings') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} {...swipeHandlers}>
        <Settings lang={lang} onLangChange={onLangChange} onBgChange={onBgChange} onOpenThemes={onOpenThemes} />
        <TeacherNav tab={tab} setTab={setTab} unanswered={stats?.unanswered_questions ?? 0} />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    );
  }

  // Students to show in main list
  const topStudents = stats?.students ?? [];
  const studentsToShow = showAllStudents ? allStudents : topStudents;

  // Новые ученики за неделю — бейдж-оповещение на кнопке «Активность»
  const _weekAgoMs = Date.now() - 7 * 864e5;
  const newWeekCount = allStudents.filter(s => {
    const d = parseDate(s.created_at);
    return d !== null && d.getTime() >= _weekAgoMs;
  }).length;

  // Unanswered questions (filtered — answered or dismissed are hidden)
  const pendingQs = questions.filter(q => !answeredIds.has(q.id) && !dismissedIds.has(q.id));

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} {...swipeHandlers}>
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 90 }}>
        <h1 className="title-screen" style={{ marginBottom: 20 }}>👨‍🏫 Кабинет учителя</h1>

        {/* ── Summary cards 2×2 ─────────────────────────────────── */}
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

        {/* ── Активность и история (фильтр День / Неделя / Месяц) ─── */}
        <button
          onClick={() => setShowActivity(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', marginBottom: showActivity ? 8 : 16, cursor: 'pointer',
            borderRadius: 'var(--radius-card)', border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-main)', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 22 }}>📊</span>
          <span style={{ flex: 1, fontWeight: 600 }}>Активность и история</span>
          {newWeekCount > 0 && (
            <span style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: 20, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>
              🆕 {newWeekCount}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', transform: showActivity ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
        </button>
        {showActivity && <ActivitySection students={allStudents} />}

        {/* ── Action buttons 2×2 + 1 full-width ───────────────── */}
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

        {/* ── Lazy broadcast action btn (full-width) ────────────── */}
        <div style={{ marginBottom: 10 }}>
          <ActionBtn
            icon={<Megaphone size={20} />}
            label="Рассылка лентяям"
            active={panel === 'lazy_broadcast'}
            onClick={() => togglePanel('lazy_broadcast')}
            color="var(--accent-gold)"
            wide
          />
        </div>

        {/* ── Questions panel ───────────────────────────────────── */}
        {panel === 'questions' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <p className="title-card" style={{ flex: 1, margin: 0 }}>
                ❓ Вопросы без ответа
                {pendingQs.length > 0 && (
                  <span style={{
                    marginLeft: 8, background: 'var(--danger)', color: '#fff',
                    borderRadius: 10, fontSize: 11, padding: '1px 7px', fontWeight: 700,
                  }}>{pendingQs.length}</span>
                )}
              </p>
              {/* History toggle */}
              <button
                onClick={toggleQHistory}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: showQHistory ? 'rgba(192,150,60,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${showQHistory ? 'rgba(192,150,60,0.35)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10, padding: '5px 10px', cursor: 'pointer',
                  color: showQHistory ? 'var(--accent-teal)' : 'var(--text-muted)', fontSize: 12,
                }}
              >
                <History size={13} />
                История
              </button>
            </div>

            {/* Unanswered questions */}
            {pendingQs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет новых вопросов 🎉</p>
            ) : (
              pendingQs.map(q => (
                <div key={q.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 700 }}>{q.user_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {q.created_at ? new Date(q.created_at).toLocaleDateString('ru') : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-main)' }}>{q.question}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                      className="input-field"
                      placeholder="Введите ответ..."
                      value={answerDraft[q.id] ?? ''}
                      onChange={e => setAnswerDraft(p => ({ ...p, [q.id]: e.target.value }))}
                      style={{ flex: 1, minHeight: 60, fontSize: 13 }}
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
                  {/* Dismiss buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, fontSize: 11, gap: 5 }}
                      onClick={() => handleMarkRead(q.id)}
                    >
                      <CheckCircle2 size={13} /> Прочитано
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1, fontSize: 11, gap: 5 }}
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 size={13} /> Удалить
                    </button>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', marginTop: 12 }} />
                </div>
              ))
            )}

            {/* History sub-section */}
            {showQHistory && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>
                  📜 История вопросов
                </p>
                {allQLoading ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</p>
                ) : allQuestions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет вопросов</p>
                ) : (
                  allQuestions.map(q => (
                    <div key={q.id} style={{ marginBottom: 12, opacity: q.answered ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 700 }}>{q.user_name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {q.created_at ? new Date(q.created_at).toLocaleDateString('ru') : ''}
                        </span>
                        {q.answered && (
                          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent-teal)', fontWeight: 600 }}>
                            <CheckCircle2 size={10} style={{ display: 'inline', marginRight: 3 }} />отвечено
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-main)', marginBottom: q.answered ? 4 : 0 }}>
                        ❓ {q.question}
                      </p>
                      {q.answered && q.answer && (
                        <p style={{ fontSize: 12, color: 'var(--accent-teal)', paddingLeft: 8, borderLeft: '2px solid var(--accent-teal)', marginTop: 4 }}>
                          💬 {q.answer}
                        </p>
                      )}
                      <div style={{ height: 1, background: 'var(--border)', marginTop: 8 }} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Broadcast panel ───────────────────────────────────── */}
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
            <button className="btn btn-gold" disabled={broadcastSending || !broadcastMsg.trim()} onClick={sendBroadcast}>
              {broadcastSending ? 'Отправка...' : '📢 Отправить всем'}
            </button>
            {broadcastResult && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-teal)' }}>{broadcastResult}</p>}
          </div>
        )}

        {/* ── Personal message panel ────────────────────────────── */}
        {panel === 'message' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 12 }}>✉️ Личное сообщение</p>
            {!stats?.students?.length ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет учеников</p>
            ) : (
              <>
                <select className="input-field" style={{ marginBottom: 10 }}
                  value={msgStudentId ?? ''} onChange={e => setMsgStudentId(Number(e.target.value))}>
                  {stats.students.map(s => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.name} (Кн.{s.current_book} Ур.{s.current_lesson})
                    </option>
                  ))}
                </select>
                <textarea className="input-field" placeholder="Введите сообщение..."
                  value={msgText} onChange={e => setMsgText(e.target.value)} style={{ marginBottom: 10 }} />
                <button className="btn btn-primary" disabled={msgSending || !msgText.trim()} onClick={sendPersonalMessage}>
                  {msgSending ? 'Отправка...' : '✉️ Отправить'}
                </button>
                {msgResult && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-teal)' }}>{msgResult}</p>}
              </>
            )}
          </div>
        )}

        {/* ── Background panel ──────────────────────────────────── */}
        {panel === 'bg' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 4 }}>🖼️ Фон для всех учеников</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Загрузите фото — ученики увидят его при следующем открытии приложения
            </p>
            {globalBg ? (
              <div style={{
                width: '100%', height: 130, borderRadius: 14, backgroundImage: `url(${globalBg})`,
                backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 12,
                position: 'relative', border: '1.5px solid rgba(192,150,60,0.35)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 14,
                  background: 'linear-gradient(rgba(0,0,0,0.15),rgba(0,0,0,0.45))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>📸 Фото выбрано</span>
                </div>
              </div>
            ) : (
              <div style={{
                width: '100%', height: 90, borderRadius: 14, background: 'rgba(255,255,255,0.03)',
                border: '1.5px dashed rgba(192,150,60,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, color: 'var(--text-muted)', fontSize: 13,
              }}>Фото не выбрано</div>
            )}
            <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgFileChange} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} disabled={bgLoading} onClick={() => bgFileRef.current?.click()}>
                <Camera size={16} /> {bgLoading ? 'Загрузка...' : '📷 Выбрать из галереи'}
              </button>
              {globalBg && (
                <button className="btn btn-danger btn-sm" style={{ width: 48, padding: 0 }} onClick={removeGlobalBg}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {globalBg && (
              <button className="btn btn-primary" disabled={bgSaving} onClick={saveGlobalBg}>
                {bgSaved ? '✅ Сохранено для всех!' : bgSaving ? 'Сохраняем...' : '💾 Применить для всех учеников'}
              </button>
            )}
          </div>
        )}


        {/* ── Lazy broadcast panel ─────────────────────────────── */}
        {panel === 'lazy_broadcast' && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <p className="title-card" style={{ marginBottom: 4 }}>
              😴 Рассылка лентяям
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Ученики, которые ещё не выучили ни одного слова
            </p>

            {!lazyLoaded ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</p>
            ) : lazyStudents.length === 0 ? (
              <p style={{ color: 'var(--accent-teal)', fontSize: 13 }}>🎉 Лентяев нет! Все учатся.</p>
            ) : (
              <>
                {/* Checkboxes to exclude */}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Снимите галочку, чтобы исключить:
                </p>
                <div style={{ marginBottom: 14 }}>
                  {lazyStudents.map(s => (
                    <label key={s.user_id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 8, cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={!lazyExcluded.has(s.user_id)}
                        onChange={() => setLazyExcluded(prev => {
                          const next = new Set(prev);
                          if (next.has(s.user_id)) next.delete(s.user_id); else next.add(s.user_id);
                          return next;
                        })}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{
                        flex: 1, fontSize: 13,
                        color: lazyExcluded.has(s.user_id) ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: lazyExcluded.has(s.user_id) ? 'line-through' : 'none',
                      }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.lang.toUpperCase()}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  className="input-field"
                  placeholder="Сообщение для лентяев..."
                  value={lazyBcastMsg}
                  onChange={e => setLazyBcastMsg(e.target.value)}
                  style={{ marginBottom: 10, minHeight: 80, fontSize: 13 }}
                />

                <button
                  className="btn btn-gold"
                  disabled={lazyBcasting || !lazyBcastMsg.trim() || lazyStudents.length === lazyExcluded.size}
                  onClick={sendLazyBroadcast}
                  style={{ width: '100%' }}
                >
                  {lazyBcasting
                    ? 'Отправка...'
                    : `📢 Отправить (${lazyStudents.length - lazyExcluded.size})`}
                </button>

                {lazyBcastResult && (
                  <p style={{ fontSize: 13, marginTop: 10, color: 'var(--accent-teal)' }}>
                    {lazyBcastResult}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Students list (management only) ───────────────────── */}
        <div className="glass-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} color="var(--accent-gold)" />
            <p className="title-card" style={{ flex: 1, margin: 0 }}>🏆 Список учеников</p>
            <button
              onClick={() => showAllStudents ? setShowAllStudents(false) : loadAllStudents()}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--accent-teal)',
                background: 'rgba(45,212,160,0.1)', border: '1px solid rgba(192,150,60,0.25)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
              }}
            >
              {showAllStudents ? '▲ Свернуть' : `Все (${stats?.total_students ?? '…'})`}
            </button>
          </div>

          {studentsToShow.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Пока нет учеников</p>
          ) : (
            studentsToShow.map((s, i) => {
              const isExpanded = expandedStudent === s.user_id;
              const isDone = resetDone.has(s.user_id);
              const msgSent = studentMsgSent.has(s.user_id);
              const showMsg = showMsgFor === s.user_id;

              return (
                <div key={s.user_id}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />}

                  {/* Main row — tap to expand */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}
                    onClick={() => {
                      setExpandedStudent(isExpanded ? null : s.user_id);
                      setShowMsgFor(null);
                      setConfirmReset(null);
                    }}
                  >
                    {/* Medal / rank */}
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
                      {rankMedal(i)}
                    </span>
                    <span style={{ flex: 1, fontWeight: 500, fontSize: 13, color: isDone ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      {s.name}
                      {isDone && <span style={{ fontSize: 10, color: 'var(--danger)', marginLeft: 6 }}>✓ сброшен</span>}
                    </span>
                    <span style={{ fontSize: 11, color: isExpanded ? 'var(--accent-teal)' : 'var(--text-muted)', marginLeft: 2 }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </div>

                  {/* Expanded management row */}
                  {isExpanded && (
                    <div style={{
                      marginTop: 8, padding: '12px', background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12, border: '1px solid rgba(192,150,60,0.12)',
                    }}>
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-gold)' }}>
                          📚 {s.learned} слов
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {s.current_book === 1 ? '📗' : s.current_book === 2 ? '📘' : '📕'} Кн.{s.current_book}, Ур.{s.current_lesson}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--accent-teal)' }}>
                          ⏱ {formatAppTime(s.total_app_time ?? 0)}
                        </span>
                      </div>
                      {/* Action buttons — только 2 */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={`btn btn-ghost btn-sm ${showMsg ? 'btn-primary' : ''}`}
                          style={{ flex: 1, fontSize: 12 }}
                          onClick={e => {
                            e.stopPropagation();
                            setShowMsgFor(showMsg ? null : s.user_id);
                            setShowSettingsFor(null);
                            setConfirmReset(null);
                          }}
                        >
                          {msgSent ? '✅ Отправлено' : '✉️ Написать'}
                        </button>
                        <button
                          className={`btn btn-ghost btn-sm ${showSettingsFor === s.user_id ? 'btn-primary' : ''}`}
                          style={{ flex: 1, fontSize: 12, gap: 5 }}
                          onClick={e => {
                            e.stopPropagation();
                            setShowSettingsFor(showSettingsFor === s.user_id ? null : s.user_id);
                            setShowMsgFor(null);
                            setConfirmReset(null);
                          }}
                        >
                          <Settings2 size={13} /> Настройки
                        </button>
                      </div>

                      {/* Inline message */}
                      {showMsg && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <textarea
                            className="input-field"
                            placeholder="Введите сообщение..."
                            value={studentMsgDraft[s.user_id] ?? ''}
                            onChange={ev => setStudentMsgDraft(p => ({ ...p, [s.user_id]: ev.target.value }))}
                            style={{ flex: 1, minHeight: 56, fontSize: 12 }}
                            onClick={e => e.stopPropagation()}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ width: 42, padding: 0 }}
                            disabled={studentMsgSending === s.user_id}
                            onClick={e => { e.stopPropagation(); sendStudentMsg(s.user_id); }}
                          >
                            {studentMsgSending === s.user_id ? '...' : <Send size={15} />}
                          </button>
                        </div>
                      )}

                      {/* ⚙️ Настройки ученика */}
                      {showSettingsFor === s.user_id && (
                        <div
                          style={{ marginTop: 10, padding: '12px', background: 'rgba(192,150,60,0.06)', borderRadius: 12, border: '1px solid rgba(192,150,60,0.18)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 12 }}>
                            ⚙️ Настройки ученика
                          </p>

                          {/* Повысить рейтинг */}
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <TrendingUp size={12} /> Повысить рейтинг
                            </p>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 12, gap: 5, width: '100%' }}
                              disabled={boostBusy}
                              onClick={() => doBoostRank(s.user_id)}
                            >
                              <TrendingUp size={13} />
                              {boostDone.has(s.user_id) ? '✅ Рейтинг повышен!' : boostBusy ? '...' : '📈 Повысить'}
                            </button>
                          </div>

                          {/* Открыть книгу */}
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <BookOpen size={12} /> Открыть книгу
                              {setBookDoneFor[s.user_id] && (
                                <span style={{ color: 'var(--accent-teal)', marginLeft: 4 }}>
                                  ✅ Книга {setBookDoneFor[s.user_id]} открыта
                                </span>
                              )}
                            </p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {[1, 2, 3].map(bk => (
                                <button
                                  key={bk}
                                  className={`btn btn-sm ${s.current_book === bk ? 'btn-primary' : 'btn-ghost'}`}
                                  style={{ fontSize: 12, flex: 1 }}
                                  disabled={setBookBusy}
                                  onClick={() => doSetBook(s.user_id, bk)}
                                >
                                  {bk === 1 ? '📗' : bk === 2 ? '📘' : '📕'} Кн.{bk}
                                </button>
                              ))}
                              {/* Сарф и Нахв — скоро */}
                              {['Сарф', 'Нахв'].map(name => (
                                <button
                                  key={name}
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: 11, flex: 1, opacity: 0.4, cursor: 'default' }}
                                  disabled
                                >
                                  📖 {name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Сбросить прогресс */}
                          <div style={{ borderTop: '1px solid rgba(224,85,85,0.2)', paddingTop: 10 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                              ⚠️ Сбросить прогресс
                            </p>
                            {confirmReset !== s.user_id ? (
                              <button
                                className="btn btn-danger btn-sm"
                                style={{ width: '100%', fontSize: 12 }}
                                onClick={() => setConfirmReset(s.user_id)}
                              >
                                <RotateCcw size={12} /> Сбросить
                              </button>
                            ) : (
                              <div style={{ padding: '8px 10px', background: 'rgba(224,85,85,0.10)', borderRadius: 8 }}>
                                <p style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8 }}>
                                  Сбросить весь прогресс {s.name}? Нельзя отменить.
                                </p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                                    onClick={() => setConfirmReset(null)}>
                                    Отмена
                                  </button>
                                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                                    disabled={resetBusy}
                                    onClick={() => doResetStudent(s.user_id)}>
                                    {resetBusy ? '...' : <><RefreshCw size={11} /> Сбросить</>}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Lazy students ─────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 12 }}>
          <button
            onClick={loadLazy}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>😴</span>
            <p className="title-card" style={{ flex: 1, margin: 0, color: '#fff' }}>
              Лентяи
              {lazyLoaded && (
                <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({lazyStudents.length})
                </span>
              )}
            </p>
            {showLazy ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </button>

          {showLazy && (
            <div style={{ marginTop: 12 }}>
              {lazyStudents.length === 0 ? (
                <p style={{ color: 'var(--accent-teal)', fontSize: 13 }}>🎉 Лентяев нет! Все учатся.</p>
              ) : (
                <>
                  {lazyStudents.map((s, i) => {
                    const isExpanded = lazyMsgFor === s.user_id;
                    const sent = lazyMsgSent.has(s.user_id);
                    return (
                      <div key={s.user_id}>
                        {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 20, textAlign: 'center' }}>
                            {i + 1}.😴
                          </span>
                          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-main)' }}>{s.name}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>🌐 {s.lang.toUpperCase()}</span>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => setLazyMsgFor(isExpanded ? null : s.user_id)}
                          >
                            {sent ? '✅' : '✉️'}
                          </button>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <textarea
                              className="input-field"
                              placeholder="Напишите ленивому ученику..."
                              value={lazyMsgDraft[s.user_id] ?? ''}
                              onChange={e => setLazyMsgDraft(p => ({ ...p, [s.user_id]: e.target.value }))}
                              style={{ flex: 1, minHeight: 56, fontSize: 12 }}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ width: 42, padding: 0 }}
                              disabled={lazyMsgSending === s.user_id}
                              onClick={() => sendStudentMsg(s.user_id, true)}
                            >
                              {lazyMsgSending === s.user_id ? '...' : <Send size={15} />}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── Lazy broadcast section ── */}
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <button
                      onClick={() => setShowLazyBroadcast(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10,
                      }}
                    >
                      <Megaphone size={14} color="var(--accent-gold)" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-gold)', flex: 1, textAlign: 'left' }}>
                        Рассылка лентяям
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{showLazyBroadcast ? '▲' : '▾'}</span>
                    </button>

                    {showLazyBroadcast && (
                      <>
                        {/* Checkboxes to exclude */}
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                          Снимите галочку, чтобы исключить ученика:
                        </p>
                        {lazyStudents.map(s => (
                          <label key={s.user_id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            marginBottom: 6, cursor: 'pointer',
                          }}>
                            <input
                              type="checkbox"
                              checked={!lazyExcluded.has(s.user_id)}
                              onChange={() => setLazyExcluded(prev => {
                                const next = new Set(prev);
                                if (next.has(s.user_id)) next.delete(s.user_id); else next.add(s.user_id);
                                return next;
                              })}
                              style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 13, color: lazyExcluded.has(s.user_id) ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {s.name}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.lang.toUpperCase()}</span>
                          </label>
                        ))}
                        <textarea
                          className="input-field"
                          placeholder="Сообщение для лентяев..."
                          value={lazyBcastMsg}
                          onChange={e => setLazyBcastMsg(e.target.value)}
                          style={{ marginTop: 10, marginBottom: 10, minHeight: 70, fontSize: 13 }}
                        />
                        <button
                          className="btn btn-gold"
                          disabled={lazyBcasting || !lazyBcastMsg.trim()}
                          onClick={sendLazyBroadcast}
                        >
                          {lazyBcasting
                            ? 'Отправка...'
                            : `📢 Отправить (${lazyStudents.length - lazyExcluded.size})`}
                        </button>
                        {lazyBcastResult && (
                          <p style={{ fontSize: 13, marginTop: 8, color: 'var(--accent-teal)' }}>
                            {lazyBcastResult}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <TeacherNav tab={tab} setTab={setTab} unanswered={stats?.unanswered_questions ?? 0} />
    </div>
  );
}

// ── Активность: дата-хелперы ──────────────────────────────────────
const RU_MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const RU_MON_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDay(d: Date): string { return `${d.getDate()} ${RU_MON[d.getMonth()]}`; }
function mKey(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function mLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${RU_MON_FULL[m - 1]} ${y}`;
}

// Период фильтра — как в статистике ZAAD (today / week / month)
type Period = 'day' | 'week' | 'month';
const PERIOD_LABEL: Record<Period, string> = { day: 'сегодня', week: 'за неделю', month: 'за месяц' };

function inPeriod(d: Date, period: Period, now: Date): boolean {
  if (period === 'day') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }
  if (period === 'week') {
    return d.getTime() >= now.getTime() - 7 * 864e5;
  }
  // month — текущий календарный месяц
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Активность: счётчики + диаграмма регистраций по месяцам + история по датам
function ActivitySection({ students }: { students: AllStudent[] }) {
  const [period, setPeriod] = useState<Period>('month'); // по умолчанию месяц (как в ZAAD)
  const now = new Date();
  const weekAgoStr = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);

  // новые ученики за выбранный период
  const newOnes = students
    .map(s => ({ s, d: parseDate(s.created_at) }))
    .filter(x => x.d !== null && inPeriod(x.d, period, now))
    .sort((a, b) => b.d!.getTime() - a.d!.getTime());

  // активные за выбранный период (по last_activity)
  const activeInPeriod = students.filter(s => {
    const d = parseDate(s.last_activity);
    return d !== null && inPeriod(d, period, now);
  }).length;

  const byMonth = new Map<string, AllStudent[]>();
  for (const s of students) {
    const d = parseDate(s.created_at);
    if (!d) continue;
    const k = mKey(d);
    const arr = byMonth.get(k);
    if (arr) arr.push(s); else byMonth.set(k, [s]);
  }
  const monthsAsc = [...byMonth.keys()].sort();
  const monthsDesc = [...monthsAsc].reverse();
  const maxCount = Math.max(1, ...monthsAsc.map(k => byMonth.get(k)!.length));
  const chartMonths = monthsAsc.slice(-8);

  const [openMonth, setOpenMonth] = useState<string | null>(monthsDesc[0] ?? null);

  return (
    <div className="glass-card" style={{ marginBottom: 16 }}>
      {/* ── фильтр периода (как в статистике ZAAD) ── */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }}>
        {(([['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц']]) as [Period, string][]).map(([p, label]) => {
          const sel = period === p;
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: sel ? 'var(--accent)' : 'transparent',
                color: sel ? 'var(--on-accent)' : 'var(--text-muted)',
                fontWeight: sel ? 700 : 500, fontSize: 13, transition: 'all .15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── новых / активных за период ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: 12, borderRadius: 12, background: 'var(--accent-tint)' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-gold)' }}>{newOnes.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🆕 новых {PERIOD_LABEL[period]}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: 12, borderRadius: 12, background: 'var(--accent-tint)' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-teal)' }}>{activeInPeriod}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>✅ активных {PERIOD_LABEL[period]}</div>
        </div>
      </div>

      {/* список новых учеников за период */}
      {newOnes.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0 16px' }}>
          Новых учеников {PERIOD_LABEL[period]} нет
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {newOnes.map(({ s, d }) => (
            <div key={s.user_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-main)' }}>{s.name}</span>
              <span style={{ color: 'var(--accent-teal)' }}>{d ? fmtDay(d) : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* диаграмма: регистрации по месяцам */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📈 Регистрации по месяцам</div>
      {chartMonths.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Пока нет данных</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 124, marginBottom: 18 }}>
          {chartMonths.map(k => {
            const c = byMonth.get(k)!.length;
            const h = Math.round((c / maxCount) * 90) + 6;
            const [y, m] = k.split('-').map(Number);
            return (
              <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-gold)' }}>{c}</div>
                <div style={{ width: '72%', height: h, borderRadius: 6, background: 'linear-gradient(180deg, var(--accent-gold2), var(--accent-gold))' }} />
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{RU_MON[m - 1]}</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)', opacity: 0.6 }}>'{String(y).slice(2)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* история: кто когда пришёл (по месяцам → датам) */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📅 Кто когда зашёл</div>
      {monthsDesc.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет данных о регистрациях</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {monthsDesc.map(k => {
            const list = [...byMonth.get(k)!].sort((a, b) =>
              (parseDate(b.created_at)?.getTime() ?? 0) - (parseDate(a.created_at)?.getTime() ?? 0));
            const isOpen = openMonth === k;
            return (
              <div key={k} style={{ borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setOpenMonth(isOpen ? null : k)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
                >
                  <span style={{ fontWeight: 600, flex: 1, textAlign: 'left' }}>{mLabel(k)}</span>
                  <span style={{ fontSize: 12, color: 'var(--accent-gold)' }}>{list.length}</span>
                  <span style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 12px 10px' }}>
                    {list.map(s => {
                      const d = parseDate(s.created_at);
                      const recent = s.last_activity != null && s.last_activity >= weekAgoStr;
                      return (
                        <div key={s.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-main)' }}>{s.name}</span>
                          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {s.last_activity && (
                              <span style={{ fontSize: 10, color: recent ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
                                {recent ? '● активен' : `был ${s.last_activity}`}
                              </span>
                            )}
                            <span style={{ color: 'var(--accent-teal)' }}>{d ? fmtDay(d) : '—'}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function ActionBtn({ icon, label, badge, active, onClick, color, wide }: {
  icon: React.ReactNode; label: string; badge?: number;
  active: boolean; onClick: () => void; color: string; wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', width: '100%',
        background: active ? 'rgba(192,150,60,0.12)' : 'rgba(13,14,24,0.65)',
        border: `1.5px solid ${active ? 'rgba(192,150,60,0.40)' : 'rgba(45,212,160,0.2)'}`,
        borderRadius: 16,
        padding: wide ? '12px 16px' : '14px 12px',
        display: 'flex',
        flexDirection: wide ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: wide ? 'center' : undefined,
        gap: wide ? 10 : 6,
        cursor: 'pointer', transition: 'all 150ms', color,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'var(--accent-tint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.3 }}>
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
      {!wide && (
        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: -2 }}>
          {active ? '▲' : '▾'}
        </span>
      )}
    </button>
  );
}

function TeacherNav({ tab, setTab, unanswered }: {
  tab: TeacherTab; setTab: (t: TeacherTab) => void; unanswered: number;
}) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav__item${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>
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

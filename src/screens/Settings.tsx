import { useState, useEffect, useRef } from 'react';
import { Globe2, Bell, BellOff, Type, ImageIcon, Camera, Trash2, CheckCircle2 } from 'lucide-react';
import { t, LANGS } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import { resizeImageToDataUrl } from '../utils/imageResize';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onBgChange?: (url: string) => void;
}

// ── CSS variable helpers ───────────────────────────────────────────
function getCssVar(name: string, fallback: number): number {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseInt(val);
    return isNaN(n) ? fallback : n;
  } catch { return fallback; }
}
function setCssVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

// ── Color presets ─────────────────────────────────────────────────
const COLOR_PRESETS = [
  { id: 'white',  label: 'Белый',      hex: '#FFFFFF' },
  { id: 'yellow', label: 'Жёлтый',     hex: '#FFD700' },
  { id: 'red',    label: 'Красный',    hex: '#E05555' },
  { id: 'black',  label: 'Чёрный',     hex: '#111118' },
  { id: 'green',  label: 'Св.зелёный', hex: '#7AAF8A' },
];

// ── Auto-detect user timezone ─────────────────────────────────────
function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
}

// ── Color swatches ────────────────────────────────────────────────
function ColorSwatches({ current, onChange }: { current: string; onChange: (hex: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {COLOR_PRESETS.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.hex)}
          title={c.label}
          style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: c.hex,
            border: current.toUpperCase() === c.hex.toUpperCase()
              ? '2.5px solid var(--accent-teal)'
              : '2px solid rgba(255,255,255,0.18)',
            cursor: 'pointer',
            boxShadow: current.toUpperCase() === c.hex.toUpperCase()
              ? '0 0 8px rgba(45,212,160,0.7)'
              : '0 1px 4px rgba(0,0,0,0.5)',
            transform: current.toUpperCase() === c.hex.toUpperCase() ? 'scale(1.18)' : 'scale(1)',
            transition: 'all 150ms',
            outline: c.hex === '#111118' ? '1px solid rgba(255,255,255,0.15)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Main Settings component ───────────────────────────────────────
export default function Settings({ lang, onLangChange, onBgChange }: Props) {

  // Font sizes
  const [arabicSize, setArabicSize] = useState<number>(() => {
    const s = localStorage.getItem('ap_arabic_size');
    return s ? parseInt(s) : getCssVar('--font-arabic-size', 22);
  });
  const [transSize, setTransSize] = useState<number>(() => {
    const s = localStorage.getItem('ap_trans_size');
    return s ? parseInt(s) : getCssVar('--font-trans-size', 15);
  });
  const [translationSize, setTranslationSize] = useState<number>(() => {
    const s = localStorage.getItem('ap_translation_size');
    return s ? parseInt(s) : getCssVar('--translation-size', 13);
  });

  // Text colors
  const [arabicColor, setArabicColor] = useState<string>(
    () => localStorage.getItem('ap_arabic_color') ?? '#FFFFFF'
  );
  const [transColor, setTransColor] = useState<string>(
    () => localStorage.getItem('ap_trans_color') ?? '#C8D8D2'
  );
  const [translationColor, setTranslationColor] = useState<string>(
    () => localStorage.getItem('ap_translation_color') ?? '#FFFFFF'
  );

  // Text style toggles
  const [arabicBold, setArabicBold] = useState<boolean>(
    () => localStorage.getItem('ap_arabic_weight') === '700'
  );
  const [arabicItalic, setArabicItalic] = useState<boolean>(
    () => localStorage.getItem('ap_arabic_style') === 'italic'
  );
  const [transItalic, setTransItalic] = useState<boolean>(
    () => (localStorage.getItem('ap_trans_style') ?? 'italic') === 'italic'
  );

  // ── Notification / reminder ───────────────────────────────────────
  const detectedTz = detectTimezone();
  const [reminderTime, setReminderTime] = useState<string>('');       // "HH:MM" or ''
  const [reminderTz]  = useState<string>(detectedTz);                  // auto-detected, read-only
  const [reminderSaved, setReminderSaved] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  // Load existing reminder from server on mount
  useEffect(() => {
    api.getReminder().then(r => {
      if (r.reminder_time) {
        setReminderTime(r.reminder_time);
        setReminderEnabled(true);
      }
    }).catch(() => {});
  }, []);

  // Background
  const [activeBg, setActiveBg] = useState<string>(
    () => localStorage.getItem('ap_bg_url') ?? ''
  );
  const [bgLoading, setBgLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Live CSS var effects ──────────────────────────────────────
  useEffect(() => {
    setCssVar('--font-arabic-size', `${arabicSize}px`);
    localStorage.setItem('ap_arabic_size', String(arabicSize));
  }, [arabicSize]);

  useEffect(() => {
    setCssVar('--font-trans-size', `${transSize}px`);
    localStorage.setItem('ap_trans_size', String(transSize));
  }, [transSize]);

  useEffect(() => {
    setCssVar('--translation-size', `${translationSize}px`);
    localStorage.setItem('ap_translation_size', String(translationSize));
  }, [translationSize]);

  useEffect(() => {
    setCssVar('--arabic-color', arabicColor);
    localStorage.setItem('ap_arabic_color', arabicColor);
  }, [arabicColor]);

  useEffect(() => {
    setCssVar('--trans-color', transColor);
    localStorage.setItem('ap_trans_color', transColor);
  }, [transColor]);

  useEffect(() => {
    setCssVar('--translation-color', translationColor);
    localStorage.setItem('ap_translation_color', translationColor);
  }, [translationColor]);

  useEffect(() => {
    const w = arabicBold ? '700' : '400';
    setCssVar('--arabic-weight', w);
    localStorage.setItem('ap_arabic_weight', w);
  }, [arabicBold]);

  useEffect(() => {
    const s = arabicItalic ? 'italic' : 'normal';
    setCssVar('--arabic-style', s);
    localStorage.setItem('ap_arabic_style', s);
  }, [arabicItalic]);

  useEffect(() => {
    const s = transItalic ? 'italic' : 'normal';
    setCssVar('--trans-style', s);
    localStorage.setItem('ap_trans_style', s);
  }, [transItalic]);

  // ── Handlers ─────────────────────────────────────────────────
  async function handleLangChange(newLang: Lang) {
    onLangChange(newLang);
    try { await api.setLang(newLang); } catch {}
  }

  async function handleSaveReminder() {
    if (!reminderTime) return;
    setReminderLoading(true);
    setReminderSaved(false);
    try {
      // Request Telegram write access so bot can send messages when app is closed
      await new Promise<void>(resolve => {
        const tg = window.Telegram?.WebApp;
        if (tg?.requestWriteAccess) {
          tg.requestWriteAccess(() => resolve());
        } else {
          resolve();
        }
      });
      await api.setReminder(reminderTime, reminderTz);
      setReminderEnabled(true);
      setReminderSaved(true);
      setTimeout(() => setReminderSaved(false), 3000);
    } catch {
      alert('Ошибка сохранения. Попробуйте ещё раз.');
    } finally {
      setReminderLoading(false);
    }
  }

  async function handleDisableReminder() {
    setReminderLoading(true);
    try {
      await api.setReminder(null, reminderTz);
      setReminderEnabled(false);
      setReminderTime('');
    } catch {
      alert('Ошибка. Попробуйте ещё раз.');
    } finally {
      setReminderLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 1080, 0.72);
      setActiveBg(dataUrl);
      if (onBgChange) onBgChange(dataUrl);
    } catch {
      alert('Не удалось загрузить фото');
    } finally {
      setBgLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeBg() {
    setActiveBg('');
    if (onBgChange) onBgChange('');
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="screen-enter page-content" style={{ paddingTop: 24 }}>
      <h1 className="title-screen" style={{ marginBottom: 24 }}>{t(lang, 'settings_title')}</h1>

      {/* ── Language ──────────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Globe2 size={18} color="var(--accent-teal)" />
          <span className="title-card">{t(lang, 'setting_lang')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LANGS.map(({ code, flag, label }) => (
            <button
              key={code}
              className={`btn ${lang === code ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 42, fontSize: 13 }}
              onClick={() => handleLangChange(code)}
            >
              {flag} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Daily reminder ────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {reminderEnabled
            ? <Bell size={18} color="var(--accent-teal)" />
            : <BellOff size={18} color="var(--text-muted)" />}
          <span className="title-card">Ежедневное напоминание</span>
          {reminderEnabled && (
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              background: 'rgba(45,212,160,0.15)', color: 'var(--accent-teal)',
              padding: '2px 8px', borderRadius: 20,
            }}>ВКЛ</span>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Бот пришлёт мотивационное сообщение каждый день в выбранное время — напоминание об арабском
        </p>

        {/* Timezone — auto-detected */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10,
          background: 'rgba(45,212,160,0.08)',
          border: '1px solid rgba(45,212,160,0.2)',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 13 }}>🌍</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ваш часовой пояс (определён автоматически)</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-teal)' }}>{reminderTz}</div>
          </div>
        </div>

        {/* Time picker */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            Время напоминания
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            className="input-field"
            style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', height: 56 }}
          />
        </div>

        {/* Save button */}
        <button
          className="btn btn-primary"
          style={{ marginBottom: reminderEnabled ? 10 : 0 }}
          disabled={!reminderTime || reminderLoading}
          onClick={handleSaveReminder}
        >
          {reminderLoading ? '⏳ Сохранение...' : reminderSaved
            ? <><CheckCircle2 size={16} /> Сохранено!</>
            : '💾 Сохранить напоминание'}
        </button>

        {/* Disable button — only if currently enabled */}
        {reminderEnabled && (
          <button
            className="btn btn-danger"
            style={{ height: 40, fontSize: 13 }}
            disabled={reminderLoading}
            onClick={handleDisableReminder}
          >
            <BellOff size={14} /> Отключить напоминания
          </button>
        )}
      </div>

      {/* ── Font + Colors ─────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Type size={18} color="var(--accent-teal)" />
          <span className="title-card">Шрифт и цвета</span>
        </div>

        {/* ─ Arabic ─ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Арабский текст</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{arabicSize}px</span>
          </div>
          <input type="range" min={16} max={36} step={1} value={arabicSize} onChange={e => setArabicSize(Number(e.target.value))} />
          <div className="text-arabic" style={{
            marginTop: 10, textAlign: 'center', fontSize: `${arabicSize}px`,
            color: arabicColor, fontWeight: arabicBold ? 700 : 400, fontStyle: arabicItalic ? 'italic' : 'normal',
          }}>
            بِسْمِ اللَّهِ
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Цвет арабского текста</span>
          <ColorSwatches current={arabicColor} onChange={setArabicColor} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={arabicBold ? 'btn btn-primary' : 'btn btn-ghost'} style={{ height: 36, fontWeight: 900 }} onClick={() => setArabicBold(!arabicBold)}>Ж Жирный</button>
          <button className={arabicItalic ? 'btn btn-primary' : 'btn btn-ghost'} style={{ height: 36, fontStyle: 'italic' }} onClick={() => setArabicItalic(!arabicItalic)}>К Курсив</button>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

        {/* ─ Transcription ─ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Транскрипция</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{transSize}px</span>
          </div>
          <input type="range" min={11} max={22} step={1} value={transSize} onChange={e => setTransSize(Number(e.target.value))} />
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: `${transSize}px`, color: transColor, fontStyle: transItalic ? 'italic' : 'normal' }}>
            Bismillāhi r-raḥmāni r-raḥīm
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Цвет транскрипции</span>
          <ColorSwatches current={transColor} onChange={setTransColor} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <button className={transItalic ? 'btn btn-primary' : 'btn btn-ghost'} style={{ height: 36, fontStyle: 'italic', width: 'auto', padding: '0 20px' }} onClick={() => setTransItalic(!transItalic)}>К Курсив</button>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

        {/* ─ Translation ─ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Перевод</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{translationSize}px</span>
          </div>
          <input type="range" min={11} max={20} step={1} value={translationSize} onChange={e => setTranslationSize(Number(e.target.value))} />
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: `${translationSize}px`, color: translationColor }}>
            Во имя Аллаха, Милостивого, Милосердного
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Цвет перевода</span>
            <ColorSwatches current={translationColor} onChange={setTranslationColor} />
          </div>
        </div>
      </div>

      {/* ── Background photo ──────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ImageIcon size={18} color="var(--accent-teal)" />
          <span className="title-card">Мой фон</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: 'rgba(45,212,160,0.15)', color: 'var(--accent-teal)', padding: '2px 8px', borderRadius: 20 }}>Только для вас</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Фон виден только вам на вашем устройстве
        </p>
        {activeBg ? (
          <div style={{ width: '100%', height: 120, borderRadius: 14, backgroundImage: `url(${activeBg})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 12, position: 'relative', border: '1.5px solid rgba(45,212,160,0.3)' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>✅ Фон установлен</span>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(45,212,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>
            Фон не выбран
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={bgLoading} onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
            {bgLoading ? 'Загрузка...' : '📷 Выбрать из галереи'}
          </button>
          {activeBg && (
            <button className="btn btn-danger btn-sm" style={{ width: 48, padding: 0 }} onClick={removeBg}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <button className="btn btn-ghost">{t(lang, 'support')}</button>
    </div>
  );
}

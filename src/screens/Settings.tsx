import { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Type, ImageIcon, Camera, Trash2, CheckCircle2 } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import { resizeImageToDataUrl } from '../utils/imageResize';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onBgChange?: (url: string) => void;
}

// â”€â”€ CSS variable helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Color presets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COLOR_PRESETS = [
  { id: 'white',   hex: '#FFFFFF' },
  { id: 'yellow',  hex: '#FFD700' },
  { id: 'teal',    hex: '#C0963C' },
  { id: 'red',     hex: '#E05555' },
  { id: 'muted',   hex: '#A0B8B0' },
];

// â”€â”€ Auto-detect user timezone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
}

// â”€â”€ Color swatches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ColorSwatches({ current, onChange }: { current: string; onChange: (hex: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {COLOR_PRESETS.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.hex)}
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: c.hex,
            border: current.toUpperCase() === c.hex.toUpperCase()
              ? '2.5px solid var(--accent-teal)'
              : '2px solid rgba(255,255,255,0.18)',
            cursor: 'pointer',
            boxShadow: current.toUpperCase() === c.hex.toUpperCase()
              ? '0 0 8px rgba(192,150,60,0.6)'
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

// â”€â”€ Style toggle buttons (bold / italic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StyleToggle({ label, active, onClick, weight, italic }: {
  label: string; active: boolean; onClick: () => void;
  weight?: number; italic?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 30, padding: '0 14px',
        borderRadius: 8, cursor: 'pointer',
        fontSize: 13,
        fontWeight: weight ?? (active ? 700 : 400),
        fontStyle: italic ? 'italic' : 'normal',
        background: active
          ? 'rgba(192,150,60,0.15)'
          : 'rgba(255,255,255,0.06)',
        color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
        border: active
          ? '1px solid rgba(192,150,60,0.35)'
          : '1px solid rgba(255,255,255,0.1)',
        transition: 'all 150ms',
        letterSpacing: 0.2,
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// â”€â”€ Main Settings component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Notification / reminder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const detectedTz = detectTimezone();
  const [reminderTime, setReminderTime] = useState<string>('');
  const [reminderTz]  = useState<string>(detectedTz);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

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

  // â”€â”€ Live CSS var effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleLangChange(newLang: Lang) {
    onLangChange(newLang);
    try { await api.setLang(newLang); } catch {}
  }

  async function handleSaveReminder() {
    if (!reminderTime) return;
    setReminderLoading(true);
    setReminderSaved(false);
    try {
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
      alert(t(lang, 'error_generic'));
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
      alert(t(lang, 'error_generic'));
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
      alert(t(lang, 'error_generic'));
    } finally {
      setBgLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeBg() {
    setActiveBg('');
    if (onBgChange) onBgChange('');
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="screen-enter page-content" style={{ paddingTop: 24 }}>
      <h1 className="title-screen" style={{ marginBottom: 24 }}>{t(lang, 'settings_title')}</h1>

      {/* â”€â”€ Language â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="title-card">{t(lang, 'setting_lang')}</span>
          <LanguageSwitcher current={lang} onChange={handleLangChange} />
        </div>
      </div>

      {/* â”€â”€ Daily reminder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {reminderEnabled
            ? <Bell size={18} color="var(--accent-teal)" />
            : <BellOff size={18} color="var(--text-muted)" />}
          <span className="title-card">{t(lang, 'notif_daily')}</span>
          {reminderEnabled && (
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              background: 'rgba(192,150,60,0.12)', color: 'var(--accent-teal)',
              padding: '2px 8px', borderRadius: 20,
            }}>{t(lang, 'notif_on')}</span>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          {t(lang, 'notif_desc')}
        </p>

        {/* Timezone â€” auto-detected */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(192,150,60,0.15)',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 13 }}>ðŸŒ</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t(lang, 'notif_tz_label')}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-teal)' }}>{reminderTz}</div>
          </div>
        </div>

        {/* Time picker */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            {t(lang, 'notif_time_label')}
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
          {reminderLoading
            ? `â³ ${t(lang, 'notif_saving')}`
            : reminderSaved
            ? <><CheckCircle2 size={16} /> {t(lang, 'notif_saved_ok')}</>
            : `ðŸ’¾ ${t(lang, 'notif_save_btn')}`}
        </button>

        {reminderEnabled && (
          <button
            className="btn btn-danger"
            style={{ height: 40, fontSize: 13 }}
            disabled={reminderLoading}
            onClick={handleDisableReminder}
          >
            <BellOff size={14} /> {t(lang, 'notif_disable')}
          </button>
        )}
      </div>

      {/* â”€â”€ Font + Colors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Type size={18} color="var(--accent-teal)" />
          <span className="title-card">{t(lang, 'font_colors')}</span>
        </div>

        {/* â”€ Arabic â”€ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t(lang, 'font_arabic_lbl')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{arabicSize}px</span>
          </div>
          <input type="range" min={16} max={36} step={1} value={arabicSize} onChange={e => setArabicSize(Number(e.target.value))} />
          <div className="text-arabic" style={{
            marginTop: 10, textAlign: 'center', fontSize: `${arabicSize}px`,
            color: arabicColor, fontWeight: arabicBold ? 700 : 400, fontStyle: arabicItalic ? 'italic' : 'normal',
          }}>
            Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            ðŸŽ¨ {t(lang, 'font_color_lbl')}
          </span>
          <ColorSwatches current={arabicColor} onChange={setArabicColor} />
        </div>
        {/* Bold / Italic â€” sleek compact toggles */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <StyleToggle
            label={t(lang, 'style_bold')}
            active={arabicBold}
            onClick={() => setArabicBold(!arabicBold)}
            weight={700}
          />
          <StyleToggle
            label={t(lang, 'style_italic')}
            active={arabicItalic}
            onClick={() => setArabicItalic(!arabicItalic)}
            italic
          />
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

        {/* â”€ Transcription â”€ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t(lang, 'font_trans_lbl')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{transSize}px</span>
          </div>
          <input type="range" min={11} max={22} step={1} value={transSize} onChange={e => setTransSize(Number(e.target.value))} />
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: `${transSize}px`, color: transColor, fontStyle: transItalic ? 'italic' : 'normal' }}>
            BismillÄhi r-raá¸¥mÄni r-raá¸¥Ä«m
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            ðŸŽ¨ {t(lang, 'font_color_lbl')}
          </span>
          <ColorSwatches current={transColor} onChange={setTransColor} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <StyleToggle
            label={t(lang, 'style_italic')}
            active={transItalic}
            onClick={() => setTransItalic(!transItalic)}
            italic
          />
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

        {/* â”€ Translation â”€ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t(lang, 'font_translate_lbl')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{translationSize}px</span>
          </div>
          <input type="range" min={11} max={20} step={1} value={translationSize} onChange={e => setTranslationSize(Number(e.target.value))} />
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: `${translationSize}px`, color: translationColor }}>
            {lang === 'en' ? 'In the name of Allah, the Most Gracious' :
             lang === 'uz' ? "Allohning nomi bilan, Mehribon va Rahimli" :
             lang === 'tj' ? 'Ð‘Ð¾ Ð½Ð¾Ð¼Ð¸ ÐÐ»Ð»Ð¾Ò³, Ð‘Ð°Ñ…ÑˆÐ°Ð½Ð´Ð°Ð¸ ÐœÐµÒ³Ñ€ÑƒÐ±Ð¾Ð½' :
             lang === 'ar' ? 'Ø¨Ø³Ù… Ø§Ù„Ù„Ù‡ Ø§Ù„Ø±Ø­Ù…Ù† Ø§Ù„Ø±Ø­ÙŠÙ…' :
             'Ð’Ð¾ Ð¸Ð¼Ñ ÐÐ»Ð»Ð°Ñ…Ð°, ÐœÐ¸Ð»Ð¾ÑÑ‚Ð¸Ð²Ð¾Ð³Ð¾, ÐœÐ¸Ð»Ð¾ÑÐµÑ€Ð´Ð½Ð¾Ð³Ð¾'}
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              ðŸŽ¨ {t(lang, 'font_color_lbl')}
            </span>
            <ColorSwatches current={translationColor} onChange={setTranslationColor} />
          </div>
        </div>
      </div>

      {/* â”€â”€ Background photo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ImageIcon size={18} color="var(--accent-teal)" />
          <span className="title-card">{t(lang, 'bg_title')}</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            background: 'rgba(192,150,60,0.12)', color: 'var(--accent-teal)',
            padding: '2px 8px', borderRadius: 20,
          }}>{t(lang, 'bg_only_you')}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {t(lang, 'bg_desc_text')}
        </p>
        {activeBg ? (
          <div style={{
            width: '100%', height: 120, borderRadius: 14,
            backgroundImage: `url(${activeBg})`, backgroundSize: 'cover', backgroundPosition: 'center',
            marginBottom: 12, position: 'relative', border: '1.5px solid rgba(192,150,60,0.25)',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              background: 'linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {t(lang, 'bg_set_done')}
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            width: '100%', height: 80, borderRadius: 14,
            background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(192,150,60,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, color: 'var(--text-muted)', fontSize: 13,
          }}>
            {t(lang, 'bg_not_set')}
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={bgLoading} onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
            {bgLoading ? t(lang, 'bg_loading') : `ðŸ“· ${t(lang, 'bg_select_btn')}`}
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

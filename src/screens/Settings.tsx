import { useState, useEffect } from 'react';
import { Globe2, Bell, Moon, ChevronRight, Type, ImageIcon } from 'lucide-react';
import { t, LANGS } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onBgChange?: (url: string) => void;
}

// ── Background presets ─────────────────────────────────────────────
const BG_PRESETS = [
  { id: 'none',   label: '⬛ Без фона', url: '' },
  { id: 'kaaba',  label: '🕋 Кааба',   url: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1080&auto=format&fit=crop' },
  { id: 'medina', label: '🕌 Медина',  url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1080&auto=format&fit=crop' },
  { id: 'mosque', label: '🌙 Мечеть',  url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1080&auto=format&fit=crop' },
];

// ── CSS variable helpers ───────────────────────────────────────────
function getCssVar(name: string, fallback: number): number {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseInt(val);
    return isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}

function setCssVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

export default function Settings({ lang, onLangChange, onBgChange }: Props) {
  const [arabicSize, setArabicSize] = useState<number>(() => {
    const stored = localStorage.getItem('ap_arabic_size');
    return stored ? parseInt(stored) : getCssVar('--font-arabic-size', 22);
  });
  const [transSize, setTransSize] = useState<number>(() => {
    const stored = localStorage.getItem('ap_trans_size');
    return stored ? parseInt(stored) : getCssVar('--font-trans-size', 15);
  });
  const [activeBg, setActiveBg] = useState<string>(() =>
    localStorage.getItem('ap_bg_url') ?? ''
  );

  // Apply font size changes live
  useEffect(() => {
    setCssVar('--font-arabic-size', `${arabicSize}px`);
    localStorage.setItem('ap_arabic_size', String(arabicSize));
  }, [arabicSize]);

  useEffect(() => {
    setCssVar('--font-trans-size', `${transSize}px`);
    localStorage.setItem('ap_trans_size', String(transSize));
  }, [transSize]);

  async function handleLangChange(newLang: Lang) {
    onLangChange(newLang);
    try { await api.setLang(newLang); } catch {}
  }

  function handleBgSelect(url: string) {
    setActiveBg(url);
    if (onBgChange) onBgChange(url);
  }

  const activePresetId = BG_PRESETS.find(p => p.url === activeBg)?.id ?? 'none';

  return (
    <div className="screen-enter page-content" style={{ paddingTop: 24 }}>
      <h1 className="title-screen" style={{ marginBottom: 24 }}>{t(lang, 'settings_title')}</h1>

      {/* ── Language ─────────────────────────────────────────── */}
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

      {/* ── Font sizes ───────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Type size={18} color="var(--accent-teal)" />
          <span className="title-card">Размер шрифта</span>
        </div>

        {/* Arabic size */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Арабский текст</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{arabicSize}px</span>
          </div>
          <input
            type="range" min={16} max={36} step={1}
            value={arabicSize}
            onChange={e => setArabicSize(Number(e.target.value))}
          />
          <div
            className="text-arabic"
            style={{ marginTop: 8, textAlign: 'center', color: 'var(--accent-gold)', fontSize: `${arabicSize}px` }}
          >
            بِسْمِ اللَّهِ
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} />

        {/* Translation size */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Перевод / транскрипция</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>{transSize}px</span>
          </div>
          <input
            type="range" min={11} max={22} step={1}
            value={transSize}
            onChange={e => setTransSize(Number(e.target.value))}
          />
          <div
            className="text-trans"
            style={{ marginTop: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: `${transSize}px` }}
          >
            Bismillāhi r-raḥmāni r-raḥīm
          </div>
        </div>
      </div>

      {/* ── Background ───────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <ImageIcon size={18} color="var(--accent-teal)" />
          <span className="title-card">Фон приложения</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {BG_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleBgSelect(preset.url)}
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
                boxShadow: activePresetId === preset.id ? '0 0 0 2px rgba(45,212,160,0.3)' : 'none',
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
      </div>

      {/* ── Other settings ───────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        {[
          { icon: <Bell size={18} />, label: t(lang, 'setting_notif'), right: '—' },
          { icon: <Moon size={18} />, label: t(lang, 'setting_theme'), right: '✓ Dark' },
        ].map((row, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{row.icon}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{row.label}</span>
              <span className="text-muted" style={{ fontSize: 13 }}>{row.right}</span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost">
        {t(lang, 'support')}
      </button>
    </div>
  );
}

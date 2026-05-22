import { useState, useEffect, useRef } from 'react';
import { Globe2, Bell, Moon, ChevronRight, Type, ImageIcon, Camera, Trash2 } from 'lucide-react';
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
  const [bgLoading, setBgLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // reset input so same file can be picked again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeBg() {
    setActiveBg('');
    if (onBgChange) onBgChange('');
  }

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
            style={{ marginTop: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: `${transSize}px` }}
          >
            Bismillāhi r-raḥmāni r-raḥīm
          </div>
        </div>
      </div>

      {/* ── Background photo ─────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ImageIcon size={18} color="var(--accent-teal)" />
          <span className="title-card">Мой фон</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            background: 'rgba(45,212,160,0.15)', color: 'var(--accent-teal)',
            padding: '2px 8px', borderRadius: 20,
          }}>Только для вас</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Фон виден только вам на вашем устройстве
        </p>

        {/* Current background preview */}
        {activeBg ? (
          <div style={{
            width: '100%', height: 120, borderRadius: 14,
            backgroundImage: `url(${activeBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            marginBottom: 12, position: 'relative',
            border: '1.5px solid rgba(45,212,160,0.3)',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              background: 'linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                ✅ Фон установлен
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            width: '100%', height: 80, borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px dashed rgba(45,212,160,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, color: 'var(--text-muted)', fontSize: 13,
          }}>
            Фон не выбран
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={bgLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={16} />
            {bgLoading ? 'Загрузка...' : '📷 Выбрать из галереи'}
          </button>
          {activeBg && (
            <button
              className="btn btn-danger btn-sm"
              style={{ width: 48, padding: 0 }}
              onClick={removeBg}
            >
              <Trash2 size={16} />
            </button>
          )}
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

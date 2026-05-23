import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe2 } from 'lucide-react';
import { LANGS } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  current: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageSwitcher({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Compact trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Change language"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 20,
          background: 'rgba(192,150,60,0.10)',
          border: '1.5px solid rgba(192,150,60,0.30)',
          cursor: 'pointer', color: 'var(--accent-gold)',
        }}
      >
        <Globe2 size={14} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{current.toUpperCase()}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {/* Portal — rendered directly on body to escape backdrop-filter stacking context */}
      {open && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              minWidth: 220, padding: 8, maxHeight: '70vh', overflowY: 'auto',
              background: 'rgba(10, 11, 20, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <Globe2 size={14} color="var(--accent-gold)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Выберите язык</span>
            </div>
            {LANGS.map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => { onChange(code as Lang); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 14px',
                  background: current === code ? 'rgba(192,150,60,0.12)' : 'transparent',
                  border: 'none', borderRadius: 10,
                  color: current === code ? 'var(--accent-gold)' : 'var(--text-main)',
                  fontSize: 14, fontWeight: current === code ? 700 : 400,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 120ms',
                }}
              >
                <span style={{ fontSize: 20 }}>{flag}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {current === code && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--accent-gold)',
                    background: 'rgba(192,150,60,0.12)', borderRadius: 10, padding: '1px 7px',
                  }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

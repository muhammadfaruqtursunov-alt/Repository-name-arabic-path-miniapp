import { useState } from 'react';
import { Globe2 } from 'lucide-react';
import { LANGS } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  current: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageSwitcher({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const cur = LANGS.find(l => l.code === current);

  return (
    <>
      {/* Compact trigger button — shows globe + flag + code */}
      <button
        className="lang-icon-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Change language"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 20,
          background: 'rgba(45,212,160,0.10)',
          border: '1.5px solid rgba(45,212,160,0.3)',
          cursor: 'pointer', color: 'var(--accent-teal)',
        }}
      >
        <Globe2 size={14} />
        <span style={{ fontSize: 15 }}>{cur?.flag}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{current.toUpperCase()}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {/* Backdrop + dropdown */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card"
            style={{ minWidth: 200, padding: 8, maxHeight: '70vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <Globe2 size={14} color="var(--accent-teal)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Выберите язык</span>
            </div>
            {LANGS.map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => { onChange(code as Lang); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 14px',
                  background: current === code ? 'rgba(45,212,160,0.15)' : 'transparent',
                  border: 'none', borderRadius: 10,
                  color: current === code ? 'var(--accent-teal)' : 'var(--text-main)',
                  fontSize: 14, fontWeight: current === code ? 700 : 400,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 120ms',
                }}
              >
                <span style={{ fontSize: 20 }}>{flag}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {current === code && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)',
                    background: 'rgba(45,212,160,0.15)', borderRadius: 10, padding: '1px 7px',
                  }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

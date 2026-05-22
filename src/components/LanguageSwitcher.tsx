import { useState } from 'react';
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
      {/* Compact trigger button */}
      <button className="lang-icon-btn" onClick={() => setOpen(true)}>
        <span>{cur?.flag ?? '🌐'}</span>
        <span>{current.toUpperCase()}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {/* Backdrop + dropdown */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            padding: '56px 16px 0',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card"
            style={{ minWidth: 170, padding: 6 }}
            onClick={e => e.stopPropagation()}
          >
            {LANGS.map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => { onChange(code as Lang); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px',
                  background: current === code ? 'rgba(45,212,160,0.15)' : 'transparent',
                  border: 'none', borderRadius: 10,
                  color: current === code ? 'var(--accent-teal)' : 'var(--text-main)',
                  fontSize: 14, fontWeight: current === code ? 700 : 400,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>{flag}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {current === code && <span style={{ fontSize: 12 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

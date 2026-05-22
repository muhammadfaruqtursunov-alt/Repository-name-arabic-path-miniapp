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

  return (
    <>
      {/* Globe trigger */}
      <button
        className="lang-icon-btn"
        onClick={() => setOpen(true)}
        style={{ padding: '6px 10px' }}
        aria-label="Change language"
      >
        <Globe2 size={17} />
      </button>

      {/* Backdrop + dropdown */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
            padding: '56px 0 0 16px',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card"
            style={{ minWidth: 175, padding: 6 }}
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

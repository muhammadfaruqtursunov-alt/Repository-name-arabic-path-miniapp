import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { t, LANGS } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  onSelect: (lang: Lang) => void;
}

export default function LanguageSelect({ lang, onSelect }: Props) {
  const [selected, setSelected] = useState<Lang>(lang);

  return (
    <div
      className="screen-enter"
      style={{ minHeight: '100dvh', padding: '48px 20px 32px', display: 'flex', flexDirection: 'column' }}
    >
      <h1 className="title-screen" style={{ marginBottom: 32, textAlign: 'center' }}>
        {t(lang, 'choose_lang')}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {LANGS.map(({ code, flag, label }) => {
          const isActive = selected === code;
          return (
            <div
              key={code}
              className="glass-card"
              style={{
                borderColor: isActive ? 'var(--accent-gold)' : 'var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                transition: 'border-color 200ms',
              }}
              onClick={() => setSelected(code)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 18 }}>
                <span style={{ fontSize: 28 }}>{flag}</span>
                <span className="title-card">{label}</span>
              </div>
              {isActive && (
                <CheckCircle2 size={22} color="var(--accent-gold)" />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <button className="btn btn-primary" onClick={() => onSelect(selected)}>
          {t(selected, 'btn_next')}
        </button>
      </div>
    </div>
  );
}

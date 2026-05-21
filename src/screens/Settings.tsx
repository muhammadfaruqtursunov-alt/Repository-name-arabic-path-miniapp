import { Globe2, Bell, Moon, ChevronRight } from 'lucide-react';
import { t, LANGS } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';

interface Props { lang: Lang; onLangChange: (lang: Lang) => void; }

export default function Settings({ lang, onLangChange }: Props) {
  async function handleLangChange(newLang: Lang) {
    onLangChange(newLang);
    try { await api.setLang(newLang); } catch {}
  }

  return (
    <div className="screen-enter page-content" style={{ paddingTop: 24 }}>
      <h1 className="title-screen" style={{ marginBottom: 24 }}>{t(lang, 'settings_title')}</h1>

      {/* Language */}
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

      {/* Other settings */}
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

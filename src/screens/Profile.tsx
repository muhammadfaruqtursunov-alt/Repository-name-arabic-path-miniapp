import { useState } from 'react';
import { Globe2, Layers, TrendingUp, Calendar } from 'lucide-react';
import { t, LANGS } from '../i18n';
import type { Lang } from '../i18n';
import type { UserProfile } from '../api/client';

interface Props {
  lang: Lang;
  user: UserProfile;
  onLangChange: (lang: Lang) => void;
  onResetProgress: () => void;
}

const LANG_FLAGS: Record<string, string> = { ru: '🇷🇺', tj: '🇹🇯', en: '🇬🇧', ar: '🇸🇦', uz: '🇺🇿' };

function getLevel(totalLearned: number, lang: Lang): string {
  if (totalLearned < 70)  return t(lang, 'level_beginner');
  if (totalLearned < 200) return t(lang, 'level_intermediate');
  return t(lang, 'level_advanced');
}

export default function Profile({ lang, user, onLangChange, onResetProgress }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const avatarUrl = tgUser?.photo_url;

  const rows = [
    { icon: <Globe2 size={18} />, label: t(lang, 'lang_label'), value: `${LANG_FLAGS[user.lang] ?? ''} ${user.lang.toUpperCase()}` },
    { icon: <Layers size={18} />, label: t(lang, 'volume_label'), value: `📖 ${t(lang, `book_${user.current_book}` as 'book_1')}` },
    { icon: <TrendingUp size={18} />, label: t(lang, 'level_label'), value: getLevel(user.total_learned, lang) },
    { icon: <Calendar size={18} />, label: t(lang, 'reg_date'), value: '—' },
  ];

  return (
    <div className="screen-enter page-content" style={{ paddingTop: 32 }}>
      {/* Avatar + name */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '2.5px solid var(--accent-gold)',
          overflow: 'hidden', background: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 12px',
        }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
        </div>
        <h1 className="title-screen">{user.name}</h1>
        {tgUser?.username && (
          <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>@{tgUser.username}</p>
        )}
        <div style={{ marginTop: 10 }}>
          <span className="badge badge--teal">{getLevel(user.total_learned, lang)}</span>
        </div>
      </div>

      {/* Info rows */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        {rows.map((row, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{row.icon}</span>
              <span className="text-muted" style={{ flex: 1 }}>{row.label}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Language change */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <p className="title-card" style={{ marginBottom: 12 }}>{t(lang, 'lang_label')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LANGS.map(({ code, flag, label }) => (
            <button
              key={code}
              className={`btn ${lang === code ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 40, fontSize: 13 }}
              onClick={() => onLangChange(code)}
            >
              {flag} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset progress */}
      {!confirmReset ? (
        <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
          {t(lang, 'btn_reset')}
        </button>
      ) : (
        <div className="glass-card" style={{ borderColor: 'rgba(224,85,85,0.3)' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 14, fontSize: 14 }}>{t(lang, 'reset_confirm_msg')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>
              {t(lang, 'cancel')}
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onResetProgress(); setConfirmReset(false); }}>
              {t(lang, 'btn_reset_confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

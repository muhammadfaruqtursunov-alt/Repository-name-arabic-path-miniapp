import { t } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  onStart: () => void;
  onLogin: () => void;
}

export default function Welcome({ lang, onStart, onLogin }: Props) {
  return (
    <div
      className="screen-enter islamic-header"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'linear-gradient(180deg, rgba(13,31,26,0.55) 0%, rgba(13,31,26,0.93) 60%), url(https://images.unsplash.com/photo-1547825407-2d060104b7f8?w=800) center/cover no-repeat',
        textAlign: 'center',
        gap: 0,
      }}
    >
      {/* Islamic geometric ornament */}
      <div style={{ marginBottom: 20 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path
            d="M40 5 L50 20 L65 15 L60 30 L75 40 L60 50 L65 65 L50 60 L40 75 L30 60 L15 65 L20 50 L5 40 L20 30 L15 15 L30 20 Z"
            fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity="0.8"
          />
          <path
            d="M40 18 L46 28 L56 24 L52 34 L62 40 L52 46 L56 56 L46 52 L40 62 L34 52 L24 56 L28 46 L18 40 L28 34 L24 24 L34 28 Z"
            fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.5"
          />
          <circle cx="40" cy="40" r="6" fill="#C9A84C" opacity="0.6" />
        </svg>
      </div>

      {/* Arabic title */}
      <div
        className="text-arabic-lg text-gold"
        style={{ marginBottom: 8, fontSize: 32 }}
      >
        الطريق العربي
      </div>

      <p style={{ color: 'var(--text-main)', fontSize: 16, marginBottom: 48, opacity: 0.9 }}>
        {t(lang, 'welcome_subtitle')}
      </p>

      {/* Half-moon decoration */}
      <div style={{ marginBottom: 40, color: 'var(--accent-gold)', fontSize: 24, opacity: 0.4 }}>
        ☽
      </div>

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary" onClick={onStart}>
          {t(lang, 'btn_start')}
        </button>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent-teal)', fontSize: 13, padding: '8px 0',
          }}
          onClick={onLogin}
        >
          {t(lang, 'btn_already_have')}
        </button>
      </div>
    </div>
  );
}

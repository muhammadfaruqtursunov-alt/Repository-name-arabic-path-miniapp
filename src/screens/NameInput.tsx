import { useState } from 'react';
import { t } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  onSubmit: (name: string) => Promise<string | null>;
}

export default function NameInput({ lang, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    const err = await onSubmit(trimmed);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div
      className="screen-enter"
      style={{ minHeight: '100dvh', padding: '80px 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Islamic calligraphy decoration */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div className="text-arabic" style={{ fontSize: 28, color: 'var(--accent-gold)', opacity: 0.7 }}>
          بِسْمِ اللَّهِ
        </div>
      </div>

      <h1 className="title-screen" style={{ textAlign: 'center' }}>
        {t(lang, 'enter_name')}
      </h1>

      <input
        className="input-field"
        placeholder={t(lang, 'name_placeholder')}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        autoFocus
        maxLength={50}
        style={{ fontSize: 17 }}
      />

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(224,85,85,0.12)',
          border: '1px solid rgba(224,85,85,0.4)',
          borderRadius: 10,
          padding: '10px 14px',
          color: 'var(--danger)',
          fontSize: 13,
          wordBreak: 'break-all',
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        disabled={!name.trim() || loading}
        onClick={handleSubmit}
        style={{ opacity: name.trim() ? 1 : 0.5 }}
      >
        {loading ? '...' : t(lang, 'btn_enter')}
      </button>
    </div>
  );
}

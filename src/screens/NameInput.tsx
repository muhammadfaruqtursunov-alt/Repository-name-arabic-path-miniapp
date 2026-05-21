import { useState } from 'react';
import { t } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  onSubmit: (name: string) => void;
  loading?: boolean;
}

export default function NameInput({ lang, onSubmit, loading }: Props) {
  const [name, setName] = useState('');

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
        onKeyDown={e => e.key === 'Enter' && name.trim() && onSubmit(name.trim())}
        autoFocus
        maxLength={50}
        style={{ fontSize: 17 }}
      />

      <button
        className="btn btn-primary"
        disabled={!name.trim() || loading}
        onClick={() => name.trim() && onSubmit(name.trim())}
        style={{ opacity: name.trim() ? 1 : 0.5 }}
      >
        {loading ? '...' : t(lang, 'btn_enter')}
      </button>
    </div>
  );
}

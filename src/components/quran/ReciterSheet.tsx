import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from './qi18n';
import { RECITERS, reciter, setReciter } from '../../utils/quranProgress';

interface Props {
  lang: Lang;
  onClose: () => void;
}

/** Нижняя панель выбора чтеца — открывается с экрана урока. */
export default function ReciterSheet({ lang, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const current = reciter();

  return createPortal(
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={e => e.stopPropagation()} role="dialog" style={{ maxHeight: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className="title-card" style={{ flex: 1, fontSize: 15 }}>
            {L(lang, 'Чтец', 'Reciter', 'Qori', 'Қорӣ')}
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RECITERS.map(r => (
            <button key={r.id} onClick={() => { setReciter(r.id); onClose(); }}
              className="glass-card"
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: '1px solid',
                borderColor: current === r.id ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer', textAlign: 'left', padding: '12px 14px',
              }}>
              <span style={{ flex: 1, fontWeight: 600, color: current === r.id ? 'var(--accent)' : 'var(--text-main)' }}>
                {lang === 'en' || lang === 'uz' ? r.latin : r.name}
              </span>
              {current === r.id && <Check size={18} color="var(--accent)" />}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

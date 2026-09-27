import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from './qi18n';

interface Props {
  lang: Lang;
  ayahKey: string;            // «2:255»
  text: string | null;        // null — ещё грузится
  arabic: boolean;            // текст на арабском (для en-интерфейса)
  onClose: () => void;
}

/** Нижняя панель с тафсиром ас-Саади к аяту. */
export default function TafsirSheet({ lang, ayahKey, text, arabic, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="tafsir-overlay" onClick={onClose}>
      <div className="tafsir-sheet" onClick={e => e.stopPropagation()} role="dialog">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div className="title-card" style={{ fontSize: 15 }}>
              {L(lang, 'Тафсир ас-Саади', "Tafsir as-Sa'di", 'Tafsir as-Saʼdiy', 'Тафсири ас-Саъдӣ')} · {ayahKey}
            </div>
            {(lang === 'tj' || lang === 'uz') && !arabic && (
              <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                {L(lang, '', '', 'Tafsir hozircha rus tilida; oʻzbekchasi keyin qoʻshiladi', 'Тафсир ҳоло ба забони русӣ; тарҷумаи тоҷикӣ баъдтар илова мешавад')}
              </div>
            )}
            {lang === 'en' && (
              <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                Arabic original — English translation is not available yet
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div className="tafsir-body" dir={arabic ? 'rtl' : 'ltr'}
          style={arabic ? { fontFamily: "'Noto Naskh Arabic', serif", fontSize: 18, lineHeight: 2, textAlign: 'right' } : undefined}>
          {text === null
            ? <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            : text
              ? text.split('\n').map((para, i) => <p key={i} style={{ margin: '0 0 10px' }}>{para}</p>)
              : <p className="text-muted">{L(lang, 'Для этого аята тафсира нет.', 'No tafsir for this ayah.', 'Bu oyat uchun tafsir yoʻq.', 'Барои ин оят тафсир нест.')}</p>}
        </div>
      </div>
    </div>
  );
}

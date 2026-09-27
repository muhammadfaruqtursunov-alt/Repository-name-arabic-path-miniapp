import { CheckCircle2 } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from '../quran/qi18n';

interface Props {
  lang: Lang;
  text: string;      // слово как в тексте (с огласовками)
  meaning: string;    // краткий перевод
  learned: boolean;
  onKnow?: () => void;
  onRepeat?: () => void;
  onClose?: () => void;   // для просмотра слова по тапу в тексте
}

export default function AqidahWordCard(p: Props) {
  const { lang } = p;
  return (
    <div className="glass-card" style={{ padding: '14px 16px' }}>
      <div className="quran-ar" dir="rtl" style={{ fontSize: 34, lineHeight: 1.6, textAlign: 'center' }}>
        {p.text}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, textAlign: 'center' }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-main)' }}>{p.meaning || '…'}</span>
      </div>

      {p.learned && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>
          <CheckCircle2 size={16} /> {L(lang, 'Уже выучено', 'Already learned', 'Allaqachon oʻrganilgan', 'Аллакай омӯхта шуд')}
        </div>
      )}

      {(p.onKnow || p.onClose) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {p.onRepeat && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={p.onRepeat}>
              {L(lang, 'Повторить', 'Repeat', 'Takrorlash', 'Такрор')}
            </button>
          )}
          {p.onKnow && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={p.onKnow}>
              {L(lang, 'Знаю', 'I know it', 'Bilaman', 'Медонам')}
            </button>
          )}
          {p.onClose && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={p.onClose}>
              {L(lang, 'Назад к уроку', 'Back to lesson', 'Darsga qaytish', 'Бозгашт ба дарс')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

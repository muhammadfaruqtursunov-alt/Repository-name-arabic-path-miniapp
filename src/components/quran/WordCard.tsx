import { useState } from 'react';
import { Volume2, CheckCircle2, BookText, Copy, Check } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from './qi18n';
import FirstTapHint from './FirstTapHint';

interface Props {
  lang: Lang;
  text: string;               // слово как в мусхафе
  translit: string;
  lemmaAr: string;            // словарная форма
  meaning: string;            // значение на языке ученика
  context: string;            // перевод в этом аяте
  reviewed: boolean;          // переводы проверены знающим человеком
  learned: boolean;
  newAffixes: string[];       // объяснения приставок/окончаний, встреченных впервые
  siraj?: { phrase: string; expl: string; tr?: string }[];   // «ас-Сирадж»: объяснение + перевод
  ayahMeaning?: string;       // короткий перевод смыслов всего аята
  onTafsir?: () => void;      // открыть тафсир ас-Саади
  onPlay: () => void;
  onKnow?: () => void;
  onRepeat?: () => void;
  onClose?: () => void;       // для просмотра слова по нажатию в аяте
}

/** Пояснения переводчика в [ ] и ( ) показываем бледнее, чтобы основной текст читался сразу. */
function withInsertions(text: string) {
  return text.split(/(\[[^\]]*\]|\([^)]*\))/g).map((part, i) =>
    /^[[(]/.test(part) ? <span key={i} style={{ opacity: 0.6 }}>{part}</span> : part);
}

export default function WordCard(p: Props) {
  const { lang } = p;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copySiraj = (i: number, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(c => (c === i ? null : c)), 1500);
    }).catch(() => {});
  };
  return (
    <div className="glass-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="quran-ar" dir="rtl" style={{ fontSize: 34, lineHeight: 1.6, flex: 1, textAlign: 'right' }}>
          {p.text}
        </div>
        <button
          onClick={p.onPlay}
          aria-label={L(lang, 'Послушать слово', 'Listen to the word', 'Soʻzni tinglash', 'Шунидани калима')}
          style={{ width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Volume2 size={20} />
        </button>
      </div>
      {p.translit && <div className="text-trans" style={{ marginTop: 2 }}>{p.translit}</div>}

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-main)' }}>{p.meaning || '…'}</span>
          {p.lemmaAr && p.lemmaAr !== p.text && (
            <span className="quran-ar" dir="rtl" style={{ fontSize: 18, color: 'var(--text-muted)' }}>{p.lemmaAr}</span>
          )}
        </div>
        {p.context && (
          <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
            {L(lang, 'В этом аяте', 'In this ayah', 'Bu oyatda', 'Дар ин оят')}: «{p.context}»
          </div>
        )}
        {!p.reviewed && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, opacity: 0.8 }}>
            ⓘ {L(lang, 'перевод на проверке', 'translation under review', 'tarjima tekshirilmoqda', 'тарҷума дар санҷиш')}
          </div>
        )}
      </div>

      {p.newAffixes.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {p.newAffixes.map(a => (
            <div key={a} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 10, background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', color: 'var(--text-main)' }}>
              <b style={{ color: 'var(--accent)' }}>{L(lang, 'Новое', 'New', 'Yangi', 'Нав')}:</b> {a}
            </div>
          ))}
        </div>
      )}

      {p.ayahMeaning && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(var(--overlay-rgb),0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>
            {L(lang, 'Смысл аята', 'Meaning of the ayah', 'Oyat maʼnosi', 'Маънои оят')}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-main)' }}>{withInsertions(p.ayahMeaning)}</div>
          {p.onTafsir && (
            <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
              <FirstTapHint storageKey="ap_hint_tafsir_seen"
                text={L(lang, 'Полное толкование аята', 'Full commentary on the ayah', 'Oyatning toʻliq tafsiri', 'Тафсири пурраи оят')} />
              <button className="btn btn-ghost btn-sm" style={{ width: 'auto', gap: 6 }} onClick={p.onTafsir}>
                <BookText size={14} /> {L(lang, 'Тафсир', 'Tafsir', 'Tafsir', 'Тафсир')}
              </button>
            </div>
          )}
        </div>
      )}

      {p.siraj && p.siraj.length > 0 && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(var(--overlay-rgb),0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
            📖 {L(lang, '«ас-Сирадж» — объяснение', 'Al-Siraj — explanation', '«as-Siroj» — izoh', '«ас-Сироҷ» — шарҳ')}
          </div>
          {p.siraj.map((s, i) => (
            <div key={i} style={{ marginTop: i ? 10 : 0 }}>
              <div dir="rtl" style={{ textAlign: 'right', fontSize: 16, lineHeight: 1.8 }}>
                <span className="quran-ar" style={{ color: 'var(--accent)' }}>{s.phrase}</span>
                <span style={{ fontFamily: "'Noto Naskh Arabic', serif", color: 'var(--text-main)' }}> — {s.expl}</span>
              </div>
              {s.tr && <div style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 2 }}>{s.tr}</div>}
              <div style={{ position: 'relative', display: 'inline-block', marginTop: 6 }}>
                {i === 0 && (
                  <FirstTapHint storageKey="ap_hint_siraj_copy_seen"
                    text={L(lang, 'Скопируй и вставь в переводчик', 'Copy and paste into a translator', 'Nusxalab tarjimonga joylashtiring', 'Нусха бардошта, ба тарҷумон гузоред')} />
                )}
                <button
                  onClick={() => copySiraj(i, `${s.phrase} — ${s.expl}`)}
                  className="btn btn-ghost btn-sm"
                  style={{ width: 'auto', gap: 6, fontSize: 11, padding: '4px 10px' }}
                >
                  {copiedIdx === i
                    ? <><Check size={13} /> {L(lang, 'Скопировано', 'Copied', 'Nusxalandi', 'Нусхабардорӣ шуд')}</>
                    : <><Copy size={13} /> {L(lang, 'Копировать текст', 'Copy text', 'Matnni nusxalash', 'Нусхабардории матн')}</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {p.learned && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)' }}>
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

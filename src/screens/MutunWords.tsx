import { useEffect, useState } from 'react';
import { ChevronLeft, Trash2, Volume2 } from 'lucide-react';
import type { Lang } from '../i18n';
import { L } from '../components/quran/qi18n';
import { removeSavedWord, useSavedWords } from '../utils/mutunWords';
import { speakArabic, stopSpeech } from '../utils/speak';

interface Props { lang: Lang; onBack: () => void }

/** Сохранённые слова: можно скрыть переводы и проверять себя (нажми — откроется перевод). */
export default function MutunWords({ lang, onBack }: Props) {
  const words = useSavedWords();
  const [hide, setHide] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  useEffect(() => () => stopSpeech(), []);

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{L(lang, 'Мои слова', 'My words', 'Mening soʻzlarim', 'Калимаҳои ман')}</h1>
      </div>
      <div className="page-content">
        {words.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 40, fontSize: 13, lineHeight: 1.6 }}>
            {L(lang,
              'Пока пусто. При чтении нажмите на незнакомое слово и «Сохранить слово».',
              'Nothing yet. While reading, tap an unfamiliar word and press “Save word”.',
              'Hozircha boʻsh. Oʻqiyotganda notanish soʻzni bosib, «Soʻzni saqlash»ni bosing.',
              'Ҳоло холӣ аст. Ҳангоми хондан калимаи нофаҳмро пахш карда, «Захира кардани калима»-ро пахш кунед.')}
          </p>
        ) : (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, color: 'var(--text-main)' }}>
              <input type="checkbox" checked={hide} onChange={e => { setHide(e.target.checked); setOpen(new Set()); }} />
              {L(lang, 'Скрыть переводы (проверить себя)', 'Hide translations (self-test)', 'Tarjimalarni yashirish (oʻzni tekshirish)', 'Пинҳон кардани тарҷумаҳо (худсанҷӣ)')}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {words.map(w => {
                const shown = !hide || open.has(w.k);
                return (
                  <div key={w.k} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                    <button onClick={() => speakArabic(w.ar)} aria-label="audio"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
                      <Volume2 size={18} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      onClick={() => setOpen(prev => { const n = new Set(prev); if (n.has(w.k)) n.delete(w.k); else n.add(w.k); return n; })}>
                      <div className="quran-ar" dir="rtl" style={{ fontSize: 22, color: 'var(--text-main)', textAlign: 'right' }}>{w.ar}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', minHeight: 20 }}>{shown ? w.gl : '•••'}</div>
                    </div>
                    <button onClick={() => removeSavedWord(w.k)} aria-label="delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

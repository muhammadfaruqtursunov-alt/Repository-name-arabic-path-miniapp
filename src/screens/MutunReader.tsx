import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lang } from '../i18n';
import { L } from '../components/quran/qi18n';
import AqidahPane from '../components/aqidah/AqidahPane';
import type { AqidahWordRef } from '../components/aqidah/AqidahPane';
import { loadAqidahMorphology } from '../utils/aqidahData';
import type { AqidahLexEntry, AqidahMorph } from '../utils/aqidahData';
import { mutunChapterLabel, mutunPointText } from '../utils/mutunData';
import type { MutunChapter } from '../utils/mutunData';
import { speakArabic, stopSpeech } from '../utils/speak';

interface Props {
  lang: Lang;
  bookTitle: string;
  chapter: MutunChapter;
  chapterIdx: number;
  lexicon: AqidahLexEntry[];
  lexIndex: Map<string, number>;
  isLast: boolean;
  onExit: () => void;
  onNext: () => void;
}

/** Читалка главы: заголовок красным, текст сплошной затухающей панелью (как Коран/Акида), внизу — слово и перевод. */
export default function MutunReader({ lang, bookTitle, chapter, chapterIdx, lexicon, lexIndex, isLast, onExit, onNext }: Props) {
  const [active, setActive] = useState<AqidahWordRef>({ pi: 0, id: -1 });
  const [morph, setMorph] = useState<Record<string, AqidahMorph>>({});
  useEffect(() => { loadAqidahMorphology().then(setMorph).catch(() => {}); }, []);
  useEffect(() => () => stopSpeech(), []);

  // AqidahPane рисует только арабский текст пункта.
  const points = useMemo(() => chapter.points.map(p => ({ ar: p.ar, ru: '' })), [chapter]);
  const lab = mutunChapterLabel(chapter, chapterIdx, lang);
  const word = active.id >= 0 ? lexicon[active.id] : null;
  const am = word ? morph[word[0]] : undefined;
  const tr = mutunPointText(chapter.points[active.pi], lang);

  const chips = am ? ([
    am.root && { k: L(lang, 'Корень', 'Root', 'Ildiz', 'Реша'), v: am.root.replace(/\./g, ' ') },
    am.pos && { k: L(lang, 'Часть речи', 'Part of speech', 'Soʻz turkumi', 'Ҳиссаи нутқ'), v: `${am.pos.ar} · ${am.pos.ru}` },
    am.form && { k: L(lang, 'Порода', 'Form', 'Bob', 'Боб'), v: am.form.ar },
    am.tense && { k: L(lang, 'Время', 'Tense', 'Zamon', 'Замон'), v: am.tense.ar },
  ].filter(Boolean) as { k: string; v: string }[]) : [];

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{bookTitle}</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 10 }}>
        <h2 className={lab.ar ? 'quran-ar' : 'title-card'} dir={lab.ar ? 'rtl' : undefined}
          style={{ textAlign: 'center', fontSize: lab.ar ? 24 : 15, color: 'var(--mutun-red)', margin: '0 0 8px' }}>
          {lab.text}
        </h2>
        <AqidahPane
          points={points}
          activeIdx={active.pi}
          activeWordId={active.id}
          lexicon={lexicon}
          lexIndex={lexIndex}
          onTapPoint={pi => setActive({ pi, id: -1 })}
          onTapWord={(ref, entry) => { speakArabic(entry[1]); setActive(ref); }}
        />

        <div className="glass-card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          {word && (
            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 10, paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="quran-ar" dir="rtl" style={{ fontSize: 20, color: 'var(--accent)' }}>{word[1]}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{word[2]}</span>
              </div>
              {chips.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {chips.map((c, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 10, background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', color: 'var(--text-main)' }}>
                      <b style={{ color: 'var(--accent)' }}>{c.k}:</b> {c.v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {tr
            ? <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-main)' }}>{tr}</p>
            : <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                {L(lang,
                  'Перевод этого пункта добавляется. Нажимайте на слова: значение каждого слова показано здесь.',
                  'Translation of this point is coming. Tap words to see each meaning here.',
                  'Bu bandning tarjimasi qoʻshilmoqda. Soʻzlarni bosing: maʼnosi shu yerda koʻrinadi.',
                  'Тарҷумаи ин банд илова мешавад. Калимаҳоро пахш кунед: маънои онҳо дар ин ҷо.')}
              </p>}
        </div>

        {!isLast && (
          <button className="btn btn-continue" style={{ width: '100%', justifyContent: 'center' }} onClick={onNext}>
            <span className="btn-continue__icon"><ChevronRight size={16} /></span>
            <span className="btn-continue__text">
              <span className="btn-continue__label">{L(lang, 'Дальше', 'Next', 'Keyingi', 'Минбаъд')}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

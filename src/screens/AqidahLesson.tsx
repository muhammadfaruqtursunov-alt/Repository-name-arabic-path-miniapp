import { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import type { Lang } from '../i18n';
import type { AqidahLesson as AqidahLessonData, AqidahLexEntry } from '../utils/aqidahData';
import { aqidahLessonTitle, aqidahPointText } from '../utils/aqidahData';
import { markLessonDone, isLessonDone } from '../utils/aqidahProgress';
import type { AqidahBookId } from '../utils/aqidahData';
import AqidahPane from '../components/aqidah/AqidahPane';
import type { AqidahWordRef } from '../components/aqidah/AqidahPane';
import { L } from '../components/quran/qi18n';
import { speakArabic, stopSpeech } from '../utils/speak';

interface Props {
  lang: Lang;
  book: AqidahBookId;
  lessonIdx: number;
  lesson: AqidahLessonData;
  lexicon: AqidahLexEntry[];
  lexIndex: Map<string, number>;
  isLast: boolean;
  onExit: () => void;
  onNext: () => void;
}

export default function AqidahLesson({ lang, book, lessonIdx, lesson, lexicon, lexIndex, isLast, onExit, onNext }: Props) {
  const [active, setActive] = useState<AqidahWordRef>({ pi: 0, id: -1 });

  useEffect(() => () => stopSpeech(), []);

  function onTapWord(ref: AqidahWordRef, entry: AqidahLexEntry) {
    speakArabic(entry[1]);
    setActive(ref);
  }

  const activePoint = lesson.points[active.pi];
  const activeWord = active.id >= 0 ? lexicon[active.id] : null;

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{aqidahLessonTitle(lesson, lang)}</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 10 }}>
        <AqidahPane
          points={lesson.points}
          activeIdx={active.pi}
          activeWordId={active.id}
          lexicon={lexicon}
          lexIndex={lexIndex}
          onTapPoint={pi => setActive({ pi, id: -1 })}
          onTapWord={onTapWord}
        />

        <div className="glass-card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          {activeWord && (
            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 10, paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="quran-ar" dir="rtl" style={{ fontSize: 20, color: 'var(--accent)' }}>{activeWord[1]}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{activeWord[2]}</span>
              </div>
            </div>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-main)' }}>{aqidahPointText(activePoint, lang)}</p>
        </div>

        <button className="btn btn-continue" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => { markLessonDone(book, lessonIdx); if (!isLast) onNext(); else onExit(); }}>
          <span className="btn-continue__icon"><CheckCircle2 size={16} /></span>
          <span className="btn-continue__text">
            <span className="btn-continue__label">
              {isLessonDone(book, lessonIdx)
                ? L(lang, 'Пройдено', 'Done', 'Oʻtildi', 'Гузашт')
                : L(lang, 'Отметить пройденным', 'Mark as done', 'Oʻtilgan deb belgilash', 'Гузашта қайд кунед')}
            </span>
            {!isLast && (
              <span className="btn-continue__title">
                {L(lang, 'Следующий урок', 'Next lesson', 'Keyingi dars', 'Дарси оянда')}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

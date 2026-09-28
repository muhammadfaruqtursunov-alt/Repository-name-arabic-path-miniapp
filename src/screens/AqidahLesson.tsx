import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import type { Lang } from '../i18n';
import type { AqidahLesson as AqidahLessonData, AqidahLexEntry } from '../utils/aqidahData';
import { markLessonDone, isLessonDone } from '../utils/aqidahProgress';
import type { AqidahBookId } from '../utils/aqidahData';
import AqidahArabicText from '../components/aqidah/AqidahArabicText';
import { L } from '../components/quran/qi18n';

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

function speakArabic(text: string) {
  try {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    window.speechSynthesis?.speak(u);
  } catch { /* TTS недоступен */ }
}

export default function AqidahLesson({ lang, book, lessonIdx, lesson, lexicon, lexIndex, isLast, onExit, onNext }: Props) {
  const [subtitle, setSubtitle] = useState<{ ar: string; ru: string } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); window.speechSynthesis?.cancel(); }, []);

  function onTapWord(_id: number, entry: AqidahLexEntry) {
    speakArabic(entry[1]);
    setSubtitle({ ar: entry[1], ru: entry[2] });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setSubtitle(null), 3000);
  }

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{lesson.title_ru}</h1>
      </div>

      <div className="page-content" style={{ paddingBottom: subtitle ? 90 : undefined }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {lesson.points.map((pt, i) => (
            <div key={i} className="glass-card" style={{ padding: '14px 16px' }}>
              <AqidahArabicText text={pt.ar} lexicon={lexicon} lexIndex={lexIndex} onTapWord={onTapWord} />
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-main)' }}>{pt.ru}</p>
            </div>
          ))}
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

      {subtitle && createPortal(
        <div
          onClick={() => setSubtitle(null)}
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
            padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
            background: 'var(--bg-glass)', backdropFilter: 'blur(14px)',
            borderTop: '1px solid var(--border)', textAlign: 'center',
          }}
        >
          <div className="quran-ar" dir="rtl" style={{ fontSize: 22, marginBottom: 4 }}>{subtitle.ar}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{subtitle.ru}</div>
        </div>,
        document.body,
      )}
    </div>
  );
}

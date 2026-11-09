import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Lang } from '../i18n';
import { L } from '../components/quran/qi18n';
import AqidahPane from '../components/aqidah/AqidahPane';
import type { AqidahWordRef } from '../components/aqidah/AqidahPane';
import { loadAqidahMorphology } from '../utils/aqidahData';
import type { AqidahLexEntry, AqidahMorph } from '../utils/aqidahData';
import { mutunChapterLabel, mutunPointText } from '../utils/mutunData';
import type { MutunChapter } from '../utils/mutunData';
import { isChapterDone, markChapterDone, useMutunProgress } from '../utils/mutunProgress';
import { isWordSaved, toggleSavedWord, useSavedWords } from '../utils/mutunWords';
import { speakArabic, stopSpeech } from '../utils/speak';

interface Props {
  lang: Lang;
  bookId: string;
  bookTitle: string;
  chapter: MutunChapter;
  chapterIdx: number;
  lexicon: AqidahLexEntry[];
  lexIndex: Map<string, number>;
  isLast: boolean;
  onExit: () => void;
  onNext: () => void;
}

const SHEET_MIN = 64;

/**
 * Читалка главы: заголовок красным, текст сплошной затухающей панелью.
 * Перевод идёт за пунктом, который сейчас в середине экрана; окно перевода
 * можно тянуть вверх и вниз (или свернуть до полоски).
 */
export default function MutunReader({ lang, bookId, bookTitle, chapter, chapterIdx, lexicon, lexIndex, isLast, onExit, onNext }: Props) {
  const [active, setActive] = useState<AqidahWordRef>({ pi: 0, id: -1 });
  const [morph, setMorph] = useState<Record<string, AqidahMorph>>({});
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const [sheetH, setSheetH] = useState(Math.round(vh * 0.3));
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);
  useSavedWords();
  useMutunProgress();

  useEffect(() => { loadAqidahMorphology().then(setMorph).catch(() => {}); }, []);
  useEffect(() => () => stopSpeech(), []);

  const points = useMemo(() => chapter.points.map(p => ({ ar: p.ar, ru: '' })), [chapter]);
  const lab = mutunChapterLabel(chapter, chapterIdx, lang);
  const word = active.id >= 0 ? lexicon[active.id] : null;
  const am = word ? morph[word[0]] : undefined;
  const tr = mutunPointText(chapter.points[active.pi], lang);
  const saved = word ? isWordSaved(word[0]) : false;
  const collapsed = sheetH <= SHEET_MIN + 20;

  const chips = am ? ([
    am.root && { k: L(lang, 'Корень', 'Root', 'Ildiz', 'Реша'), v: am.root.replace(/\./g, ' ') },
    am.pos && { k: L(lang, 'Часть речи', 'Part of speech', 'Soʻz turkumi', 'Ҳиссаи нутқ'), v: `${am.pos.ar} · ${am.pos.ru}` },
    am.form && { k: L(lang, 'Порода', 'Form', 'Bob', 'Боб'), v: am.form.ar },
    am.tense && { k: L(lang, 'Время', 'Tense', 'Zamon', 'Замон'), v: am.tense.ar },
  ].filter(Boolean) as { k: string; v: string }[]) : [];

  const clamp = (h: number) => Math.max(SHEET_MIN, Math.min(Math.round(vh * 0.78), h));
  const snap = (h: number) => {
    const stops = [SHEET_MIN, Math.round(vh * 0.3), Math.round(vh * 0.6)];
    return stops.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
  };

  function onDown(e: React.PointerEvent) {
    drag.current = { y: e.clientY, h: sheetH, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 4) d.moved = true;
    setSheetH(clamp(d.h + dy));
  }
  function onUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) setSheetH(collapsed ? Math.round(vh * 0.3) : SHEET_MIN);
    else setSheetH(h => snap(h));
  }

  const sheet = (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, height: sheetH, zIndex: 60,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderRadius: '20px 20px 0 0',
      boxShadow: '0 -8px 24px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column',
      transition: drag.current ? 'none' : 'height .22s ease',
    }}>
      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ padding: '10px 0 6px', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--border)', margin: '0 auto' }} />
      </div>
      <div style={{ padding: '0 16px 16px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {collapsed ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {word ? `${word[1]} — ${word[2]}` : (tr ?? L(lang, 'Перевод', 'Translation', 'Tarjima', 'Тарҷума'))}
          </p>
        ) : (
          <>
            {word && (
              <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 10, paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="quran-ar" dir="rtl" style={{ fontSize: 22, color: 'var(--accent)' }}>{word[1]}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', flex: 1, minWidth: 0 }}>{word[2]}</span>
                  <button onClick={() => toggleSavedWord({ k: word[0], ar: word[1], gl: word[2] })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      padding: '6px 10px', borderRadius: 12, border: '1px solid var(--accent-border)',
                      background: saved ? 'var(--accent-tint)' : 'transparent', color: 'var(--accent)',
                    }}>
                    {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    {saved
                      ? L(lang, 'Сохранено', 'Saved', 'Saqlandi', 'Нигоҳ дошта шуд')
                      : L(lang, 'Сохранить слово', 'Save word', 'Soʻzni saqlash', 'Захира кардани калима')}
                  </button>
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
              ? <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-main)' }}>{tr}</p>
              : <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {L(lang,
                    'Перевод этого пункта добавляется. Нажимайте на слова: значение каждого слова показано здесь.',
                    'Translation of this point is coming. Tap words to see each meaning here.',
                    'Bu bandning tarjimasi qoʻshilmoqda. Soʻzlarni bosing: maʼnosi shu yerda koʻrinadi.',
                    'Тарҷумаи ин банд илова мешавад. Калимаҳоро пахш кунед: маънои онҳо дар ин ҷо.')}
                </p>}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{bookTitle}</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 10, paddingBottom: sheetH + 24 }}>
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
          followScroll
          style={{ maxHeight: `calc(100dvh - ${sheetH + 240}px)`, minHeight: 140 }}
          onCenterChange={pi => setActive({ pi, id: -1 })}
          onTapPoint={pi => setActive({ pi, id: -1 })}
          onTapWord={(ref, entry) => { speakArabic(entry[1]); setActive(ref); }}
        />

        <button className="btn btn-continue" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => { markChapterDone(bookId, chapterIdx); if (isLast) onExit(); else onNext(); }}>
          <span className="btn-continue__icon"><CheckCircle2 size={16} /></span>
          <span className="btn-continue__text">
            <span className="btn-continue__label">
              {isChapterDone(bookId, chapterIdx)
                ? L(lang, 'Пройдено', 'Done', 'Oʻtildi', 'Гузашт')
                : L(lang, 'Отметить пройденным', 'Mark as done', 'Oʻtilgan deb belgilash', 'Гузашта қайд кунед')}
            </span>
            {!isLast && (
              <span className="btn-continue__title">{L(lang, 'Следующая глава', 'Next chapter', 'Keyingi bob', 'Боби оянда')}</span>
            )}
          </span>
        </button>
      </div>
      {createPortal(sheet, document.body)}
    </div>
  );
}

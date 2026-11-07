import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, BookMarked } from 'lucide-react';
import type { Lang } from '../i18n';
import { L } from '../components/quran/qi18n';
import {
  loadMutunBook, loadMutunIndex, loadMutunLexicon, mutunChapterLabel,
} from '../utils/mutunData';
import type { MutunBook, MutunIndexEntry } from '../utils/mutunData';
import type { AqidahLexEntry } from '../utils/aqidahData';
import MutunReader from './MutunReader';

interface Props {
  lang: Lang;
  onBack: () => void;
  onLocalBack: (fn: null | (() => void)) => void;
}

type View =
  | { kind: 'home' }
  | { kind: 'book'; id: string }
  | { kind: 'chapter'; id: string; idx: number };

const LEVELS = [1, 2, 3, 4];

const NoConn = ({ lang }: { lang: Lang }) => (
  <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>
    {L(lang, 'Нет связи. Попробуйте позже.', 'No connection. Try again later.', 'Aloqa yoʻq. Keyinroq urinib koʻring.', 'Пайваст нест. Баъдтар кӯшиш кунед.')}
  </p>
);

export default function Mutun({ lang, onBack, onLocalBack }: Props) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [index, setIndex] = useState<MutunIndexEntry[] | null>(null);
  const [book, setBook] = useState<MutunBook | null>(null);
  const [lexicon, setLexicon] = useState<AqidahLexEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadMutunIndex().then(setIndex).catch(() => setFailed(true));
    loadMutunLexicon().then(setLexicon).catch(() => setFailed(true));
  }, []);

  const bookId = view.kind === 'home' ? null : view.id;
  useEffect(() => {
    setBook(null);
    if (!bookId) return;
    let live = true;
    loadMutunBook(bookId).then(b => { if (live) setBook(b); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [bookId]);

  useEffect(() => {
    const parent: View | null =
      view.kind === 'chapter' ? { kind: 'book', id: view.id }
      : view.kind === 'book' ? { kind: 'home' }
      : null;
    onLocalBack(parent ? () => setView(parent) : null);
    return () => onLocalBack(null);
  }, [view, onLocalBack]);

  const lexIndex = useMemo(() => new Map((lexicon ?? []).map((e, i) => [e[0], i] as const)), [lexicon]);
  const meta = index?.find(b => b.id === bookId);

  const header = (title: string, back: () => void) => (
    <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
      <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
        <ChevronLeft size={24} />
      </button>
      <h1 className="title-card" style={{ flex: 1 }}>{title}</h1>
    </div>
  );
  const pageTitle = L(lang, 'Мутун талиб аль-ильм', 'Mutun Talib al-Ilm', 'Mutun tolib al-ilm', 'Мутуни толиб-ул-илм');
  const skeleton = <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />;

  if (view.kind === 'home') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(pageTitle, onBack)}
        <div className="page-content">
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
            {L(lang,
              'Издание д-ра Абдульмухсина аль-Касима: тексты по уровням, как в книге',
              'Dr. Abdulmuhsin al-Qasim edition: texts by level, as in the book',
              'Dr. Abdulmuhsin al-Qosim nashri: matnlar darajalar boʻyicha',
              'Нашри доктор Абдулмуҳсин ал-Қосим: матнҳо аз рӯи сатҳ')}
          </p>
          {failed && <NoConn lang={lang} />}
          {!index && !failed && skeleton}
          {index && LEVELS.map(lv => (
            <div key={lv} style={{ marginBottom: 16 }}>
              <div className="title-card" style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>
                {L(lang, `Мустава ${lv}`, `Level ${lv}`, `${lv}-daraja`, `Сатҳи ${lv}`)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {index.filter(b => b.level === lv).map(b => (
                  <button key={b.id} className="glass-card" onClick={() => setView({ kind: 'book', id: b.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', padding: '12px 14px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookMarked size={20} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="title-card" style={{ fontSize: 14 }}>{b.title_ru}</div>
                      <div className="quran-ar" dir="rtl" style={{ fontSize: 15, color: 'var(--mutun-red)' }}>{b.title_ar}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{b.sub_ru}</div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const backToBook = () => setView({ kind: 'book', id: view.id });
  const backToHome = () => setView({ kind: 'home' });

  if (failed) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(pageTitle, backToHome)}
        <div className="page-content"><NoConn lang={lang} /></div>
      </div>
    );
  }

  if (!book || !meta || book.id !== view.id) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(pageTitle, backToHome)}
        <div className="page-content">{skeleton}</div>
      </div>
    );
  }

  if (view.kind === 'book') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(meta.title_ru, backToHome)}
        <div className="page-content">
          <h2 className="quran-ar" dir="rtl" style={{ fontSize: 24, textAlign: 'center', color: 'var(--mutun-red)', margin: '4px 0 14px' }}>
            {book.title_ar}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {book.chapters.map((ch, idx) => {
              const lab = mutunChapterLabel(ch, idx, lang);
              return (
                <button key={idx} className="glass-card" onClick={() => setView({ kind: 'chapter', id: book.id, idx })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '12px 14px' }}>
                  <span className="surah-medal">{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {lab.ar
                      ? <div className="quran-ar" dir="rtl" style={{ fontSize: 17, color: 'var(--mutun-red)' }}>{lab.text}</div>
                      : <div className="title-card" style={{ fontSize: 14 }}>{lab.text}</div>}
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {ch.points.length} {L(lang, 'пунктов', 'points', 'band', 'банд')}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!lexicon) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(meta.title_ru, backToBook)}
        <div className="page-content">{skeleton}</div>
      </div>
    );
  }

  const chapter = book.chapters[view.idx];
  if (!chapter) return null;
  return (
    <MutunReader
      key={`${book.id}-${view.idx}`}
      lang={lang}
      bookTitle={meta.title_ru}
      chapter={chapter}
      chapterIdx={view.idx}
      lexicon={lexicon}
      lexIndex={lexIndex}
      isLast={view.idx === book.chapters.length - 1}
      onExit={backToBook}
      onNext={() => setView({ kind: 'chapter', id: book.id, idx: view.idx + 1 })}
    />
  );
}

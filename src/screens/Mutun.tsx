import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, BookMarked, Bookmark, CheckCircle2 } from 'lucide-react';
import type { Lang } from '../i18n';
import { L } from '../components/quran/qi18n';
import {
  HADITH_BOOKS, loadMutunBook, loadMutunIndex, loadMutunLexicon, mutunChapterLabel,
} from '../utils/mutunData';
import type { MutunBook, MutunIndexEntry } from '../utils/mutunData';
import type { AqidahLexEntry } from '../utils/aqidahData';
import MutunReader from './MutunReader';
import MutunWords from './MutunWords';
import { syncMutunWordsFromCloud, useSavedWords } from '../utils/mutunWords';
import { bookDoneCount, isChapterDone, syncMutunProgressFromCloud, useMutunProgress } from '../utils/mutunProgress';

interface Props {
  /** 'hadith' — раздел «Хадисы» (Арбаин и Булюг аль-Марам); по умолчанию Мутун. */
  section?: 'mutun' | 'hadith';
  lang: Lang;
  onBack: () => void;
  onLocalBack: (fn: null | (() => void)) => void;
}

type View =
  | { kind: 'home' }
  | { kind: 'level'; lv: number }
  | { kind: 'words' }
  | { kind: 'book'; id: string }
  | { kind: 'chapter'; id: string; idx: number };

const LEVELS = [1, 2, 3, 4];
/** Книги, у которых есть своя обложка (public/mutun/covers/<id>.jpg). */
const BOOK_COVERS = new Set(['ajurrumiyya', 'bulugh']);
/** Фото обложек из издания пользователя (public/mutun/covers/L1-4.jpg). */
const COVER_EXT = 'jpg';

const NoConn = ({ lang }: { lang: Lang }) => (
  <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>
    {L(lang, 'Нет связи. Попробуйте позже.', 'No connection. Try again later.', 'Aloqa yoʻq. Keyinroq urinib koʻring.', 'Пайваст нест. Баъдтар кӯшиш кунед.')}
  </p>
);

export default function Mutun({ section = 'mutun', lang, onBack, onLocalBack }: Props) {
  const hadith = section === 'hadith';
  const [view, setView] = useState<View>({ kind: 'home' });
  const [index, setIndex] = useState<MutunIndexEntry[] | null>(null);
  const [book, setBook] = useState<MutunBook | null>(null);
  const [lexicon, setLexicon] = useState<AqidahLexEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const saved = useSavedWords();
  useMutunProgress();

  useEffect(() => { void syncMutunWordsFromCloud(); void syncMutunProgressFromCloud(); }, []);

  useEffect(() => {
    loadMutunIndex().then(setIndex).catch(() => setFailed(true));
    loadMutunLexicon().then(setLexicon).catch(() => setFailed(true));
  }, []);

  const bookId = view.kind === 'book' || view.kind === 'chapter' ? view.id : null;
  useEffect(() => {
    setBook(null);
    if (!bookId) return;
    let live = true;
    loadMutunBook(bookId).then(b => { if (live) setBook(b); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [bookId]);

  useEffect(() => {
    const bk = (hadith ? HADITH_BOOKS : index)?.find(b => b.id === bookId);
    const parent: View | null =
      view.kind === 'chapter' ? { kind: 'book', id: view.id }
      : view.kind === 'book' ? (bk && !hadith ? { kind: 'level', lv: bk.level } : { kind: 'home' })
      : view.kind === 'level' || view.kind === 'words' ? { kind: 'home' }
      : null;
    onLocalBack(parent ? () => setView(parent) : null);
    return () => onLocalBack(null);
  }, [view, onLocalBack, index, bookId]);

  const lexIndex = useMemo(() => new Map((lexicon ?? []).map((e, i) => [e[0], i] as const)), [lexicon]);
  const meta = (hadith ? HADITH_BOOKS : index)?.find(b => b.id === bookId);

  const header = (title: string, back: () => void) => (
    <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
      <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
        <ChevronLeft size={24} />
      </button>
      <h1 className="title-card" style={{ flex: 1 }}>{title}</h1>
    </div>
  );
  const pageTitle = hadith
    ? L(lang, 'Хадисы', 'Hadith', 'Hadislar', 'Ҳадисҳо')
    : L(lang, 'Мутун талиб аль-ильм', 'Mutun Talib al-Ilm', 'Mutun tolib al-ilm', 'Мутуни толиб-ул-илм');
  const skeleton = <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />;

  const levelLabel = (lv: number) => L(lang, `Мустава ${lv}`, `Level ${lv}`, `${lv}-daraja`, `Сатҳи ${lv}`);

  if (view.kind === 'words') return <MutunWords lang={lang} onBack={() => setView({ kind: 'home' })} />;

  if (view.kind === 'home' && hadith) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(pageTitle, onBack)}
        <div className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HADITH_BOOKS.map(b => (
              <button key={b.id} className="glass-card" onClick={() => setView({ kind: 'book', id: b.id })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', padding: '14px' }}>
                {BOOK_COVERS.has(b.id)
                  ? <img src={`/mutun/covers/${b.id}.jpg`} alt="" style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.25)' }} />
                  : <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookMarked size={22} color="var(--accent)" />
                    </div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title-card" style={{ fontSize: 14 }}>{b.title_ru}</div>
                  <div className="quran-ar" dir="rtl" style={{ fontSize: 17, color: 'var(--mutun-red)' }}>{b.title_ar}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {b.sub_ru} · {bookDoneCount(b.id)} / {b.chapters} {L(lang, 'глав', 'chapters', 'bob', 'боб')}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            ))}
            <button className="glass-card" onClick={() => setView({ kind: 'words' })}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '12px 14px' }}>
              <Bookmark size={20} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <div className="title-card" style={{ fontSize: 14 }}>{L(lang, 'Мои слова', 'My words', 'Mening soʻzlarim', 'Калимаҳои ман')}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{saved.length} {L(lang, 'сохранено', 'saved', 'saqlangan', 'захира шуд')}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {index && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {LEVELS.map(lv => (
                <button key={lv} onClick={() => setView({ kind: 'level', lv })}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center' }}>
                  <img src={`/mutun/covers/L${lv}.${COVER_EXT}`} alt={levelLabel(lv)}
                    style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,.28)', display: 'block' }} />
                  <div className="title-card" style={{ fontSize: 14, color: 'var(--mutun-red)', marginTop: 8 }}>{levelLabel(lv)}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {index.filter(b => b.level === lv).length} {L(lang, 'текста', 'texts', 'matn', 'матн')}
                  </div>
                </button>
              ))}
            </div>
          )}
          <button className="glass-card" onClick={() => setView({ kind: 'words' })}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '12px 14px', marginTop: 16 }}>
            <Bookmark size={20} color="var(--accent)" />
            <div style={{ flex: 1 }}>
              <div className="title-card" style={{ fontSize: 14 }}>{L(lang, 'Мои слова', 'My words', 'Mening soʻzlarim', 'Калимаҳои ман')}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{saved.length} {L(lang, 'сохранено', 'saved', 'saqlangan', 'захира шуд')}</div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>
        </div>
      </div>
    );
  }

  if (view.kind === 'level') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(levelLabel(view.lv), () => setView({ kind: 'home' }))}
        <div className="page-content">
          {!index ? skeleton : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {index.filter(b => b.level === view.lv).map(b => (
                <button key={b.id} className="glass-card" onClick={() => setView({ kind: 'book', id: b.id })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', padding: '12px 14px' }}>
                  {BOOK_COVERS.has(b.id)
                    ? <img src={`/mutun/covers/${b.id}.jpg`} alt="" style={{ width: 42, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.25)' }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookMarked size={20} color="var(--accent)" />
                      </div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="title-card" style={{ fontSize: 14 }}>{b.title_ru}</div>
                    <div className="quran-ar" dir="rtl" style={{ fontSize: 16, color: 'var(--mutun-red)' }}>{b.title_ar}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {b.sub_ru} · {bookDoneCount(b.id)} / {b.chapters} {L(lang, 'глав', 'chapters', 'bob', 'боб')}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const backToBook = () => setView({ kind: 'book', id: view.id });
  const backToHome = () => setView(meta && !hadith ? { kind: 'level', lv: meta.level } : { kind: 'home' });

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
                      : <div className="title-card" style={{ fontSize: 14, color: 'var(--mutun-red)' }}>{lab.text}</div>}
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {ch.note ? `${L(lang, 'хадисы', 'hadiths', 'hadislar', 'ҳадисҳо')} ${ch.note}` : `${ch.points.length} ${L(lang, 'пунктов', 'points', 'band', 'банд')}`}
                    </div>
                  </div>
                  {isChapterDone(book.id, idx)
                    ? <CheckCircle2 size={18} color="var(--accent-teal)" />
                    : <ChevronRight size={16} color="var(--text-muted)" />}
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
      bookId={book.id}
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Square, GraduationCap, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { Lang } from '../i18n';
import { useSwipe } from '../hooks/useSwipe';
import {
  loadPage, loadLexicon, loadMeanings, loadSiraj, prefetchPage, parseKey, wordPosition, TOTAL_PAGES,
} from '../utils/quranData';
import type { QuranPageData, Lexicon, Meanings, PageWord, SirajEntry } from '../utils/quranData';
import {
  isLemmaLearned, isAffixSeen, setLemmasLearned, markAffixesSeen, markPageDone, setLastPage, reciter,
  reportQuranStats, useQuranProgress,
} from '../utils/quranProgress';
import { playWord, playAyahs, stopQuranAudio } from '../utils/quranAudio';
import AyahPane from '../components/quran/AyahPane';
import type { WordRef } from '../components/quran/AyahPane';
import WordCard from '../components/quran/WordCard';
import QuranQuiz from '../components/quran/QuranQuiz';
import type { QuizItem } from '../components/quran/QuranQuiz';
import { L } from '../components/quran/qi18n';

interface Props {
  lang: Lang;
  pageNo: number;
  title: string;                       // «Сура · стр. N»
  onOpenPage: (p: number) => void;
  onExit: () => void;
}

interface Card { lid: number; ref: WordRef; affixes: number[] }
type Step = 'study' | 'test' | 'result';

export default function QuranPage({ lang, pageNo, title, onOpenPage, onExit }: Props) {
  useQuranProgress();
  const [data, setData] = useState<{ page: QuranPageData; lex: Lexicon; mean: Meanings; siraj: SirajEntry[] } | null>(null);
  const [error, setError] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [peek, setPeek] = useState<WordRef | null>(null);
  const [step, setStep] = useState<Step>('study');
  const [learnedNow, setLearnedNow] = useState<number[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null); setError(false); setStep('study'); setIdx(0); setKnown(new Set()); setPeek(null);
    Promise.all([loadPage(pageNo), loadLexicon(), loadMeanings(lang), loadSiraj(pageNo)])
      .then(([page, lex, mean, siraj]) => {
        if (!alive) return;
        setData({ page, lex, mean, siraj });
        setCards(buildCards(page));
        setLastPage(pageNo);
        prefetchPage(pageNo + 1);
      })
      .catch(() => alive && setError(true));
    return () => { alive = false; stopQuranAudio(); };
  }, [pageNo, lang]);

  const word = useCallback((r: WordRef): PageWord | null => data?.page.a[r.fi]?.w[r.wi] ?? null, [data]);

  const contextOf = useCallback((w: PageWord) => (lang === 'en' ? w[4] : w[5] || w[4]), [lang]);
  const meaningOf = useCallback(
    (lid: number, w?: PageWord) => data?.mean.lemmas[lid] || (w ? contextOf(w) : '') || '',
    [data, contextOf],
  );

  const distractors = useMemo(() => {
    if (!data) return () => [];
    const byPos = new Map<string, number[]>();
    data.lex.lemmas.forEach((l, i) => {
      if (!data.mean.lemmas[i]) return;
      const arr = byPos.get(l[2]) ?? [];
      arr.push(i);
      byPos.set(l[2], arr);
    });
    const all = [...byPos.values()].flat();
    return (lid: number, answer: string) => {
      const pool = (byPos.get(data.lex.lemmas[lid][2]) ?? []).length >= 12 ? byPos.get(data.lex.lemmas[lid][2])! : all;
      const out = new Set<string>();
      for (let guard = 0; out.size < 3 && guard < 200; guard++) {
        const m = data.mean.lemmas[pool[Math.floor(Math.random() * pool.length)]];
        if (m && m !== answer) out.add(m);
      }
      return [...out];
    };
  }, [data]);

  const next = () => { setPeek(null); setIdx(i => Math.min(i + 1, cards.length - 1)); };
  const prev = () => { setPeek(null); setIdx(i => Math.max(i - 1, 0)); };
  const swipe = useSwipe(next, prev);

  function answer(isKnown: boolean) {
    const c = cards[idx];
    setKnown(k => { const n = new Set(k); if (isKnown) n.add(c.lid); else n.delete(c.lid); return n; });
    setPeek(null);
    if (idx + 1 < cards.length) setIdx(idx + 1);
    else setStep('test');
  }

  function finishTest(firstOk: Set<number>) {
    const learned = cards.map(c => c.lid).filter(lid => known.has(lid) && firstOk.has(lid));
    setLemmasLearned(learned, true);
    markAffixesSeen(cards.flatMap(c => c.affixes));
    markPageDone(pageNo);
    reportQuranStats();
    setLearnedNow(learned);
    setStep('result');
  }

  function finishWithoutNewWords() {
    markAffixesSeen(cards.flatMap(c => c.affixes));
    markPageDone(pageNo);
    reportQuranStats();
    setLearnedNow([]);
    setStep('result');
  }

  function togglePlayPage() {
    if (!data) return;
    if (playing !== null) { stopQuranAudio(); setPlaying(null); return; }
    const keys = data.page.a.map(fr => parseKey(fr.k));
    void playAyahs(reciter(), keys, i => setPlaying(i), () => setPlaying(null));
  }

  function playRef(r: WordRef) {
    if (!data) return;
    const fr = data.page.a[r.fi];
    const [s, a] = parseKey(fr.k);
    playWord(s, a, wordPosition(fr, r.wi));
  }

  // ── рендер ──
  const header = (
    <div className="page-header" style={{ background: 'var(--bg-card)' }}>
      <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
        <ChevronLeft size={24} />
      </button>
      <h1 className="title-card" style={{ flex: 1, fontSize: 15 }}>{title}</h1>
      {data && (
        <button onClick={togglePlayPage} className="btn btn-ghost btn-sm" style={{ gap: 6, marginRight: 84 }}
          aria-label={L(lang, 'Слушать страницу', 'Listen to the page', 'Sahifani tinglash', 'Шунидани саҳифа')}>
          {playing !== null ? <Square size={14} /> : <Play size={14} />}
        </button>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header}
        <div className="page-content" style={{ textAlign: 'center', paddingTop: 40 }}>
          <p className="text-muted">{L(lang, 'Не удалось загрузить страницу. Проверьте интернет.', 'Could not load the page. Check your connection.', 'Sahifani yuklab boʻlmadi. Internetni tekshiring.', 'Саҳифа бор нашуд. Интернетро санҷед.')}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onOpenPage(pageNo)}>
            {L(lang, 'Повторить', 'Retry', 'Qayta urinish', 'Такрор')}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header}
        <div className="page-content">
          <div className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  const newSet = new Set(cards.map(c => c.lid));
  const cur = cards[idx];
  const shownRef = peek ?? cur?.ref ?? null;

  // «Сирадж»: объяснения, покрывающие это слово; объяснения ко всему аяту —
  // на первой карточке этого аята (или при нажатии на слово)
  const sirajFor = (r: WordRef, isPeek: boolean) => {
    const firstCardOfAyah = cards.find(c => c.ref.fi === r.fi)?.ref.wi === r.wi;
    return data.siraj
      .filter(([fi, wi, len]) => fi === r.fi && (wi === -1 ? isPeek || firstCardOfAyah : r.wi >= wi && r.wi < wi + len))
      .map(([, , , phrase, expl]) => ({ phrase, expl }));
  };

  const cardFor = (r: WordRef, isPeek: boolean) => {
    const w = word(r)!;
    const lid = w[1];
    const c = cards.find(x => x.lid === lid && !isPeek);
    return (
      <WordCard
        lang={lang}
        text={w[0]}
        translit={w[6]}
        lemmaAr={data.lex.lemmas[lid][0]}
        meaning={meaningOf(lid, w)}
        context={contextOf(w)}
        reviewed={data.mean.reviewed}
        learned={isLemmaLearned(lid)}
        newAffixes={(isPeek ? [...w[2], ...w[3]].filter(a => !isAffixSeen(a)) : c?.affixes ?? [])
          .map(a => data.mean.affixes[a]).filter(Boolean)}
        siraj={sirajFor(r, isPeek)}
        onPlay={() => playRef(r)}
        onKnow={isPeek ? undefined : () => answer(true)}
        onRepeat={isPeek ? undefined : () => answer(false)}
        onClose={isPeek ? () => setPeek(null) : undefined}
      />
    );
  };

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {header}
      <div className="page-content" style={{ paddingTop: 10 }}>
        <AyahPane
          page={data.page}
          focus={step === 'study' ? shownRef : null}
          newLemmas={newSet}
          playingFrag={playing}
          onTapWord={r => { if (step === 'study') { setPeek(r); playRef(r); } }}
        />

        {step === 'study' && cards.length === 0 && !peek && (
          <div className="glass-card" style={{ textAlign: 'center', padding: 20 }}>
            <CheckCircle2 size={32} color="var(--accent-teal)" />
            <p style={{ margin: '10px 0 14px', fontWeight: 700 }}>
              {L(lang, 'Все слова этой страницы уже выучены', 'All words on this page are already learned', 'Bu sahifaning barcha soʻzlari oʻrganilgan', 'Ҳамаи калимаҳои ин саҳифа омӯхта шудаанд')}
            </p>
            <button className="btn btn-primary" onClick={finishWithoutNewWords}>
              {L(lang, 'Страница пройдена', 'Mark page as done', 'Sahifa tugadi', 'Саҳифа анҷом ёфт')}
            </button>
          </div>
        )}

        {step === 'study' && (cards.length > 0 || peek) && shownRef && (
          <div {...swipe}>
            {!peek && (
              <div className="text-muted" style={{ fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                {L(lang, 'Новое слово', 'New word', 'Yangi soʻz', 'Калимаи нав')} {idx + 1} / {cards.length}
              </div>
            )}
            {cardFor(shownRef, !!peek)}
            {!peek && cards.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={prev} disabled={idx === 0}>
                  <ChevronLeft size={16} /> {L(lang, 'Назад', 'Back', 'Orqaga', 'Қафо')}
                </button>
                {idx === cards.length - 1 ? (
                  <button className="btn btn-gold btn-sm" style={{ flex: 1, gap: 6 }} onClick={() => setStep('test')}>
                    <GraduationCap size={16} /> {L(lang, 'К тесту', 'To the test', 'Testga', 'Ба санҷиш')}
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={next}>
                    {L(lang, 'Дальше', 'Next', 'Keyingi', 'Баъдӣ')} <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'test' && (
          <QuranQuiz
            lang={lang}
            items={cards.map<QuizItem>(c => {
              const w = word(c.ref)!;
              return { lid: c.lid, ar: w[0], answer: meaningOf(c.lid, w), play: () => playRef(c.ref) };
            })}
            distractors={distractors}
            onDone={finishTest}
          />
        )}

        {step === 'result' && (
          <div className="glass-card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 44 }}>🌙</div>
            <h2 className="title-screen" style={{ margin: '6px 0' }}>
              {L(lang, 'Страница пройдена', 'Page complete', 'Sahifa tugadi', 'Саҳифа анҷом ёфт')}
            </h2>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 16 }}>
              {L(lang, 'Выучено слов', 'Words learned', 'Oʻrganilgan soʻzlar', 'Калимаҳои омӯхта')}: <b style={{ color: 'var(--accent-teal)' }}>{learnedNow.length}</b>
              {cards.length - learnedNow.length > 0 && (
                <> · {L(lang, 'повторить позже', 'to review later', 'keyinroq takrorlash', 'баъдтар такрор')}: <b>{cards.length - learnedNow.length}</b></>
              )}
            </p>
            {pageNo < TOTAL_PAGES && (
              <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={() => onOpenPage(pageNo + 1)}>
                {L(lang, 'Следующая страница', 'Next page', 'Keyingi sahifa', 'Саҳифаи навбатӣ')} → {pageNo + 1}
              </button>
            )}
            {cards.length > 0 && (
              <button className="btn btn-ghost" style={{ marginBottom: 10, gap: 6 }} onClick={() => onOpenPage(pageNo)}>
                <RotateCcw size={15} /> {L(lang, 'Пройти ещё раз', 'Study again', 'Yana oʻqish', 'Боз омӯхтан')}
              </button>
            )}
            <button className="btn btn-ghost" onClick={onExit}>{L(lang, 'К списку', 'Back to list', 'Roʻyxatga', 'Ба рӯйхат')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Карточки урока: новые (невыученные) леммы страницы в порядке появления + впервые встреченные приставки. */
function buildCards(page: QuranPageData): Card[] {
  const cards: Card[] = [];
  const seenLemma = new Set<number>();
  const affixHere = new Set<number>();
  page.a.forEach((fr, fi) => fr.w.forEach((w, wi) => {
    const lid = w[1];
    const newAff = [...w[2], ...w[3]].filter(a => !isAffixSeen(a) && !affixHere.has(a));
    if (!isLemmaLearned(lid) && !seenLemma.has(lid)) {
      seenLemma.add(lid);
      newAff.forEach(a => affixHere.add(a));
      cards.push({ lid, ref: { fi, wi }, affixes: newAff });
    }
  }));
  // приставка встретилась только на повторе слова или на уже выученном слове —
  // объясняем её на карточке этого же слова (если оно в уроке), иначе на первой
  if (cards.length) {
    page.a.forEach(fr => fr.w.forEach(w => [...w[2], ...w[3]].forEach(a => {
      if (isAffixSeen(a) || affixHere.has(a)) return;
      affixHere.add(a);
      (cards.find(c => c.lid === w[1]) ?? cards[0]).affixes.push(a);
    })));
  }
  return cards;
}

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { Lang } from '../i18n';
import {
  loadIndex, loadSurahNames, loadLexicon, loadMeanings, surahName, TOTAL_PAGES,
} from '../utils/quranData';
import type { QuranIndex, SurahNames, Lexicon, Meanings } from '../utils/quranData';
import {
  isPageDone, learnedCount, pagesDoneCount, nextPageToLearn,
  lastReview, setLastReview, learnedLemmaIds, setLemmasLearned, syncFromCloud, useQuranProgress,
  reportQuranStats,
} from '../utils/quranProgress';
import QuranQuiz from '../components/quran/QuranQuiz';
import QuranSearch from '../components/quran/QuranSearch';
import { L } from '../components/quran/qi18n';
import QuranPage from './QuranPage';

interface Props {
  lang: Lang;
  onBack: () => void;
  onLocalBack: (fn: null | (() => void)) => void;
}

type Tab = 'surah' | 'juz' | 'hizb' | 'page';
type View =
  | { kind: 'home' }
  | { kind: 'list'; title: string; from: number; to: number }
  | { kind: 'page'; p: number; nonce: number; back: View }
  | { kind: 'review' };

const REVIEW_EVERY_MS = 3 * 24 * 3600 * 1000;
const REVIEW_SIZE = 8;

export default function Quran({ lang, onBack, onLocalBack }: Props) {
  useQuranProgress();
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [names, setNames] = useState<SurahNames | null>(null);
  const [tab, setTab] = useState<Tab>('surah');
  const [view, setView] = useState<View>({ kind: 'home' });
  const [error, setError] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.all([loadIndex(), loadSurahNames()])
      .then(([i, n]) => { setIndex(i); setNames(n); })
      .catch(() => setError(true));
    void syncFromCloud();
  }, []);

  // «Назад»: урок → список → вкладки → выход из раздела
  useEffect(() => {
    const parent: View | null =
      view.kind === 'page' ? view.back : view.kind === 'home' ? null : { kind: 'home' };
    onLocalBack(parent ? () => setView(parent) : null);
    return () => onLocalBack(null);
  }, [view, onLocalBack]);

  const pageTitle = (p: number) => {
    if (!index) return `${L(lang, 'Стр.', 'Page', 'Sahifa', 'Саҳ.')} ${p}`;
    const s = index.pages[p - 1][2].map(n => surahName(names, lang, index.surahs[n - 1])).join(', ');
    return `${s} · ${L(lang, 'стр.', 'p.', 'sah.', 'саҳ.')} ${p}`;
  };
  const openPage = (p: number, back: View = view.kind === 'page' ? view.back : view) =>
    setView({ kind: 'page', p, nonce: Date.now(), back });

  if (view.kind === 'page') {
    return (
      <QuranPage
        key={view.nonce}
        lang={lang}
        pageNo={view.p}
        title={pageTitle(view.p)}
        onOpenPage={p => openPage(p, view.back)}
        onExit={() => setView(view.back)}
      />
    );
  }

  if (view.kind === 'review') {
    return <ReviewView lang={lang} onDone={() => setView({ kind: 'home' })} />;
  }

  const header = (title: string, back: () => void) => (
    <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
      <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
        <ChevronLeft size={24} />
      </button>
      <h1 className="title-card" style={{ flex: 1 }}>{title}</h1>
    </div>
  );

  if (error || !index) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(L(lang, 'Слова Корана', 'Quran words', 'Qurʼon soʻzlari', 'Калимаҳои Қуръон'), onBack)}
        <div className="page-content">
          {error
            ? <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>{L(lang, 'Нет связи. Попробуйте позже.', 'No connection. Try again later.', 'Aloqa yoʻq. Keyinroq urinib koʻring.', 'Пайваст нест. Баъдтар кӯшиш кунед.')}</p>
            : <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />}
        </div>
      </div>
    );
  }

  if (view.kind === 'list') {
    const pages = Array.from({ length: view.to - view.from + 1 }, (_, i) => view.from + i);
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh' }}>
        {header(view.title, () => setView({ kind: 'home' }))}
        <div className="page-content">
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            {L(lang, 'Один урок = одна страница мусхафа', 'One lesson = one mushaf page', 'Bir dars = mushafning bir sahifasi', 'Як дарс = як саҳифаи мусҳаф')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pages.map(p => (
              <button key={p} className="glass-card" onClick={() => openPage(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', padding: '12px 14px' }}>
                <span className="badge badge--muted text-badge" style={{ minWidth: 38, textAlign: 'center' }}>{p}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-main)' }}>{pageTitle(p)}</span>
                {isPageDone(p) ? <CheckCircle2 size={18} color="var(--accent-teal)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const learned = learnedCount();
  const next = nextPageToLearn();
  const reviewDue = learned >= 10 && Date.now() - lastReview() > REVIEW_EVERY_MS;

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh' }}>
      {header(L(lang, 'Слова Корана', 'Quran words', 'Qurʼon soʻzlari', 'Калимаҳои Қуръон'), onBack)}
      <div className="page-content">
        {/* Продолжить (статистика перенесена на экран «Статистика») */}
        <button className="btn-continue" style={{ marginBottom: 12 }} onClick={() => openPage(next, { kind: 'home' })}>
          <span className="btn-continue__icon"><Play size={16} fill="currentColor" /></span>
          <span className="btn-continue__text">
            <span className="btn-continue__label">
              {pagesDoneCount() ? L(lang, 'Продолжить', 'Continue', 'Davom etish', 'Идома') : L(lang, 'Начать', 'Start', 'Boshlash', 'Оғоз')}
            </span>
            <span className="btn-continue__title">{pageTitle(next)}</span>
          </span>
        </button>

        <QuranSearch lang={lang} index={index} names={names} onActiveChange={setSearching}
          onOpenPage={p => openPage(p, { kind: 'home' })} />

        {!searching && (
          <>
            {reviewDue && (
              <button className="glass-card" onClick={() => setView({ kind: 'review' })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 12 }}>
                <RotateCcw size={22} color="var(--accent)" />
                <div style={{ flex: 1 }}>
                  <div className="title-card">{L(lang, 'Повторение', 'Review', 'Takrorlash', 'Такрор')}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {L(lang, `${REVIEW_SIZE} выученных слов · 1 минута`, `${REVIEW_SIZE} learned words · 1 minute`, `${REVIEW_SIZE} ta oʻrganilgan soʻz · 1 daqiqa`, `${REVIEW_SIZE} калимаи омӯхта · 1 дақиқа`)}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            )}

            {/* Вкладки */}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 12 }}>
              {(['surah', 'juz', 'hizb', 'page'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: tab === t ? 'var(--accent)' : 'transparent', color: tab === t ? 'var(--on-accent)' : 'var(--text-muted)' }}>
                  {t === 'surah' ? L(lang, 'Суры', 'Surahs', 'Suralar', 'Сураҳо')
                    : t === 'juz' ? L(lang, 'Джузы', 'Juz', 'Poralar', 'Пораҳо')
                    : t === 'hizb' ? L(lang, 'Хизбы', 'Hizb', 'Hizblar', 'Ҳизбҳо')
                    : L(lang, 'Страницы', 'Pages', 'Sahifalar', 'Саҳифаҳо')}
                </button>
              ))}
            </div>

            <TabList lang={lang} tab={tab} index={index} names={names}
              onList={(title, from, to) =>
                from === to ? openPage(from, { kind: 'home' }) : setView({ kind: 'list', title, from, to })}
              onPage={p => openPage(p, { kind: 'home' })} />

            <p className="text-muted" style={{ fontSize: 10, marginTop: 20, lineHeight: 1.5 }}>
              {L(lang, 'Источники', 'Sources', 'Manbalar', 'Сарчашмаҳо')}: Quranic Arabic Corpus (corpus.quran.com) · Quran.com · EveryAyah.com · SakinaDevGroup · QuranEnc.com (Rowwad Translation Center; Alauddin Mansour; Saheeh International) · Tafsir as-Sa'di · «السراج في بيان غريب القرآن» — د. محمد الخضيري (shamela.ws)
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TabList({ lang, tab, index, names, onList, onPage }: {
  lang: Lang; tab: Tab; index: QuranIndex; names: SurahNames | null;
  onList: (title: string, from: number, to: number) => void; onPage: (p: number) => void;
}) {
  const rangeDone = (from: number, to: number) => {
    for (let p = from; p <= to; p++) if (!isPageDone(p)) return false;
    return true;
  };
  const row = (key: string | number, badge: string, title: string, sub: string, ar: string | null, from: number, to: number) => (
    <button key={key} className="glass-card" onClick={() => onList(title, from, to)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '12px 14px' }}>
      <span className="surah-medal">{badge}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title-card surah-title-live" style={{ fontSize: 14 }}>{title}</div>
        <div className="text-muted" style={{ fontSize: 11 }}>{sub}</div>
      </div>
      {ar && <span className="quran-ar" dir="rtl" style={{ fontSize: 18, color: 'var(--text-muted)' }}>{ar}</span>}
      {rangeDone(from, to) && <CheckCircle2 size={16} color="var(--accent-teal)" />}
    </button>
  );
  const pg = L(lang, 'стр.', 'p.', 'sah.', 'саҳ.');

  if (tab === 'surah') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {index.surahs.map(s => row(s.n, String(s.n), surahName(names, lang, s),
          `${s.ayahs} ${L(lang, 'аятов', 'ayahs', 'oyat', 'оят')} · ${pg} ${s.pages[0]}–${s.pages[1]}`, s.ar, s.pages[0], s.pages[1]))}
      </div>
    );
  }
  if (tab === 'juz' || tab === 'hizb') {
    const list = tab === 'juz' ? index.juz : index.hizb;
    const label = tab === 'juz' ? L(lang, 'Джуз', 'Juz', 'Pora', 'Пора') : L(lang, 'Хизб', 'Hizb', 'Hizb', 'Ҳизб');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((j, i) => {
          const to = (list[i + 1]?.page ?? TOTAL_PAGES + 1) - 1;
          const first = index.pages[j.page - 1][2][0];
          return row(j.n, String(j.n), `${label} ${j.n}`,
            `${pg} ${j.page}–${to} · ${surahName(names, lang, index.surahs[first - 1])}`, null, j.page, to);
        })}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
      {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPage(p)}
          style={{ padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            border: '1px solid var(--border)', background: isPageDone(p) ? 'var(--accent-tint)' : 'var(--bg-card)',
            color: isPageDone(p) ? 'var(--accent)' : 'var(--text-main)' }}>
          {p}
        </button>
      ))}
    </div>
  );
}

/** Лёгкое повторение: 8 случайных выученных слов. Ошибка — слово снова «не выучено». */
function ReviewView({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const [data, setData] = useState<{ lex: Lexicon; mean: Meanings } | null>(null);
  const ids = useMemo(() => {
    const all = learnedLemmaIds();
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all.slice(0, REVIEW_SIZE);
  }, []);

  useEffect(() => {
    Promise.all([loadLexicon(), loadMeanings(lang)]).then(([lex, mean]) => setData({ lex, mean })).catch(onDone);
  }, [lang, onDone]);

  const distractors = useMemo(() => {
    if (!data) return () => [];
    const pool = data.mean.lemmas.map((m, i) => (m ? i : -1)).filter(i => i >= 0);
    return (_lid: number, answer: string) => {
      const out = new Set<string>();
      for (let g = 0; out.size < 3 && g < 200; g++) {
        const m = data.mean.lemmas[pool[Math.floor(Math.random() * pool.length)]];
        if (m && m !== answer) out.add(m);
      }
      return [...out];
    };
  }, [data]);

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh' }}>
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{L(lang, 'Повторение', 'Review', 'Takrorlash', 'Такрор')}</h1>
      </div>
      <div className="page-content">
        {data && ids.every(i => !data.mean.lemmas[i]) ? (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>
            {L(lang, 'Пока нечего повторять', 'Nothing to review yet', 'Hozircha takrorlash uchun soʻz yoʻq', 'Ҳоло чизе барои такрор нест')}
          </p>
        ) : data && ids.length > 0 ? (
          <QuranQuiz
            lang={lang}
            items={ids.filter(i => data.mean.lemmas[i]).map(i => ({ lid: i, ar: data.lex.lemmas[i][0], answer: data.mean.lemmas[i] }))}
            distractors={distractors}
            onDone={firstOk => {
              setLemmasLearned(ids.filter(i => !firstOk.has(i)), false);
              setLastReview(Date.now());
              reportQuranStats();
              onDone();
            }}
          />
        ) : <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />}
      </div>
    </div>
  );
}

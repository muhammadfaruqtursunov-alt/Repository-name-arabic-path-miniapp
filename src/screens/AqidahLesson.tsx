import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Lang } from '../i18n';
import type { AqidahLesson as AqidahLessonData, AqidahLexEntry } from '../utils/aqidahData';
import { splitArabicForTap } from '../utils/aqidahData';
import { isWordLearned, setWordsLearned, markLessonDone } from '../utils/aqidahProgress';
import type { AqidahBookId } from '../utils/aqidahData';
import AqidahArabicText from '../components/aqidah/AqidahArabicText';
import AqidahWordCard from '../components/aqidah/AqidahWordCard';
import QuranQuiz from '../components/quran/QuranQuiz';
import type { QuizItem } from '../components/quran/QuranQuiz';
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

type Step = 'study' | 'test' | 'result';
interface Card { id: number; entry: AqidahLexEntry }

/** Новые (невыученные) слова урока, в порядке первого появления. */
function buildCards(lesson: AqidahLessonData, lexicon: AqidahLexEntry[], lexIndex: Map<string, number>): Card[] {
  const cards: Card[] = [];
  const seen = new Set<number>();
  for (const pt of lesson.points) {
    for (const part of splitArabicForTap(pt.ar)) {
      if (!part.word) continue;
      const id = lexIndex.get(part.key);
      if (id === undefined || seen.has(id) || isWordLearned(id)) continue;
      seen.add(id);
      cards.push({ id, entry: lexicon[id] });
    }
  }
  return cards;
}

export default function AqidahLesson({ lang, book, lessonIdx, lesson, lexicon, lexIndex, isLast, onExit, onNext }: Props) {
  const [cards] = useState(() => buildCards(lesson, lexicon, lexIndex));
  const [step, setStep] = useState<Step>('study');
  const [idx, setIdx] = useState(0);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [peek, setPeek] = useState<Card | null>(null);
  const [learnedNow, setLearnedNow] = useState<number[]>([]);

  const distractors = useMemo(() => {
    const glosses = lexicon.map(e => e[2]);
    return (_id: number, answer: string) => {
      const out = new Set<string>();
      for (let g = 0; out.size < 3 && g < 200; g++) {
        const m = glosses[Math.floor(Math.random() * glosses.length)];
        if (m && m !== answer) out.add(m);
      }
      return [...out];
    };
  }, [lexicon]);

  function answer(isKnown: boolean) {
    const c = cards[idx];
    setKnown(k => { const n = new Set(k); if (isKnown) n.add(c.id); else n.delete(c.id); return n; });
    if (idx + 1 < cards.length) setIdx(idx + 1);
    else setStep('test');
  }

  function finishTest(firstOk: Set<number>) {
    const learned = cards.map(c => c.id).filter(id => known.has(id) && firstOk.has(id));
    setWordsLearned(learned, true);
    markLessonDone(book, lessonIdx);
    setLearnedNow(learned);
    setStep('result');
  }

  function finishWithoutNewWords() {
    markLessonDone(book, lessonIdx);
    setLearnedNow([]);
    setStep('result');
  }

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{lesson.title_ru}</h1>
      </div>

      <div className="page-content">
        {peek && (
          <div style={{ marginBottom: 16 }}>
            <AqidahWordCard lang={lang} text={peek.entry[1]} meaning={peek.entry[2]} learned={isWordLearned(peek.id)} onClose={() => setPeek(null)} />
          </div>
        )}

        {!peek && step === 'study' && cards.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: 20, marginBottom: 16 }}>
            <CheckCircle2 size={32} color="var(--accent-teal)" />
            <p style={{ margin: '10px 0 14px', fontWeight: 700 }}>
              {L(lang, 'Все слова этого урока уже выучены', 'All words in this lesson are already learned', 'Bu darsning barcha soʻzlari oʻrganilgan', 'Ҳамаи калимаҳои ин дарс омӯхта шудаанд')}
            </p>
            <button className="btn btn-primary" onClick={finishWithoutNewWords}>
              {L(lang, 'Урок пройден', 'Mark lesson as done', 'Dars tugadi', 'Дарс анҷом ёфт')}
            </button>
          </div>
        )}

        {!peek && step === 'study' && cards.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="text-muted" style={{ fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              {L(lang, 'Новое слово', 'New word', 'Yangi soʻz', 'Калимаи нав')} {idx + 1} / {cards.length}
            </div>
            <AqidahWordCard lang={lang} text={cards[idx].entry[1]} meaning={cards[idx].entry[2]} learned={false}
              onKnow={() => answer(true)} onRepeat={() => answer(false)} />
          </div>
        )}

        {!peek && step === 'test' && (
          <div style={{ marginBottom: 16 }}>
            <QuranQuiz
              lang={lang}
              items={cards.map<QuizItem>(c => ({ lid: c.id, ar: c.entry[1], answer: c.entry[2] }))}
              distractors={distractors}
              onDone={finishTest}
            />
          </div>
        )}

        {!peek && step === 'result' && (
          <div className="glass-card" style={{ textAlign: 'center', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 44 }}>🌙</div>
            <h2 className="title-screen" style={{ margin: '6px 0' }}>
              {L(lang, 'Урок пройден', 'Lesson complete', 'Dars tugadi', 'Дарс анҷом ёфт')}
            </h2>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 16 }}>
              {L(lang, 'Выучено слов', 'Words learned', 'Oʻrganilgan soʻzlar', 'Калимаҳои омӯхта')}: <b style={{ color: 'var(--accent-teal)' }}>{learnedNow.length}</b>
              {cards.length - learnedNow.length > 0 && (
                <> · {L(lang, 'повторить позже', 'to review later', 'keyinroq takrorlash', 'баъдтар такрор')}: <b>{cards.length - learnedNow.length}</b></>
              )}
            </p>
            {!isLast && (
              <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={onNext}>
                {L(lang, 'Следующий урок', 'Next lesson', 'Keyingi dars', 'Дарси оянда')} <ChevronRight size={15} />
              </button>
            )}
            {cards.length > 0 && (
              <button className="btn btn-ghost" style={{ marginBottom: 10, gap: 6 }} onClick={onExit}>
                <RotateCcw size={15} /> {L(lang, 'К списку уроков', 'Back to lessons', 'Darslar roʻyxatiga', 'Ба рӯйхати дарсҳо')}
              </button>
            )}
            {cards.length === 0 && (
              <button className="btn btn-ghost" onClick={onExit}>{L(lang, 'К списку', 'Back to list', 'Roʻyxatga', 'Ба рӯйхат')}</button>
            )}
          </div>
        )}

        {/* Полный текст урока — читать и трогать любое слово можно в любой момент */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {lesson.points.map((pt, i) => (
            <div key={i} className="glass-card" style={{ padding: '14px 16px' }}>
              <AqidahArabicText text={pt.ar} lexicon={lexicon} lexIndex={lexIndex} onTapWord={(id, entry) => setPeek({ id, entry })} />
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-main)' }}>{pt.ru}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

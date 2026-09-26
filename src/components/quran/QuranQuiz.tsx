import { useMemo, useState } from 'react';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from './qi18n';

export interface QuizItem {
  lid: number;
  ar: string;                  // что показываем (слово или словарная форма)
  answer: string;              // верное значение
  play?: () => void;
}

interface Props {
  lang: Lang;
  items: QuizItem[];
  distractors: (lid: number, answer: string) => string[];   // 3 неверных значения
  onDone: (firstTryCorrect: Set<number>) => void;
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Выбор из 4 вариантов. Слово с ошибкой возвращается в конец очереди,
 * пока не будет отвечено верно. Наружу — какие слова отвечены с первого раза.
 */
export default function QuranQuiz({ lang, items, distractors, onDone }: Props) {
  const [queue, setQueue] = useState<QuizItem[]>(() => shuffle(items));
  const [firstOk] = useState(() => new Set<number>());
  const [failed] = useState(() => new Set<number>());
  const [picked, setPicked] = useState<string | null>(null);
  const q = queue[0];

  const choices = useMemo(
    () => (q ? shuffle([q.answer, ...distractors(q.lid, q.answer)]) : []),
    [q, distractors],
  );

  if (!q) return null;
  const doneCount = items.length - new Set(queue.map(x => x.lid)).size;

  function choose(c: string) {
    if (picked) return;
    setPicked(c);
    const ok = c === q.answer;
    if (ok && !failed.has(q.lid)) firstOk.add(q.lid);
    if (!ok) failed.add(q.lid);
    setTimeout(() => {
      setPicked(null);
      const rest = queue.slice(1);
      const next = ok ? rest : [...rest, q];
      if (next.length === 0) onDone(firstOk);
      else setQueue(next);
    }, ok ? 650 : 1300);
  }

  return (
    <div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${(doneCount / items.length) * 100}%`, background: 'var(--accent-teal)', borderRadius: 2, transition: 'width .3s' }} />
      </div>
      <div className="glass-card" style={{ textAlign: 'center', padding: '22px 16px', marginBottom: 14 }}>
        <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
          {L(lang, 'Что означает слово?', 'What does the word mean?', 'Soʻz nimani anglatadi?', 'Калима чӣ маъно дорад?')}
        </div>
        <div className="quran-ar" dir="rtl" style={{ fontSize: 40, lineHeight: 1.7 }}>{q.ar}</div>
        {q.play && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, gap: 6 }} onClick={q.play}>
            <Volume2 size={14} /> {L(lang, 'Послушать', 'Listen', 'Tinglash', 'Гӯш кардан')}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {choices.map(c => {
          const isAnswer = c === q.answer;
          const state = !picked ? '' : isAnswer ? 'ok' : c === picked ? 'bad' : '';
          return (
            <button
              key={c}
              className="btn btn-ghost"
              onClick={() => choose(c)}
              style={{
                justifyContent: 'space-between', textAlign: 'left', minHeight: 50,
                borderColor: state === 'ok' ? 'var(--accent-teal)' : state === 'bad' ? 'var(--danger)' : undefined,
                background: state === 'ok' ? 'rgba(45,212,160,0.12)' : state === 'bad' ? 'rgba(192,57,43,0.12)' : undefined,
              }}
            >
              <span>{c}</span>
              {state === 'ok' && <CheckCircle2 size={18} color="var(--accent-teal)" />}
              {state === 'bad' && <XCircle size={18} color="var(--danger)" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

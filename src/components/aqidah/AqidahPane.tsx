import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { AqidahPoint, AqidahLexEntry } from '../../utils/aqidahData';
import { splitArabicForTap } from '../../utils/aqidahData';

export interface AqidahWordRef { pi: number; id: number }

interface Props {
  points: AqidahPoint[];
  activeIdx: number;
  activeWordId: number | null;
  lexicon: AqidahLexEntry[];
  lexIndex: Map<string, number>;
  onTapPoint: (pi: number) => void;
  onTapWord: (ref: AqidahWordRef, entry: AqidahLexEntry) => void;
  /** Режим «читаю — перевод идёт за серединой»: активным становится пункт, ближайший к центру при прокрутке. */
  followScroll?: boolean;
  onCenterChange?: (pi: number) => void;
  style?: CSSProperties;
}

/** [сура: аят] и подобные адреса в тексте — не часть матна, а ссылка на источник. Показываем их отдельным «бейджем». */
const CITATION_RE = /\[[^\]]*\]/g;

function renderPointText(
  text: string, pi: number, activeIdx: number, activeWordId: number | null,
  lexicon: AqidahLexEntry[], lexIndex: Map<string, number>,
  onTapWord: (ref: AqidahWordRef, entry: AqidahLexEntry) => void,
) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  CITATION_RE.lastIndex = 0;
  const pushWords = (chunk: string) => {
    for (const part of splitArabicForTap(chunk)) {
      if (!part.word) { out.push(<span key={key++}>{part.text}</span>); continue; }
      const id = lexIndex.get(part.key);
      if (id === undefined) { out.push(<span key={key++}>{part.text}</span>); continue; }
      const isFocus = pi === activeIdx && activeWordId === id;
      out.push(
        <span key={key++} className={isFocus ? 'qw qw--focus' : 'qw'}
          onClick={e => { e.stopPropagation(); onTapWord({ pi, id }, lexicon[id]); }}>
          {part.text}
        </span>,
      );
    }
  };
  while ((m = CITATION_RE.exec(text))) {
    if (m.index > last) pushWords(text.slice(last, m.index));
    out.push(<span key={key++} className="qw-ayah">{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) pushWords(text.slice(last));
  return out;
}

/**
 * Пункты урока — прокручиваются как титры, точь-в-точь как в Коране:
 * активный пункт яркий, соседние постепенно бледнеют, снизу и сверху
 * плавное растворение (mask-градиент от .quran-pane).
 */
export default function AqidahPane({ points, activeIdx, activeWordId, lexicon, lexIndex, onTapPoint, onTapWord, followScroll, onCenterChange, style }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);

  useEffect(() => {
    if (followScroll) return;
    const el = boxRef.current?.querySelector<HTMLElement>(`[data-pt="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIdx, followScroll]);

  function handleScroll() {
    const box = boxRef.current;
    if (!followScroll || !onCenterChange || !box || Date.now() < lockUntil.current) return;
    const r = box.getBoundingClientRect();
    const mid = r.top + r.height / 2;
    let best = -1;
    let bestD = Infinity;
    box.querySelectorAll<HTMLElement>('[data-pt]').forEach(el => {
      const b = el.getBoundingClientRect();
      const d = Math.abs(b.top + b.height / 2 - mid);
      if (d < bestD) { bestD = d; best = Number(el.dataset.pt); }
    });
    if (best >= 0 && best !== activeIdx) onCenterChange(best);
  }

  function tapPoint(pi: number) {
    if (followScroll) {
      lockUntil.current = Date.now() + 700;
      boxRef.current?.querySelector<HTMLElement>(`[data-pt="${pi}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    onTapPoint(pi);
  }

  return (
    <div ref={boxRef} className="quran-pane" dir="rtl" onScroll={handleScroll}
      style={followScroll ? { paddingTop: '16vh', paddingBottom: '16vh', ...style } : style}>
      {points.map((pt, pi) => {
        const dist = Math.abs(pi - activeIdx);
        return (
          <p
            key={pi}
            data-pt={pi}
            className="quran-ar quran-ayah"
            style={{ opacity: dist === 0 ? 1 : dist === 1 ? 0.55 : 0.28, color: 'var(--text-main)' }}
            onClick={() => tapPoint(pi)}
          >
            {renderPointText(pt.ar, pi, activeIdx, activeWordId, lexicon, lexIndex, onTapWord)}
          </p>
        );
      })}
    </div>
  );
}

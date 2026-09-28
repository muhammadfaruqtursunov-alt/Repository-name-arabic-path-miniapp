import { splitArabicForTap } from '../../utils/aqidahData';
import type { AqidahLexEntry } from '../../utils/aqidahData';

interface Props {
  text: string;
  lexIndex: Map<string, number>;
  onTapWord: (id: number, entry: AqidahLexEntry) => void;
  lexicon: AqidahLexEntry[];
}

interface Chunk { text: string; id?: number }

/**
 * Захватывает один пробел после слова в ту же кликабельную зону — иначе между
 * словами остаётся «мёртвая полоса», в которую легко промахнуться пальцем.
 */
function buildChunks(text: string, lexIndex: Map<string, number>): Chunk[] {
  const parts = splitArabicForTap(text);
  const chunks: Chunk[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.word) { chunks.push({ text: part.text }); continue; }
    const id = lexIndex.get(part.key);
    if (id === undefined) { chunks.push({ text: part.text }); continue; }
    const next = parts[i + 1];
    const hasSpace = next && !next.word && next.text.startsWith(' ');
    chunks.push({ text: part.text + (hasSpace ? ' ' : ''), id });
    if (hasSpace) { parts[i + 1] = { word: false, text: next!.text.slice(1) }; }
  }
  return chunks;
}

export default function AqidahArabicText({ text, lexIndex, onTapWord, lexicon }: Props) {
  const chunks = buildChunks(text, lexIndex);
  return (
    <p dir="rtl" lang="ar" className="quran-ar" style={{ fontSize: 19, lineHeight: 2.3, marginBottom: 10, color: 'var(--arabic-color, var(--text-main))' }}>
      {chunks.map((c, i) => c.id === undefined ? (
        <span key={i}>{c.text}</span>
      ) : (
        <span
          key={i}
          onClick={() => onTapWord(c.id!, lexicon[c.id!])}
          style={{ cursor: 'pointer', padding: '6px 0', borderBottom: '2px dotted var(--accent-border)' }}
        >
          {c.text}
        </span>
      ))}
    </p>
  );
}

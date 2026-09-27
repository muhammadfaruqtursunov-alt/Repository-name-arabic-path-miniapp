import { splitArabicForTap } from '../../utils/aqidahData';
import { isWordLearned } from '../../utils/aqidahProgress';
import type { AqidahLexEntry } from '../../utils/aqidahData';

interface Props {
  text: string;
  lexIndex: Map<string, number>;
  onTapWord: (id: number, entry: AqidahLexEntry) => void;
  lexicon: AqidahLexEntry[];
}

/** Арабский текст пункта с тап-по-слову: известные словарю слова подсвечены и кликабельны. */
export default function AqidahArabicText({ text, lexIndex, onTapWord, lexicon }: Props) {
  const parts = splitArabicForTap(text);
  return (
    <p dir="rtl" lang="ar" className="quran-ar" style={{ fontSize: 19, lineHeight: 2, marginBottom: 10, color: 'var(--arabic-color, var(--text-main))' }}>
      {parts.map((part, i) => {
        if (!part.word) return <span key={i}>{part.text}</span>;
        const id = lexIndex.get(part.key);
        if (id === undefined) return <span key={i}>{part.text}</span>;
        const learned = isWordLearned(id);
        return (
          <span
            key={i}
            onClick={() => onTapWord(id, lexicon[id])}
            style={{
              cursor: 'pointer',
              borderBottom: learned ? '2px solid var(--accent-teal)' : '2px dotted var(--accent-border)',
              paddingBottom: 1,
            }}
          >
            {part.text}
          </span>
        );
      })}
    </p>
  );
}

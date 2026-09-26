import { useEffect, useRef } from 'react';
import type { QuranPageData } from '../../utils/quranData';
import { parseKey } from '../../utils/quranData';
import { isLemmaLearned } from '../../utils/quranProgress';

export interface WordRef { fi: number; wi: number }   // индекс фрагмента и слова на странице

interface Props {
  page: QuranPageData;
  focus: WordRef | null;          // текущее слово урока
  newLemmas: Set<number>;         // новые слова этой страницы
  playingFrag: number | null;     // аят, который сейчас читает чтец
  onTapWord: (ref: WordRef) => void;
}

const toArabicDigits = (n: number) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

/**
 * Аяты страницы — прокручиваются вверх/вниз как титры: текущий аят яркий,
 * соседние постепенно бледнеют. Текущее слово подсвечено, выученные — серые.
 */
export default function AyahPane({ page, focus, newLemmas, playingFrag, onTapWord }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const activeFrag = playingFrag ?? focus?.fi ?? 0;

  useEffect(() => {
    const el = boxRef.current?.querySelector<HTMLElement>(`[data-frag="${activeFrag}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeFrag, page.p]);

  return (
    <div ref={boxRef} className="quran-pane" dir="rtl">
      {page.a.map((fr, fi) => {
        const dist = Math.abs(fi - activeFrag);
        const [, ayah] = parseKey(fr.k);
        return (
          <p
            key={fr.k + fi}
            data-frag={fi}
            className="quran-ar quran-ayah"
            style={{ opacity: dist === 0 ? 1 : dist === 1 ? 0.55 : 0.28 }}
          >
            {fr.w.map((w, wi) => {
              const isFocus = focus?.fi === fi && focus?.wi === wi;
              const learned = isLemmaLearned(w[1]);
              const cls = isFocus ? 'qw qw--focus' : learned ? 'qw qw--learned' : newLemmas.has(w[1]) ? 'qw qw--new' : 'qw';
              return (
                <span key={wi} className={cls} onClick={() => onTapWord({ fi, wi })}>
                  {w[0]}{' '}
                </span>
              );
            })}
            <span className="qw-ayah">﴿{toArabicDigits(ayah)}﴾</span>
          </p>
        );
      })}
    </div>
  );
}

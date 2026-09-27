import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from './qi18n';
import { loadSearchIndex, surahName } from '../../utils/quranData';
import type { QuranIndex, SurahNames, SearchIndex } from '../../utils/quranData';

interface Props {
  lang: Lang;
  index: QuranIndex;
  names: SurahNames | null;
  onOpenPage: (p: number) => void;
  onActiveChange?: (active: boolean) => void;
}

const MAX_AYAH_RESULTS = 25;
const AYAH_REF = /^(\d{1,3})\s*[:.]\s*(\d{1,3})$/;

/** Подсвечивает первое вхождение запроса в тексте. */
function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: 'var(--accent-tint)', color: 'var(--accent)', borderRadius: 3 }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** Живой поиск по сурам и аятам Корана — без кнопки, результаты по мере ввода. */
export default function QuranSearch({ lang, index, names, onOpenPage, onActiveChange }: Props) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setSearchIndex(null); }, [lang]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const ensureIndex = () => {
    if (searchIndex || loading) return;
    setLoading(true);
    loadSearchIndex(lang).then(setSearchIndex).finally(() => setLoading(false));
  };

  const active = debounced.length > 0;
  useEffect(() => { onActiveChange?.(active); }, [active, onActiveChange]);

  const surahMatches = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return index.surahs.filter(s =>
      surahName(names, lang, s).toLowerCase().includes(q) ||
      s.en.toLowerCase().includes(q) ||
      s.ar.includes(debounced) ||
      String(s.n) === q
    ).slice(0, 8);
  }, [debounced, index, names, lang]);

  const directRef = useMemo(() => {
    const m = debounced.match(AYAH_REF);
    if (!m || !searchIndex) return null;
    const key = `${m[1]}:${m[2]}`;
    const hit = searchIndex[key];
    return hit ? { key, page: hit[0], text: hit[1] } : null;
  }, [debounced, searchIndex]);

  const ayahMatches = useMemo(() => {
    if (debounced.length < 2 || !searchIndex) return [];
    const q = debounced.toLowerCase();
    const out: { key: string; page: number; text: string }[] = [];
    for (const key in searchIndex) {
      if (key === directRef?.key) continue;
      const [page, text] = searchIndex[key];
      if (text.toLowerCase().includes(q)) {
        out.push({ key, page, text });
        if (out.length >= MAX_AYAH_RESULTS) break;
      }
    }
    return out;
  }, [debounced, searchIndex, directRef]);

  const nothingFound = active && !loading && surahMatches.length === 0 && !directRef && ayahMatches.length === 0 && debounced.length >= 2;

  return (
    <div style={{ marginBottom: active ? 12 : 16 }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          value={query}
          onFocus={ensureIndex}
          onChange={e => { setQuery(e.target.value); ensureIndex(); }}
          placeholder={L(lang, 'Поиск по Корану — сура или слово из аята…', 'Search the Quran — a surah or a word from an ayah…', 'Qurʼon boʻyicha qidiruv — sura yoki oyatdan soʻz…', 'Ҷустуҷӯ дар Қуръон — сура ё калима аз оят…')}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: 14 }}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {active && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading && <div className="skeleton" style={{ height: 60, borderRadius: 14 }} />}

          {surahMatches.length > 0 && (
            <>
              <div className="text-muted" style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                {L(lang, 'СУРЫ', 'SURAHS', 'SURALAR', 'СУРАҲО')}
              </div>
              {surahMatches.map(s => (
                <button key={s.n} className="glass-card" onClick={() => onOpenPage(s.pages[0])}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 14px' }}>
                  <span className="surah-medal" style={{ width: 28, height: 28, fontSize: 11 }}>{s.n}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{surahName(names, lang, s)}</span>
                  <span className="quran-ar" dir="rtl" style={{ fontSize: 15, color: 'var(--text-muted)' }}>{s.ar}</span>
                </button>
              ))}
            </>
          )}

          {directRef && (
            <>
              <div className="text-muted" style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                {L(lang, 'АЯТ', 'AYAH', 'OYAT', 'ОЯТ')}
              </div>
              <button className="glass-card" onClick={() => onOpenPage(directRef.page)}
                style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 14px' }}>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{directRef.key}</span>
                <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{directRef.text}</span>
              </button>
            </>
          )}

          {ayahMatches.length > 0 && (
            <>
              <div className="text-muted" style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                {L(lang, 'АЯТЫ', 'AYAHS', 'OYATLAR', 'ОЯТҲО')}
              </div>
              {ayahMatches.map(m => (
                <button key={m.key} className="glass-card" onClick={() => onOpenPage(m.page)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{m.key}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>{highlight(m.text, debounced)}</span>
                </button>
              ))}
            </>
          )}

          {nothingFound && (
            <p className="text-muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 12 }}>
              {L(lang, 'Ничего не найдено', 'Nothing found', 'Hech narsa topilmadi', 'Чизе ёфт нашуд')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

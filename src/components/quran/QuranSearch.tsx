import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Lang } from '../../i18n';
import { L } from './qi18n';
import { loadArabicSearchIndex, loadSearchIndex, surahName } from '../../utils/quranData';
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
const HAS_ARABIC = /[؀-ۿ]/;

/** Снимает огласовки и приводит частые варианты букв к одной форме — чтобы
 * поиск находил слово, даже если набрано без ташкиля или с «упрощённым» алифом. */
function normalizeArabic(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]/g, '')
    .replace(/ـ/g, '') // ـ ташдид/кашида (тавиль) — символ растяжения, не буква
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

const SOURCE_LABEL: Record<'ar' | 'ru' | 'tj' | 'uz', string> = { ar: 'AR', ru: 'RU', tj: 'TJ', uz: 'UZ' };

/** Подсвечивает первое вхождение запроса в тексте (не для арабского — там огласовки сдвигают позиции). */
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

type Sources = Partial<Record<'ar' | 'ru' | 'tj' | 'uz', SearchIndex>>;

/** Живой поиск по сурам и аятам Корана (арабский текст + ru/tj/uz переводы) — без кнопки, по мере ввода. */
export default function QuranSearch({ lang, index, names, onOpenPage, onActiveChange }: Props) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sources, setSources] = useState<Sources>({});
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const ensureIndex = () => {
    if (Object.keys(sources).length > 0 || loading) return;
    setLoading(true);
    Promise.all([loadArabicSearchIndex(), loadSearchIndex('ru'), loadSearchIndex('tj'), loadSearchIndex('uz')])
      .then(([ar, ru, tj, uz]) => setSources({ ar, ru, tj, uz }))
      .finally(() => setLoading(false));
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
    if (!m) return null;
    const key = `${m[1]}:${m[2]}`;
    const hit = sources.ru?.[key] ?? sources.ar?.[key];
    return hit ? { key, page: hit[0] } : null;
  }, [debounced, sources]);

  const ayahMatches = useMemo(() => {
    if (debounced.length < 2 || Object.keys(sources).length === 0) return [];
    const isArabic = HAS_ARABIC.test(debounced);
    const qArabic = isArabic ? normalizeArabic(debounced) : '';
    const qText = debounced.toLowerCase();

    const merged = new Map<string, { page: number; hits: { src: 'ar' | 'ru' | 'tj' | 'uz'; text: string }[] }>();
    const addHit = (src: 'ar' | 'ru' | 'tj' | 'uz', si: SearchIndex | undefined, matches: (text: string) => boolean) => {
      if (!si) return;
      for (const key in si) {
        if (key === directRef?.key) continue;
        const [page, text] = si[key];
        if (!matches(text)) continue;
        const entry = merged.get(key) ?? { page, hits: [] };
        entry.hits.push({ src, text });
        merged.set(key, entry);
      }
    };

    if (isArabic) {
      addHit('ar', sources.ar, t => normalizeArabic(t).includes(qArabic));
    } else {
      addHit('ru', sources.ru, t => t.toLowerCase().includes(qText));
      addHit('tj', sources.tj, t => t.toLowerCase().includes(qText));
      addHit('uz', sources.uz, t => t.toLowerCase().includes(qText));
    }
    return Array.from(merged.entries()).slice(0, MAX_AYAH_RESULTS).map(([key, v]) => ({ key, ...v }));
  }, [debounced, sources, directRef]);

  const nothingFound = active && !loading && surahMatches.length === 0 && !directRef && ayahMatches.length === 0 && debounced.length >= 2;

  return (
    <div style={{ marginBottom: active ? 12 : 16 }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          value={query}
          onFocus={ensureIndex}
          onChange={e => { setQuery(e.target.value); ensureIndex(); }}
          dir="auto"
          placeholder={L(lang, 'Поиск по Корану — сура, аят или слово…', 'Search the Quran — a surah, ayah or word…', 'Qurʼon boʻyicha qidiruv — sura, oyat yoki soʻz…', 'Ҷустуҷӯ дар Қуръон — сура, оят ё калима…')}
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
                {sources.ru?.[directRef.key] && <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{sources.ru[directRef.key][1]}</span>}
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
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{m.key}</span>
                  {m.hits.map((h, i) => (
                    <span key={i} style={{ display: 'flex', gap: 6, alignItems: h.src === 'ar' ? 'flex-start' : 'baseline' }}>
                      <span className="badge badge--gold text-badge" style={{ fontSize: 9, padding: '1px 6px', flexShrink: 0 }}>
                        {SOURCE_LABEL[h.src]}
                      </span>
                      {h.src === 'ar' ? (
                        <span className="quran-ar" dir="rtl" style={{ fontSize: 16, lineHeight: 1.7, textAlign: 'right', flex: 1 }}>{h.text}</span>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>{highlight(h.text, debounced)}</span>
                      )}
                    </span>
                  ))}
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

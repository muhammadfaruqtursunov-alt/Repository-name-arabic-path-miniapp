// Общие визуальные элементы для раздела Са́рф: арабские формы, таблицы تصريف,
// диаграмма ميزان, дерево производных, полный تصريف глагола.
import { useState } from 'react';
import { Volume2, ChevronDown, ArrowLeft } from 'lucide-react';
import { speakArabic } from '../utils/speak';
import type { TasrifCategory } from '../utils/sarfConjugator';
import { verbForms } from '../data/sarfVerbs';
import type { SarfVerb } from '../data/sarfVerbs';

// ── Арабская форма (крупная, жирная, золотая) + озвучка ─────────────────────
export function ArabicForm({
  text, size = 'md', speak = true,
}: { text: string; size?: 'xl' | 'lg' | 'md'; speak?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className={`sarf-ar sarf-ar--${size}`}>{text}</span>
      {speak && (
        <button
          onClick={(e) => { e.stopPropagation(); speakArabic(text); }}
          style={{
            background: 'rgba(192,150,60,0.12)', border: '1px solid rgba(192,150,60,0.30)',
            borderRadius: 9, padding: '4px 6px', cursor: 'pointer',
            color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
        >
          <Volume2 size={13} />
        </button>
      )}
    </span>
  );
}

// ── Мультиязычные подписи панели разбора ──────────────────────────
type SLangB = 'ru' | 'en' | 'uz' | 'tj';
function slangB(lang: string): SLangB { return (lang === 'ar' ? 'ru' : lang) as SLangB; }
function ttB(lang: string, m: Record<SLangB, string>): string { return m[slangB(lang)] ?? m.ru; }

const PANEL_T = {
  category: { ru: 'Категория', en: 'Category', uz: 'Turkum', tj: 'Гурӯҳ' },
  number:   { ru: 'Число',     en: 'Number',   uz: 'Son',    tj: 'Шумора' },
  gender:   { ru: 'Род',       en: 'Gender',   uz: 'Jins',   tj: 'Ҷинс' },
  person:   { ru: 'Лицо',      en: 'Person',   uz: 'Shaxs',  tj: 'Шахс' },
  who:      { ru: 'Кто/что',   en: 'Who',      uz: 'Kim',    tj: 'Кӣ' },
};
const NUM_T: Record<'sg' | 'du' | 'pl', Record<SLangB, string>> = {
  sg: { ru: 'единственное — один', en: 'singular — one', uz: 'birlik — bitta', tj: 'танҳо — як' },
  du: { ru: 'двойственное — двое', en: 'dual — two', uz: 'ikkilik — ikkita', tj: 'дугона — ду' },
  pl: { ru: 'множественное — трое и больше', en: 'plural — three or more', uz: 'koʻplik — uch va undan koʻp', tj: 'ҷамъ — се ва зиёдтар' },
};
const GEN_T: Record<'m' | 'f', Record<SLangB, string>> = {
  m: { ru: 'мужской', en: 'masculine', uz: 'erkak', tj: 'мардона' },
  f: { ru: 'женский', en: 'feminine', uz: 'ayol', tj: 'занона' },
};
const PERSON_T: Record<'1' | '2' | '3', Record<SLangB, string>> = {
  '1': { ru: '1-е — кто говорит', en: '1st — the speaker', uz: '1-shaxs — soʻzlovchi', tj: '1-шахс — гӯянда' },
  '2': { ru: '2-е — к кому обращаются', en: '2nd — the addressee', uz: '2-shaxs — tinglovchi', tj: '2-шахс — мухотаб' },
  '3': { ru: '3-е — о ком говорят', en: '3rd — the one talked about', uz: '3-shaxs — gʻoyib', tj: '3-шахс — ғоиб' },
};

function pronounOf(lang: string, p?: '1' | '2' | '3', num?: 'sg' | 'du' | 'pl', gen?: 'm' | 'f'): string | undefined {
  if (!p) return undefined;
  const L = slangB(lang);
  const pick = (r: string, e: string, u: string, t: string) => ({ ru: r, en: e, uz: u, tj: t }[L]);
  if (p === '1') return num === 'pl' ? pick('мы', 'we', 'biz', 'мо') : pick('я', 'I', 'men', 'ман');
  if (p === '2') {
    if (num === 'du') return pick('вы двое', 'you two', 'ikkovingiz', 'шумо ду');
    if (num === 'pl') return gen === 'f' ? pick('вы (ж.)', 'you (f.)', 'sizlar (ayol)', 'шумо (зан)') : pick('вы (м.)', 'you (m.)', 'sizlar (erkak)', 'шумо (мард)');
    return gen === 'f' ? pick('ты (ж.)', 'you (f.)', 'sen (ayol)', 'ту (зан)') : pick('ты (м.)', 'you (m.)', 'sen (erkak)', 'ту (мард)');
  }
  if (num === 'du') return pick('они вдвоём', 'they two', 'ikkovi', 'онҳо ду');
  if (num === 'pl') return gen === 'f' ? pick('они (ж.)', 'they (f.)', 'ular (ayol)', 'онҳо (зан)') : pick('они (м.)', 'they (m.)', 'ular (erkak)', 'онҳо (мард)');
  return gen === 'f' ? pick('она', 'she', 'u (ayol)', 'ӯ (зан)') : pick('он', 'he', 'u (erkak)', 'ӯ (мард)');
}

// Разбор краткой ru-метки → структурные коды (число/род/лицо).
function explainLabel(ru: string): { num?: 'sg' | 'du' | 'pl'; gen?: 'm' | 'f'; person?: '1' | '2' | '3' } {
  let num: 'sg' | 'du' | 'pl' | undefined;
  if (/мн\./.test(ru)) num = 'pl';
  else if (/дв\./.test(ru)) num = 'du';
  else if (/ед\./.test(ru)) num = 'sg';
  let gen: 'm' | 'f' | undefined;
  if (/ж\.\s*р|жен/i.test(ru) || /\bж\./.test(ru)) gen = 'f';
  else if (/м\.\s*р|муж/i.test(ru) || /\bм\./.test(ru)) gen = 'm';
  let person: '1' | '2' | '3' | undefined;
  if (/3-?е/.test(ru)) person = '3';
  else if (/2-?е/.test(ru)) person = '2';
  else if (/1-?е/.test(ru)) person = '1';
  return { num, gen, person };
}

// Один разбор (صيغة). Тап по строке → полное объяснение.
// Кнопка 🔊 внутри ArabicForm делает stopPropagation, поэтому НЕ конфликтует.
export function SarfFormRow({
  ar, tr, labelRu, labelAr, labelParse, catRu, catAr, catGloss, delay = 0, lang = 'ru',
}: {
  ar: string; tr?: string; labelRu: string; labelAr?: string; labelParse?: string;
  catRu?: string; catAr?: string; catGloss?: string; delay?: number; lang?: string;
}) {
  const [open, setOpen] = useState(false);
  const ex = explainLabel(labelParse ?? labelRu);
  const pron = pronounOf(lang, ex.person, ex.num, ex.gen);
  return (
    <div className="sarf-row" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="sarf-form-row"
        style={{ cursor: 'pointer' }}
        role="button"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="label">
          {tr && <span className="ar" style={{ direction: 'ltr', fontStyle: 'italic' }}>{tr}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArabicForm text={ar} size="md" />
          <ChevronDown
            size={15}
            color="var(--text-muted)"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
          />
        </div>
      </div>

      {open && (
        <div
          style={{
            margin: '6px 0 2px', padding: '12px 14px', borderRadius: 12,
            background: 'rgba(192,150,60,0.07)', border: '1px solid var(--accent-border)',
            fontSize: 13, lineHeight: 1.65,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="sarf-ar" style={{ fontSize: 24 }}>{ar}</span>
            {tr && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{tr}</span>}
          </div>
          {(catRu || catAr) && (
            <div style={{ marginBottom: 8 }}>
              <b style={{ color: 'var(--accent-gold)' }}>{ttB(lang, PANEL_T.category)}:</b>{' '}
              {catRu}{catAr ? ` (${catAr})` : ''}{catGloss ? ` — «${catGloss}»` : ''}
            </div>
          )}
          <div style={{ color: 'var(--text-main)' }}>
            {ex.num && <div>• {ttB(lang, PANEL_T.number)}: {NUM_T[ex.num][slangB(lang)]}</div>}
            {ex.gen && <div>• {ttB(lang, PANEL_T.gender)}: {GEN_T[ex.gen][slangB(lang)]}</div>}
            {ex.person && <div>• {ttB(lang, PANEL_T.person)}: {PERSON_T[ex.person][slangB(lang)]}</div>}
            {pron && <div>• {ttB(lang, PANEL_T.who)}: <b style={{ color: 'var(--accent-gold)' }}>{pron}</b></div>}
            {labelAr && <div style={{ direction: 'rtl', textAlign: 'right', marginTop: 4, color: 'var(--text-muted)' }}>{labelAr}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Таблица تصريف (одна категория: 14 / 8 / 6 / 3 формы) ─────────────────────
export function FormsTable({ cat, lang = 'ru' }: { cat: TasrifCategory; lang?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {cat.forms.map((form, i) => (
        <SarfFormRow
          key={i}
          ar={form}
          labelRu={cat.labels[i]?.ru ?? ''}
          labelAr={cat.labels[i]?.ar}
          catRu={cat.ru}
          catAr={cat.ar}
          catGloss={cat.gloss}
          lang={lang}
          delay={i * 35}
        />
      ))}
    </div>
  );
}

// ── Свёртываемая секция ─────────────────────────────────────────────────────
export function Collapse({
  title, subtitle, defaultOpen = false, children,
}: { title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-main)', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, direction: 'rtl', textAlign: 'right' }}>{subtitle}</div>}
        </div>
        <ChevronDown
          size={18} color="var(--text-muted)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </button>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  );
}

// ── Диаграмма ميزان: слово ↔ فعل (с анимированными стрелками) ────────────────
export function MizanDiagram({ root, lang = 'ru' }: { root: [string, string, string]; lang?: string }) {
  const mizan = ['ف', 'ع', 'ل'];
  const capT = {
    ru: 'Каждую коренную сопоставляют с', en: 'Each root letter maps to',
    uz: 'Har bir oʻzak harfi mos keladi:', tj: 'Ҳар ҳарфи реша мувофиқ мешавад бо',
  };
  // В арабском пишем справа налево: первая коренная — справа.
  const cols = [0, 1, 2];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      {/* слово (корень) */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 10 }}>
        {cols.map((c) => (
          <div key={c} className="sarf-letter sarf-glow" style={{ animationDelay: `${c * 200}ms` }}>{root[c]}</div>
        ))}
      </div>
      {/* стрелки вниз */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 10 }}>
        {cols.map((c) => (
          <div key={c} style={{ width: 54, textAlign: 'center', color: 'var(--accent-gold)', fontSize: 18, transform: 'rotate(90deg)' }}>
            <span className="sarf-arrow" style={{ display: 'inline-block', animationDelay: `${c * 200}ms` }}>‹</span>
          </div>
        ))}
      </div>
      {/* ميزان */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 10 }}>
        {cols.map((c) => (
          <div key={c} className="sarf-letter sarf-letter--mizan">{mizan[c]}</div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
        {ttB(lang, capT)} <b style={{ color: 'var(--accent-gold)' }}>ف</b> · <b style={{ color: 'var(--accent-gold)' }}>ع</b> · <b style={{ color: 'var(--accent-gold)' }}>ل</b>
      </div>
    </div>
  );
}

// ── Стрелка «مصدر → производное» для урока деривации ─────────────────────────
export function IshtiqaqArrow({
  fromAr, fromRu, toAr, toRu,
}: { fromAr: string; fromRu: string; toAr: string; toRu: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="sarf-ar sarf-ar--md">{fromAr}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fromRu}</div>
      </div>
      <ArrowLeft size={26} className="sarf-arrow" />
      <div style={{ textAlign: 'center' }}>
        <div className="sarf-ar sarf-ar--lg">{toAr}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{toRu}</div>
      </div>
    </div>
  );
}

// ── Полный تصريف глагола (аккордеон по всем категориям) ──────────────────────
export function FullTasrif({ verb, lang = 'ru' }: { verb: SarfVerb; lang?: string }) {
  const r = verbForms(verb);
  const fullT = { ru: 'Полный تصريف', en: 'Full tasrif', uz: 'Toʻliq tasrif', tj: 'Тасрифи пурра' };
  return (
    <div>
      {/* шапка глагола */}
      <div className="glass-card glass-card--gold" style={{ textAlign: 'center', marginBottom: 14, padding: '18px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          {ttB(lang, fullT)} · {verb.ru}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <ArabicForm text={r.madi} size="lg" />
          <ArabicForm text={r.mudari} size="lg" />
        </div>
      </div>
      {r.categories.map((cat, i) => (
        <Collapse
          key={cat.key}
          title={cat.ru}
          subtitle={cat.ar}
          defaultOpen={i < 1}
        >
          <FormsTable cat={cat} lang={lang} />
        </Collapse>
      ))}
    </div>
  );
}

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

// ── Таблица تصريف (одна категория: 14 / 8 / 6 / 3 формы) ─────────────────────
export function FormsTable({ cat }: { cat: TasrifCategory }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {cat.forms.map((form, i) => (
        <div
          key={i}
          className="sarf-form-row sarf-row"
          style={{ animationDelay: `${i * 35}ms` }}
        >
          <div className="label">
            {cat.labels[i]?.ru}
            <span className="ar">{cat.labels[i]?.ar}</span>
          </div>
          <ArabicForm text={form} size="md" />
        </div>
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
export function MizanDiagram({ root }: { root: [string, string, string] }) {
  const mizan = ['ف', 'ع', 'ل'];
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
        Каждую коренную сопоставляют с <b style={{ color: 'var(--accent-gold)' }}>ف</b> · <b style={{ color: 'var(--accent-gold)' }}>ع</b> · <b style={{ color: 'var(--accent-gold)' }}>ل</b>
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
export function FullTasrif({ verb }: { verb: SarfVerb }) {
  const r = verbForms(verb);
  return (
    <div>
      {/* шапка глагола */}
      <div className="glass-card glass-card--gold" style={{ textAlign: 'center', marginBottom: 14, padding: '18px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Полный تصريف · {verb.ru}
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
          <FormsTable cat={cat} />
        </Collapse>
      ))}
    </div>
  );
}

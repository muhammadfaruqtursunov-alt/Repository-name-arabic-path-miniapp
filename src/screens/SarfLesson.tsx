import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, CheckCircle2, Volume2 } from 'lucide-react';
import type { Lang } from '../i18n';
import { useSwipe } from '../hooks/useSwipe';
import { speakArabic } from '../utils/speak';
import { sarfSections, sarfText } from '../data/sarfData';
import type { SarfSection, SarfTheory, SarfParadigm } from '../data/sarfData';
import { ArabicForm, MizanDiagram, FullTasrif } from '../components/SarfBits';
import { GROUP2 } from '../data/sarfVerbs';

interface Props {
  lang: Lang;
  sectionIndex: number;
  isLast: boolean;
  onBack: () => void;
  onNextLesson: () => void;
}

type SLang = Exclude<Lang, 'ar'>;
function L(lang: Lang, ru: string, en?: string, uz?: string, tj?: string): string {
  const l = (lang === 'ar' ? 'ru' : lang) as SLang;
  return ({ ru, en: en ?? ru, uz: uz ?? ru, tj: tj ?? ru } as Record<SLang, string>)[l];
}

// Шаги урока — дискриминированное объединение
type Step =
  | { kind: 'intro'; emoji: string; title: string; text: string }
  | { kind: 'mizan' }
  | { kind: 'term'; item: SarfTheory }
  | { kind: 'paradigm'; p: SarfParadigm }
  | { kind: 'tasrif' };

function buildSteps(sec: SarfSection, lang: Lang): Step[] {
  const steps: Step[] = [];
  steps.push({
    kind: 'intro',
    emoji: sec.emoji,
    title: sarfText(sec.title, lang),
    text: sec.intro ? sarfText(sec.intro, lang) : '',
  });
  if (sec.key === 'taqsim') steps.push({ kind: 'mizan' });
  (sec.theory ?? []).forEach((item) => steps.push({ kind: 'term', item }));
  (sec.paradigms ?? []).forEach((p) => steps.push({ kind: 'paradigm', p }));
  steps.push({ kind: 'tasrif' });
  return steps;
}

// Карточка термина (теория)
function TermCard({ item, lang }: { item: SarfTheory; lang: Lang }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {item.ar && (
        <div style={{ marginBottom: 6 }}>
          <ArabicForm text={item.ar} size="xl" />
        </div>
      )}
      {item.tr && (
        <div style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
          {item.tr}
        </div>
      )}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>
        {sarfText(item.term, lang)}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-main)', opacity: 0.92 }}>
        {sarfText(item.def, lang)}
      </div>
      {item.examples && item.examples.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {item.examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => speakArabic(ex)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-tint)', border: '1px solid var(--accent-border)',
                borderRadius: 12, padding: '8px 12px', cursor: 'pointer',
              }}
            >
              <span className="sarf-ar sarf-ar--md" style={{ fontSize: 20 }}>{ex}</span>
              <Volume2 size={13} color="var(--accent-gold)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Карточка парадигмы (из sarfData)
function ParadigmCard({ p, lang }: { p: SarfParadigm; lang: Lang }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div className="sarf-ar sarf-ar--lg">{p.ar}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>
          {sarfText(p.title, lang)}
        </div>
        {p.gloss && (
          <div style={{ fontSize: 13, color: 'var(--accent-gold)', marginTop: 2 }}>
            «{sarfText(p.gloss, lang)}»
          </div>
        )}
      </div>
      {p.rule && (
        <div className="glass-card glass-card--gold" style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 14, color: 'var(--text-main)' }}>
          💡 {sarfText(p.rule, lang)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {p.sighas.map((s, i) => (
          <div key={i} className="sarf-form-row sarf-row" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="label">
              {sarfText(s.label, lang)}
              {s.tr && <span className="ar" style={{ direction: 'ltr', fontStyle: 'italic' }}>{s.tr}</span>}
            </div>
            <ArabicForm text={s.ar} size="md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SarfLesson({ lang, sectionIndex, isLast, onBack, onNextLesson }: Props) {
  const sec = sarfSections[sectionIndex];
  const steps = useMemo(() => buildSteps(sec, lang), [sec, lang]);
  const [idx, setIdx] = useState(0);

  useEffect(() => { setIdx(0); }, [sectionIndex]);

  const total = steps.length;
  const step = steps[idx];
  const isLastStep = idx === total - 1;

  const goNext = useCallback(() => setIdx((i) => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => { if (idx === 0) onBack(); else setIdx((i) => i - 1); }, [idx, onBack]);
  const swipe = useSwipe(goNext, goPrev);

  const progress = ((idx + 1) / total) * 100;

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} {...swipe}>
      {/* Header */}
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={goPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>
          {sec.emoji} {sarfText(sec.title, lang)}
        </h1>
        <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
          {idx + 1}/{total}
        </span>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${progress}%`, transition: 'width 0.35s ease' }} />
      </div>

      {/* Content */}
      <div className="page-content" style={{ paddingTop: 18 }}>
        <div key={idx} className="sarf-step">
          {step.kind === 'intro' && (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>{step.emoji}</div>
              <h2 className="title-screen" style={{ marginBottom: 14 }}>{step.title}</h2>
              {step.text && (
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-main)', opacity: 0.9 }}>{step.text}</p>
              )}
            </div>
          )}

          {step.kind === 'mizan' && (
            <div className="glass-card" style={{ padding: '20px 16px' }}>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                {L(lang, 'Весы слова (الميزان)', 'Word scale (al-mīzān)')}
              </div>
              <MizanDiagram root={['ض', 'ر', 'ب']} />
            </div>
          )}

          {step.kind === 'term' && (
            <div className="glass-card" style={{ padding: '24px 18px' }}>
              <TermCard item={step.item} lang={lang} />
            </div>
          )}

          {step.kind === 'paradigm' && (
            <div className="glass-card" style={{ padding: '20px 16px' }}>
              <ParadigmCard p={step.p} lang={lang} />
            </div>
          )}

          {step.kind === 'tasrif' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
                <h2 className="title-screen" style={{ fontSize: 20 }}>
                  {L(lang, 'Полный тасриф', 'Full tasrif')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                  {L(lang, 'Закрепление: модельный глагол ضَرَبَ во всех формах', 'Review: model verb ضَرَبَ in all forms')}
                </p>
              </div>
              <FullTasrif verb={GROUP2[0]} />
            </div>
          )}
        </div>

        {/* Навигация */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={goPrev}>
            <ChevronLeft size={18} />
            {L(lang, 'Назад', 'Back', 'Orqaga', 'Қафо')}
          </button>
          {isLastStep ? (
            isLast ? (
              <button className="btn btn-gold" style={{ flex: 2, gap: 8 }} onClick={onBack}>
                <CheckCircle2 size={18} />
                {L(lang, 'Завершить', 'Finish', 'Yakunlash', 'Анҷом')}
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 2, gap: 8 }} onClick={onNextLesson}>
                <GraduationCap size={18} />
                {L(lang, 'Следующий урок', 'Next lesson', 'Keyingi dars', 'Дарси навбатӣ')}
              </button>
            )
          ) : (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={goNext}>
              {L(lang, 'Далее', 'Next', 'Keyingi', 'Баъд')}
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14, opacity: 0.7 }}>
          ← → {L(lang, 'листайте', 'swipe', 'suring', 'варақ занед')}
        </p>
      </div>
    </div>
  );
}

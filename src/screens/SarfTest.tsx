import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Flame, RotateCcw, CheckCircle2, XCircle, Eye } from 'lucide-react';
import type { Lang } from '../i18n';
import {
  splitUnits, blankCandidates, normalizeArabicLoose, SIMPLE_MARKS,
} from '../utils/sarfConjugator';
import type { AUnit, TasrifCategory } from '../utils/sarfConjugator';
import { verbsByGroup, verbForms } from '../data/sarfVerbs';
import type { SarfVerb } from '../data/sarfVerbs';
import type { SarfGroup } from '../utils/sarfConjugator';
import { ArabicForm } from '../components/SarfBits';

export type SarfTestMode = 'visual' | 'written';

interface Props {
  lang: Lang;
  group: SarfGroup | 'all';
  mode: SarfTestMode;
  onBack: () => void;
}

type SLang = Exclude<Lang, 'ar'>;
function L(lang: Lang, ru: string, en?: string, uz?: string, tj?: string): string {
  const l = (lang === 'ar' ? 'ru' : lang) as SLang;
  return ({ ru, en: en ?? ru, uz: uz ?? ru, tj: tj ?? ru } as Record<SLang, string>)[l];
}

const TOTAL = 10;
const MAX_ERRORS = 3;

const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

interface Question {
  verb: SarfVerb;
  madi: string;
  mudari: string;
  cat: TasrifCategory;
  fi: number;
  form: string;
  labelRu: string;
  labelAr: string;
  // visual
  units: AUnit[];
  blankIdx: number;
  correctMark: string;
}

function makeQuestion(verbs: SarfVerb[], mode: SarfTestMode): Question {
  for (let attempt = 0; attempt < 40; attempt++) {
    const verb = rand(verbs);
    const r = verbForms(verb);
    const cat = rand(r.categories);
    const fi = Math.floor(Math.random() * cat.forms.length);
    const form = cat.forms[fi];
    const units = splitUnits(form);
    const cands = blankCandidates(units);
    if (mode === 'visual' && cands.length === 0) continue;
    const blankIdx = cands.length ? rand(cands) : -1;
    return {
      verb, madi: r.madi, mudari: r.mudari, cat, fi, form,
      labelRu: cat.labels[fi]?.ru ?? '', labelAr: cat.labels[fi]?.ar ?? '',
      units, blankIdx, correctMark: blankIdx >= 0 ? units[blankIdx].mark : '',
    };
  }
  // запасной — гарантированно находим форму с кандидатом для визуального режима
  const verb = rand(verbs);
  const r = verbForms(verb);
  for (const c of r.categories) {
    for (let fi = 0; fi < c.forms.length; fi++) {
      const units = splitUnits(c.forms[fi]);
      const cands = blankCandidates(units);
      const blankIdx = cands.length ? cands[0] : -1;
      if (mode === 'written' || blankIdx >= 0) {
        return {
          verb, madi: r.madi, mudari: r.mudari, cat: c, fi, form: c.forms[fi],
          labelRu: c.labels[fi]?.ru ?? '', labelAr: c.labels[fi]?.ar ?? '',
          units, blankIdx, correctMark: blankIdx >= 0 ? units[blankIdx].mark : '',
        };
      }
    }
  }
  // абсолютный край (не должен достигаться)
  const c0 = r.categories[0];
  const u0 = splitUnits(c0.forms[0]);
  const b0 = blankCandidates(u0);
  const bi = b0.length ? b0[0] : -1;
  return { verb, madi: r.madi, mudari: r.mudari, cat: c0, fi: 0, form: c0.forms[0], labelRu: c0.labels[0].ru, labelAr: c0.labels[0].ar, units: u0, blankIdx: bi, correctMark: bi >= 0 ? u0[bi].mark : '' };
}

export default function SarfTest({ lang, group, mode, onBack }: Props) {
  const verbs = useRef<SarfVerb[]>(verbsByGroup(group));
  const [qNum, setQNum] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null); // visual: выбранная огласовка
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [errors, setErrors] = useState(0);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState<{ form: string; labelRu: string }[]>([]);

  const newQuestion = useCallback(() => {
    setQ(makeQuestion(verbs.current, mode));
    setPicked(null);
    setTyped('');
    setFeedback(null);
    setRevealed(false);
  }, [mode]);

  function restart() {
    verbs.current = verbsByGroup(group);
    setQNum(0); setScore(0); setStreak(0); setErrors(0);
    setFailed(false); setDone(false); setWrong([]);
    newQuestion();
  }

  useEffect(() => { restart(); /* eslint-disable-next-line */ }, [group, mode]);

  // Возвращает true, если этот неверный ответ — третья ошибка (провал).
  // Вычисляем синхронно из render-time `errors`, без чтения устаревшего `failed`.
  function registerResult(ok: boolean): boolean {
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      return false;
    }
    setStreak(0);
    if (q) setWrong((w) => [...w, { form: q.form, labelRu: q.labelRu }]);
    setErrors((e) => e + 1);
    return errors + 1 >= MAX_ERRORS;
  }

  function advance() {
    const next = qNum + 1;
    if (next >= TOTAL) { setDone(true); return; }
    setQNum(next);
    newQuestion();
  }

  // ── Визуальный ответ (огласовка) ──
  function chooseHarakah(mark: string) {
    if (!q || feedback || failed) return;
    const ok = mark === q.correctMark;
    setPicked(mark);
    setFeedback({ ok });
    const willFail = registerResult(ok);
    if (willFail) setTimeout(() => setFailed(true), 900);
    else setTimeout(() => advance(), ok ? 750 : 1300);
  }

  // ── Письменный ответ (арабская форма) ──
  function checkWritten() {
    if (!q || !typed.trim() || feedback || failed) return;
    const ok = normalizeArabicLoose(typed) === normalizeArabicLoose(q.form);
    setFeedback({ ok });
    const willFail = registerResult(ok);
    if (willFail) setTimeout(() => setFailed(true), 900);
    else setTimeout(() => advance(), ok ? 850 : 1500);
  }

  // ── Экран провала ──
  if (failed) {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Header lang={lang} onBack={onBack} streak={streak} score={score} errors={errors} />
        <div className="page-content" style={{ paddingTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>😔</div>
          <h2 className="title-screen" style={{ color: 'var(--danger)', marginBottom: 8 }}>
            {L(lang, 'Слишком много ошибок', 'Too many mistakes')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            {L(lang, 'Повторите тасриф и попробуйте снова.', 'Review the tasrif and try again.')}
          </p>
          <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={restart}>
            <RotateCcw size={18} /> {L(lang, 'Заново', 'Restart')}
          </button>
          <button className="btn btn-ghost" onClick={onBack}>
            {L(lang, 'Выйти', 'Exit')}
          </button>
        </div>
      </div>
    );
  }

  // ── Экран завершения ──
  if (done) {
    const pct = Math.round((score / TOTAL) * 100);
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Header lang={lang} onBack={onBack} streak={streak} score={score} errors={errors} />
        <div className="page-content" style={{ paddingTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{wrong.length === 0 ? '🎉' : '✅'}</div>
          <h2 className="title-screen">{L(lang, 'Тест завершён!', 'Test complete!')}</h2>
          <div style={{
            display: 'inline-flex', gap: 16, marginTop: 16, padding: '10px 20px',
            background: 'rgba(192,150,60,0.10)', border: '1px solid rgba(192,150,60,0.25)', borderRadius: 14,
          }}>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ {score}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✗ {wrong.length}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{pct}%</span>
          </div>

          {wrong.length > 0 && (
            <div className="glass-card" style={{ marginTop: 20, textAlign: 'right' }}>
              {wrong.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.labelRu}</span>
                  <ArabicForm text={w.form} size="md" />
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary" style={{ marginTop: 20, marginBottom: 12 }} onClick={restart}>
            <RotateCcw size={18} /> {L(lang, 'Ещё раз', 'Again')}
          </button>
          <button className="btn btn-ghost" onClick={onBack}>{L(lang, 'Выйти', 'Exit')}</button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Header lang={lang} onBack={onBack} streak={streak} score={score} errors={errors} qNum={qNum} />

      {/* Progress */}
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent-teal)', width: `${((qNum + 1) / TOTAL) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div className="page-content" style={{ paddingTop: 16 }}>
        {/* Контекст: какой глагол и какую форму строим */}
        <div className="glass-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {q.verb.ru}
              <div style={{ fontSize: 12, color: 'var(--accent-gold)', marginTop: 2 }}>
                {q.cat.ru} · <span className="sarf-ar" style={{ fontSize: 15 }}>{q.cat.ar}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 2 }}>
                {L(lang, 'форма', 'form')}: {q.labelRu} <span className="sarf-ar" style={{ fontSize: 14 }}>{q.labelAr}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <ArabicForm text={q.madi} size="md" />
            </div>
          </div>
        </div>

        {/* ── ВИЗУАЛЬНЫЙ: игра с харакатами ── */}
        {mode === 'visual' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              {L(lang, 'Какая огласовка на выделенной букве?', 'Which vowel mark is on the highlighted letter?')}
            </div>
            {/* Слово с пропущенной огласовкой — единая строка (вязь не рвём).
                У одной буквы убрана огласовка → её и нужно «достроить». */}
            <div className="glass-card" style={{ padding: '26px 16px', textAlign: 'center', marginBottom: 14 }}>
              <span className="sarf-ar sarf-ar--xl">
                {q.units.map((u, i) => (i === q.blankIdx && !feedback ? u.base : u.base + u.mark)).join('')}
              </span>
            </div>
            {/* Чип: на какой букве пропущена огласовка */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{L(lang, 'буква без огласовки:', 'letter without vowel:')}</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 40, height: 44, borderRadius: 12,
                background: feedback ? (feedback.ok ? 'rgba(39,174,96,0.18)' : 'rgba(192,57,43,0.18)') : 'rgba(192,150,60,0.18)',
                border: '1.5px solid var(--accent-border)',
              }}>
                <span className="sarf-ar" style={{ fontSize: 28 }}>
                  {q.units[q.blankIdx]?.base}{feedback ? q.units[q.blankIdx]?.mark : ''}
                </span>
              </span>
            </div>
            {/* Выбор огласовки */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {SIMPLE_MARKS.map((m) => {
                let cls = 'harakah-pill';
                if (feedback) {
                  if (m.mark === q.correctMark) cls += ' correct';
                  else if (m.mark === picked) cls += ' wrong';
                }
                return (
                  <button key={m.mark} className={cls} disabled={!!feedback} onClick={() => chooseHarakah(m.mark)}>
                    <span className="glyph">{'ـ' + m.mark}</span>
                    <span className="nm">{L(lang, m.ru, m.ru)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── ПИСЬМЕННЫЙ: написать форму по-арабски ── */}
        {mode === 'written' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-main)', marginBottom: 14, lineHeight: 1.5 }}>
              {L(lang, 'Напишите эту форму глагола по-арабски', 'Write this verb form in Arabic')}
            </div>
            <input
              className="input-field"
              placeholder="اُكْتُبْ بِالْعَرَبِيَّة…"
              value={typed}
              dir="rtl"
              lang="ar"
              style={{ fontFamily: 'Noto Naskh Arabic, serif', fontSize: 24, textAlign: 'right' }}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkWritten()}
              disabled={!!feedback}
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
            {!feedback && (
              <button className="btn btn-ghost btn-sm" style={{ margin: '10px auto 0' }} onClick={() => setRevealed((v) => !v)}>
                <Eye size={14} /> {revealed ? L(lang, 'Скрыть', 'Hide') : L(lang, 'Подсказка', 'Hint')}
              </button>
            )}
            {revealed && !feedback && (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <ArabicForm text={q.form} size="lg" />
              </div>
            )}
            <button
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              disabled={!typed.trim() || !!feedback}
              onClick={checkWritten}
            >
              {L(lang, 'Проверить', 'Check')}
            </button>
          </>
        )}

        {/* Фидбэк */}
        {feedback && (
          <div
            className={`glass-card ${feedback.ok ? 'flash-correct' : 'flash-wrong'}`}
            style={{
              marginTop: 16, padding: '14px 16px',
              borderColor: feedback.ok ? 'var(--accent-teal)' : 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            {feedback.ok ? <CheckCircle2 size={20} color="var(--accent-teal)" /> : <XCircle size={20} color="var(--danger)" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: feedback.ok ? 'var(--accent-teal)' : 'var(--danger)' }}>
                {feedback.ok ? L(lang, 'Верно!', 'Correct!') : L(lang, 'Правильный ответ:', 'Correct answer:')}
              </div>
              {!feedback.ok && (
                <div style={{ marginTop: 6 }}><ArabicForm text={q.form} size="md" /></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Шапка теста ─────────────────────────────────────────────────────────────
function Header({
  lang, onBack, streak, score, errors, qNum,
}: { lang: Lang; onBack: () => void; streak: number; score: number; errors: number; qNum?: number }) {
  return (
    <div className="page-header" style={{ background: 'var(--bg-card)' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
        <ChevronLeft size={24} />
      </button>
      <h1 className="title-card" style={{ flex: 1 }}>
        {L(lang, 'Тест по сарфу', 'Sarf test')}{typeof qNum === 'number' ? ` · ${qNum + 1}/${TOTAL}` : ''}
      </h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: MAX_ERRORS }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < errors ? 'var(--danger)' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
        <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
          <Flame size={14} /> {streak}
        </span>
        <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700 }}>{score}</span>
      </div>
    </div>
  );
}

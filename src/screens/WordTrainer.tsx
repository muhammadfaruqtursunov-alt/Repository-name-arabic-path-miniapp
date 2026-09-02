import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, BookOpen, GraduationCap,
  Eye, Volume2, CheckCircle2, XCircle, RotateCcw, Flame,
} from 'lucide-react';
import type { Lang } from '../i18n';
import { useSwipe } from '../hooks/useSwipe';
import { speakArabic } from '../utils/speak';
import {
  loadSets, upsertSet, deleteSet, newId, parseWords,
  answerVariants, normAnswer, shuffle,
  markTrainerPassed, isTrainerPassed, resetTrainerProgress,
} from '../utils/wordTrainer';
import type { TrainerSet, TrainerWord } from '../utils/wordTrainer';

interface Props {
  lang: Lang;
  onBack: () => void;
}

type SLang = Exclude<Lang, 'ar'>;
function L(lang: Lang, ru: string, en?: string, uz?: string, tj?: string): string {
  const l = (lang === 'ar' ? 'ru' : lang) as SLang;
  return ({ ru, en: en ?? ru, uz: uz ?? ru, tj: tj ?? ru } as Record<SLang, string>)[l];
}

type View = 'sets' | 'edit' | 'study' | 'visual' | 'written' | 'done';
const MAX_ERRORS = 3;

export default function WordTrainer({ lang, onBack }: Props) {
  const [sets, setSets] = useState<TrainerSet[]>(() => loadSets());
  const [view, setView] = useState<View>('sets');
  const [activeId, setActiveId] = useState<string | null>(null);

  // редактор набора
  const [draftName, setDraftName] = useState('');
  const [draftText, setDraftText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const active = sets.find((s) => s.id === activeId) ?? null;

  function refresh() { setSets(loadSets()); }

  // ── Список наборов ────────────────────────────────────────────
  function openEditor(set?: TrainerSet) {
    if (set) {
      setEditingId(set.id);
      setDraftName(set.name);
      setDraftText(set.words.map((w) => `${w.ar} — ${w.trans}`).join('\n'));
    } else {
      setEditingId(null);
      setDraftName('');
      setDraftText('');
    }
    setView('edit');
  }

  const parsed = useMemo(() => parseWords(draftText), [draftText]);

  function saveDraft() {
    if (parsed.length === 0) return;
    const id = editingId ?? newId();
    const name = draftName.trim() || L(lang, 'Мой словарь', 'My words', 'Mening soʻzlarim', 'Луғати ман');
    upsertSet({ id, name, words: parsed, created: Date.now() });
    if (editingId) resetTrainerProgress(editingId); // слова изменились — прогресс сбрасываем
    refresh();
    setView('sets');
  }

  function removeSet(id: string) {
    deleteSet(id);
    resetTrainerProgress(id);
    refresh();
  }

  function startSet(id: string) {
    setActiveId(id);
    setView('study');
  }

  // ── Экраны ────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <Shell lang={lang} title={editingId ? L(lang, 'Изменить набор', 'Edit set', 'Toʻplamni tahrirlash', 'Таҳрири маҷмӯа') : L(lang, 'Новый набор', 'New set', 'Yangi toʻplam', 'Маҷмӯаи нав')} onBack={() => setView('sets')}>
        <input
          className="input-field"
          style={{ marginBottom: 12 }}
          placeholder={L(lang, 'Название набора', 'Set name', 'Toʻplam nomi', 'Номи маҷмӯа')}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
          {L(lang,
            'Вставьте слова — по одному на строку, через тире:',
            'Paste words — one per line, separated by a dash:',
            'Soʻzlarni joylashtiring — har qatorda bitta, tire bilan:',
            'Калимаҳоро гузоред — дар ҳар сатр яктоӣ, бо тире:')}
          <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontFamily: 'monospace', fontSize: 12, direction: 'ltr' }}>
            كِتَابٌ — книга<br />
            بَيْتٌ — дом<br />
            مَسْجِدٌ — мечеть
          </div>
        </div>
        <textarea
          className="input-field"
          style={{ minHeight: 200, fontSize: 15, lineHeight: 1.7 }}
          placeholder={'كِتَابٌ — книга'}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 16px' }}>
          <span style={{ fontSize: 13, color: parsed.length ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
            {L(lang, 'Распознано слов', 'Words detected', 'Aniqlangan soʻzlar', 'Калимаҳои шинохта')}: <b>{parsed.length}</b>
          </span>
        </div>
        <button className="btn btn-primary" disabled={parsed.length === 0} onClick={saveDraft}>
          {L(lang, 'Сохранить', 'Save', 'Saqlash', 'Нигоҳ доштан')}
        </button>
      </Shell>
    );
  }

  if (active && view === 'study') {
    return (
      <StudyView
        lang={lang}
        set={active}
        onBack={() => setView('sets')}
        onStartTest={() => setView('visual')}
      />
    );
  }

  if (active && (view === 'visual' || view === 'written')) {
    return (
      <TestView
        key={view}
        lang={lang}
        set={active}
        mode={view}
        onBack={() => setView('sets')}
        onRestudy={() => setView('study')}
        onPassed={() => {
          markTrainerPassed(active.id, view);
          setView(view === 'visual' ? 'written' : 'done');
        }}
      />
    );
  }

  if (active && view === 'done') {
    return (
      <Shell lang={lang} title={active.name} onBack={() => setView('sets')}>
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <h2 className="title-screen" style={{ color: 'var(--accent-gold)', marginBottom: 10 }}>
            {L(lang, 'Набор пройден!', 'Set completed!', 'Toʻplam tugallandi!', 'Маҷмӯа анҷом ёфт!')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            {L(lang,
              'Вы прошли оба теста — визуальный и письменный. Повторяйте набор время от времени.',
              'You passed both tests — visual and written. Review the set from time to time.',
              'Ikkala testdan ham oʻtdingiz — vizual va yozma. Toʻplamni vaqti-vaqti bilan takrorlang.',
              'Шумо ҳар ду санҷишро гузаштед — тасвирӣ ва хаттӣ. Маҷмӯаро гоҳ-гоҳ такрор кунед.')}
          </p>
          <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={() => setView('study')}>
            <RotateCcw size={16} /> {L(lang, 'Повторить', 'Review again', 'Takrorlash', 'Такрор кардан')}
          </button>
          <button className="btn btn-ghost" onClick={() => setView('sets')}>
            {L(lang, 'К наборам', 'Back to sets', 'Toʻplamlarga', 'Ба маҷмӯаҳо')}
          </button>
        </div>
      </Shell>
    );
  }

  // ── Список наборов ────────────────────────────────────────────
  return (
    <Shell lang={lang} title={L(lang, 'Тренажёр слов', 'Word trainer', 'Soʻz mashqi', 'Машқи калимаҳо')} onBack={onBack}>
      {sets.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '28px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📝</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {L(lang, 'Свой словарь', 'Your own words', 'Oʻz soʻzlaringiz', 'Луғати худ')}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {L(lang,
              'Вставьте любые слова с переводом — приложение выучит и проверит их так же, как уроки курса.',
              'Paste any words with translations — the app will teach and test them just like the course lessons.',
              'Tarjimasi bilan istalgan soʻzlarni joylashtiring — ilova ularni kurs darslari kabi oʻrgatadi va tekshiradi.',
              'Ҳар калимаро бо тарҷума гузоред — барнома онҳоро мисли дарсҳои курс меомӯзонад ва месанҷад.')}
          </p>
        </div>
      )}

      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => openEditor()}>
        <Plus size={18} /> {L(lang, 'Новый набор', 'New set', 'Yangi toʻplam', 'Маҷмӯаи нав')}
      </button>

      {sets.map((s) => {
        const v = isTrainerPassed(s.id, 'visual');
        const w = isTrainerPassed(s.id, 'written');
        return (
          <div key={s.id} className={`glass-card${v && w ? ' glass-card--gold' : ''}`} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={20} color="var(--accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="title-card" style={{ fontSize: 15 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.words.length} {L(lang, 'слов', 'words', 'soʻz', 'калима')}
                  {v && ' · 👁 ✓'}{w && ' · ✍️ ✓'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => startSet(s.id)}>
                <GraduationCap size={15} /> {L(lang, 'Учить', 'Study', 'Oʻrganish', 'Омӯхтан')}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => openEditor(s)}>
                {L(lang, 'Изменить', 'Edit', 'Tahrir', 'Таҳрир')}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => removeSet(s.id)} aria-label="delete">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </Shell>
  );
}

// ── Каркас экрана ───────────────────────────────────────────────
function Shell({ lang, title, onBack, children, right }: {
  lang: Lang; title: string; onBack: () => void; children: React.ReactNode; right?: React.ReactNode;
}) {
  void lang;
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{title}</h1>
        {right}
      </div>
      <div className="page-content" style={{ paddingTop: 16 }}>{children}</div>
    </div>
  );
}

// ── Карточки (как урок курса) ───────────────────────────────────
function StudyView({ lang, set, onBack, onStartTest }: {
  lang: Lang; set: TrainerSet; onBack: () => void; onStartTest: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const total = set.words.length;
  const card = set.words[idx];
  const isLast = idx === total - 1;

  const goNext = useCallback(() => setIdx((i) => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);
  const swipe = useSwipe(goNext, goPrev);

  if (!card) return null;
  const progress = ((idx + 1) / total) * 100;

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} {...swipe}>
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{set.name}</h1>
        <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700, marginRight: 84 }}>
          {idx + 1}/{total}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent-teal)', width: `${progress}%`, transition: 'width .35s ease' }} />
      </div>

      <div className="page-content" style={{ paddingTop: 20 }}>
        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: '32px 20px', marginBottom: 20, minHeight: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => setRevealed(true)}
        >
          <div style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
            <div className="text-arabic-lg">{card.ar}</div>
            <button
              onClick={(e) => { e.stopPropagation(); speakArabic(card.ar); }}
              style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(192,150,60,0.12)', border: '1px solid rgba(192,150,60,0.30)', borderRadius: 10, padding: '5px 8px', cursor: 'pointer', color: 'var(--accent-gold)', display: 'flex' }}
            >
              <Volume2 size={15} />
            </button>
          </div>
          {card.tr && <div className="text-trans" style={{ marginBottom: 16 }}>{card.tr}</div>}
          {revealed ? (
            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{card.trans}</div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={(e) => { e.stopPropagation(); setRevealed(true); }}>
              <Eye size={14} /> {L(lang, 'Показать перевод', 'Show translation', 'Tarjimani koʻrsatish', 'Тарҷумаро нишон диҳед')}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={goPrev} disabled={idx === 0}>
            <ChevronLeft size={18} /> {L(lang, 'Назад', 'Back', 'Orqaga', 'Қафо')}
          </button>
          {isLast ? (
            <button className="btn btn-gold" style={{ flex: 2, gap: 8 }} onClick={onStartTest}>
              <GraduationCap size={18} /> {L(lang, 'Пройти тест', 'Take the test', 'Testdan oʻtish', 'Санҷиш додан')}
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={goNext}>
              {L(lang, 'Далее', 'Next', 'Keyingi', 'Баъд')} <ChevronRight size={18} />
            </button>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14, opacity: .7 }}>
          ← → {L(lang, 'листайте', 'swipe', 'suring', 'варақ занед')}
        </p>
      </div>
    </div>
  );
}

// ── Тест: визуальный (выбор) + письменный (ввод) ────────────────
function TestView({ lang, set, mode, onBack, onRestudy, onPassed }: {
  lang: Lang; set: TrainerSet; mode: 'visual' | 'written';
  onBack: () => void; onRestudy: () => void; onPassed: () => void;
}) {
  const order = useRef<TrainerWord[]>(shuffle(set.words));
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [fb, setFb] = useState<{ ok: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [errors, setErrors] = useState(0);
  const [failed, setFailed] = useState(false);

  const total = order.current.length;
  const q = order.current[i];

  // варианты для визуального теста (правильный + 3 чужих)
  const choices = useMemo(() => {
    if (mode !== 'visual' || !q) return [];
    const others = set.words.filter((w) => w.trans !== q.trans).map((w) => w.trans);
    return shuffle([q.trans, ...shuffle(others).slice(0, 3)]);
  }, [mode, q, set.words]);

  function register(ok: boolean): boolean {
    if (ok) { setScore((s) => s + 1); setStreak((s) => s + 1); return false; }
    setStreak(0);
    setErrors((e) => e + 1);
    return errors + 1 >= MAX_ERRORS;
  }

  function advance() {
    if (i + 1 >= total) { onPassed(); return; }
    setI(i + 1); setTyped(''); setPicked(null); setFb(null);
  }

  function answerVisual(choice: string) {
    if (fb || failed) return;
    const ok = choice === q.trans;
    setPicked(choice); setFb({ ok });
    const willFail = register(ok);
    if (willFail) setTimeout(() => setFailed(true), 900);
    else setTimeout(advance, ok ? 700 : 1200);
  }

  function answerWritten() {
    if (fb || failed || !typed.trim()) return;
    const ok = answerVariants(q.trans).includes(normAnswer(typed));
    setFb({ ok });
    const willFail = register(ok);
    if (willFail) setTimeout(() => setFailed(true), 900);
    else setTimeout(advance, ok ? 800 : 1400);
  }

  if (failed) {
    return (
      <Shell lang={lang} title={set.name} onBack={onBack}>
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>😔</div>
          <h2 className="title-screen" style={{ color: 'var(--danger)', marginBottom: 8 }}>
            {L(lang, 'Слишком много ошибок', 'Too many mistakes', 'Juda koʻp xato', 'Хатоҳо аз ҳад зиёданд')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            {L(lang, 'Повторите слова и попробуйте снова.', 'Review the words and try again.', 'Soʻzlarni takrorlab, yana urinib koʻring.', 'Калимаҳоро такрор карда, боз кӯшиш кунед.')}
          </p>
          <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={onRestudy}>
            <BookOpen size={16} /> {L(lang, 'Повторить слова', 'Review words', 'Soʻzlarni takrorlash', 'Такрори калимаҳо')}
          </button>
          <button className="btn btn-ghost" onClick={onBack}>
            {L(lang, 'Выйти', 'Exit', 'Chiqish', 'Баромадан')}
          </button>
        </div>
      </Shell>
    );
  }

  if (!q) return null;

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>
          {mode === 'visual'
            ? L(lang, 'Визуальный тест', 'Visual test', 'Vizual test', 'Санҷиши тасвирӣ')
            : L(lang, 'Письменный тест', 'Written test', 'Yozma test', 'Санҷиши хаттӣ')}
        </h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginRight: 84 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: MAX_ERRORS }).map((_, k) => (
              <div key={k} style={{ width: 8, height: 8, borderRadius: '50%', background: k < errors ? 'var(--danger)' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
          <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
            <Flame size={14} /> {streak}
          </span>
          <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700 }}>{score}/{total}</span>
        </div>
      </div>
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent-teal)', width: `${((i + 1) / total) * 100}%`, transition: 'width .3s' }} />
      </div>

      <div className="page-content" style={{ paddingTop: 18 }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '26px 20px', marginBottom: 20, position: 'relative' }}>
          <button
            onClick={() => speakArabic(q.ar)}
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(192,150,60,0.12)', border: '1px solid rgba(192,150,60,0.30)', borderRadius: 10, padding: '5px 8px', cursor: 'pointer', color: 'var(--accent-gold)', display: 'flex' }}
          >
            <Volume2 size={15} />
          </button>
          <div className="text-arabic-lg">{q.ar}</div>
          {q.tr && <div className="text-trans" style={{ marginTop: 8 }}>{q.tr}</div>}
          <p style={{ color: '#fff', fontSize: 13, marginTop: 12, opacity: .85 }}>
            {mode === 'visual'
              ? L(lang, 'Выберите перевод', 'Choose the translation', 'Tarjimani tanlang', 'Тарҷумаро интихоб кунед')
              : L(lang, 'Напишите перевод', 'Type the translation', 'Tarjimani yozing', 'Тарҷумаро нависед')}
          </p>
        </div>

        {mode === 'visual' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {choices.map((c, k) => {
              let cls = 'btn btn-ghost';
              if (fb) {
                if (c === q.trans) cls = 'btn btn-primary';
                else if (c === picked) cls = 'btn btn-danger';
              }
              return (
                <button key={k} className={cls} style={{ height: 'auto', padding: '14px 18px', justifyContent: 'flex-start', textAlign: 'left', fontSize: 15 }} disabled={!!fb} onClick={() => answerVisual(c)}>
                  {c}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input-field"
              placeholder={L(lang, 'Перевод…', 'Translation…', 'Tarjima…', 'Тарҷума…')}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && answerWritten()}
              disabled={!!fb}
              autoComplete="off"
            />
            <button className="btn btn-primary" disabled={!typed.trim() || !!fb} onClick={answerWritten}>
              {L(lang, 'Проверить', 'Check', 'Tekshirish', 'Санҷидан')}
            </button>
          </div>
        )}

        {fb && (
          <div className={`glass-card ${fb.ok ? 'flash-correct' : 'flash-wrong'}`} style={{ marginTop: 16, padding: '12px 16px', borderColor: fb.ok ? 'var(--accent-teal)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {fb.ok ? <CheckCircle2 size={20} color="var(--accent-teal)" /> : <XCircle size={20} color="var(--danger)" />}
            <span style={{ color: fb.ok ? 'var(--accent-teal)' : 'var(--danger)', fontWeight: 600 }}>
              {fb.ok ? L(lang, 'Верно!', 'Correct!', 'Toʻgʻri!', 'Дуруст!') : `${L(lang, 'Правильно:', 'Correct:', 'Toʻgʻri:', 'Дуруст:')} ${q.trans}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

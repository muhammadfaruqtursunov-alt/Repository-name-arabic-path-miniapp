import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, Flame, BookOpen, RotateCcw, Volume2 } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { QuizQuestion, QuizAnswerResult } from '../api/client';
import { speakArabic } from '../utils/speak';
import { checkAchievements } from '../utils/achievements';
import AchievementPopup from '../components/AchievementPopup';
import type { Achievement } from '../utils/achievements';

type Mode = 'visual' | 'written';

interface Props {
  lang: Lang;
  bookId: number;
  lesson: number;
  onBack: () => void;
  onRestartLesson: () => void;
}

const MAX_ERRORS = 3;

// ── Motivational ayahs / hadiths ──────────────────────────────────
const MOTIVATIONS = [
  {
    ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    trans: 'Inna maʿa l-ʿusri yusrā',
    ru: 'Воистину, вместе с трудностью — облегчение',
    tj: 'Бешак, бо душворӣ осонӣ аст',
    uz: "Albatta, qiyinchilik bilan osonlik bor",
    en: 'Verily, with hardship comes ease',
    ar_tr: 'إن مع العسر يسرا',
    source: 'Коран 94:6 / القرآن ٩٤:٦',
  },
  {
    ar: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    trans: "Wa qul rabbi zidnī ʿilmā",
    ru: 'Скажи: «Господи, прибавь мне знания!»',
    tj: 'Бигӯ: «Парвардигоро, маро бар дониш биафзо!»',
    uz: '"Rabbim, ilmimni oshir!" - de',
    en: 'Say: "My Lord, increase me in knowledge"',
    ar_tr: 'وقل رب زدني علما',
    source: 'Коран 20:114 / القرآن ٢٠:١١٤',
  },
  {
    ar: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    trans: "Innallāha maʿa ṣ-ṣābirīn",
    ru: 'Воистину, Аллах — с терпеливыми',
    tj: 'Бешак, Аллоҳ бо сабркунандагон аст',
    uz: 'Albatta, Alloh sabr qiluvchilar bilan',
    en: 'Verily, Allah is with the patient',
    ar_tr: 'إن الله مع الصابرين',
    source: 'Коран 2:153 / القرآن ٢:١٥٣',
  },
  {
    ar: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    trans: "Ṭalabu l-ʿilmi farīḍatun ʿalā kulli muslim",
    ru: 'Приобретение знаний — обязанность каждого мусульманина',
    tj: 'Талаби дониш бар ҳар мусалмон фарз аст',
    uz: 'Ilm olish har bir muslimga farz',
    en: 'Seeking knowledge is an obligation on every Muslim',
    ar_tr: 'طلب العلم فريضة على كل مسلم',
    source: 'Хадис / ابن ماجه',
  },
  {
    ar: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    trans: "Man salaka ṭarīqan yaltamisu fīhi ʿilman sahhalallāhu lahu ṭarīqan ilā l-jannah",
    ru: 'Кто идёт по пути знания — Аллах облегчит ему путь в Рай',
    tj: 'Ҳар кӣ роҳи дониш равад — Аллоҳ роҳи биҳиштро барояш осон мегардонад',
    uz: "Kim ilm yo'lida yursa, Alloh unga jannat yo'lini osonlashtiradi",
    en: 'Whoever seeks knowledge, Allah will ease for him the path to Paradise',
    ar_tr: 'من سلك طريقا يلتمس فيه علما',
    source: 'Муслим / مسلم',
  },
];

type Motivation = typeof MOTIVATIONS[0];

function pickMotivation(): Motivation {
  return MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
}

function getMotivText(m: Motivation, lang: Lang): string {
  return (m as unknown as Record<string, string>)[lang] ?? m.ru;
}

// ── Component ─────────────────────────────────────────────────────
export default function Tests({ lang, bookId, lesson, onBack, onRestartLesson }: Props) {
  const [mode, setMode]         = useState<Mode>('visual');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [typed, setTyped]       = useState('');
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [motivation, setMotivation] = useState('');
  const [flashClass, setFlashClass] = useState('');

  // Error tracking
  const [errorCount, setErrorCount]       = useState(0);
  const [failed, setFailed]               = useState(false);
  const [failMotivation, setFailMotivation] = useState<Motivation | null>(null);

  // Stats
  const [streakVal, setStreakVal]   = useState(0);
  const [correctVal, setCorrectVal] = useState(0);
  const [totalVal, setTotalVal]     = useState(0);

  // Wrong-answer review
  const [wrongAnswers, setWrongAnswers] = useState<{ar: string; trans: string; correct: string}[]>([]);

  // Achievements
  const [achQueue, setAchQueue] = useState<Achievement[]>([]);
  const [currentAch, setCurrentAch] = useState<Achievement | null>(null);

  async function startQuiz(m: Mode) {
    setLoading(true);
    setDone(false);
    setFeedback(null);
    setMotivation('');
    setErrorCount(0);
    setFailed(false);
    setFailMotivation(null);
    setStreakVal(0);
    setCorrectVal(0);
    setTotalVal(0);
    setWrongAnswers([]);
    try {
      const q = await api.startQuiz(bookId, lesson, m);
      setQuestion(q);
      setTotalVal(q.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { startQuiz(mode); }, [mode, bookId, lesson]);

  async function handleVisualAnswer(chosenId: number) {
    if (!question || loading) return;
    setLoading(true);
    try {
      const res = await api.answerQuiz(question.word_id, chosenId, 'visual');
      handleResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleWrittenAnswer() {
    if (!question || !typed.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.answerQuiz(question.word_id, -1, 'written', typed.trim());
      setTyped('');
      handleResult(res);
    } finally {
      setLoading(false);
    }
  }

  function handleResult(res: QuizAnswerResult) {
    if (res.correct) {
      setFlashClass('flash-correct');
      setStreakVal(s => s + 1);
      setCorrectVal(c => c + 1);
    } else {
      setFlashClass('flash-wrong');
      setStreakVal(0);
      // record for error-review screen
      if (question) {
        setWrongAnswers(prev => [...prev, { ar: question.ar, trans: question.trans, correct: res.feedback }]);
      }

      // Count errors — at MAX_ERRORS show the fail screen
      setErrorCount(prev => {
        const next = prev + 1;
        if (next >= MAX_ERRORS) {
          setTimeout(() => {
            setFailed(true);
            setFailMotivation(pickMotivation());
            setFeedback(null);
          }, 1000);
        }
        return next;
      });
    }
    setTimeout(() => setFlashClass(''), 500);

    setFeedback({ correct: res.correct, msg: res.feedback });
    if (res.motivation) setMotivation(res.motivation);

    if (res.done) {
      setDone(true);
      // check perfect test
      const isPerfect = (errorCount === 0 && !res.correct === false);
      const newAchs = checkAchievements({ totalLearned: 0, streak: 0, questionsAsked: 1, perfectTest: wrongAnswers.length === 0 && res.correct });
      if (newAchs.length > 0) setAchQueue(q => [...q, ...newAchs]);
      void isPerfect;
      return;
    }
    if (res.next && !failed) {
      setTimeout(() => {
        setQuestion(res.next!);
        setFeedback(null);
      }, 800);
    }
  }

  // ── Error warning indicator ───────────────────────────────────────
  function ErrorDots() {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {Array.from({ length: MAX_ERRORS }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < errorCount ? 'var(--danger)' : 'rgba(255,255,255,0.15)',
              transition: 'background 250ms',
            }}
          />
        ))}
      </div>
    );
  }

  // Drain the achievement queue one by one
  useEffect(() => {
    if (currentAch || achQueue.length === 0) return;
    setCurrentAch(achQueue[0]);
    setAchQueue(q => q.slice(1));
  }, [achQueue, currentAch]);

  return (
    <>
    <AchievementPopup achievement={currentAch} onDone={() => setCurrentAch(null)} />
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>
          {t(lang, 'lesson_num')} {lesson}
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ErrorDots />
          <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
            <Flame size={14} /> {streakVal}
          </span>
          <span style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: 700 }}>
            {correctVal}/{totalVal || question?.total || '?'}
          </span>
        </div>
      </div>

      {/* Mode tabs */}
      {!failed && (
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
          {(['visual', 'written'] as Mode[]).map((m) => (
            <button
              key={m}
              className={`btn${mode === m ? ' btn-primary' : ' btn-ghost'}`}
              style={{ height: 40, fontSize: 13, flex: 1 }}
              onClick={() => { setMode(m); }}
            >
              {m === 'visual' ? t(lang, 'tab_visual') : t(lang, 'tab_written')}
            </button>
          ))}
        </div>
      )}

      <div className={`page-content ${flashClass}`} style={{ paddingTop: 16, flex: 1 }}>

        {/* ── FAIL SCREEN (3 errors) ─────────────────────────── */}
        {failed ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            {/* Warning emoji */}
            <div style={{ fontSize: 64, marginBottom: 12 }}>😔</div>
            <h2 className="title-screen" style={{ color: 'var(--danger)', marginBottom: 8 }}>
              {t(lang, 'fail_title')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              {t(lang, 'fail_subtitle')}
            </p>

            {/* Ayah / Hadith card */}
            {failMotivation && (
              <div className="glass-card glass-card--gold" style={{ marginBottom: 28, textAlign: 'center', padding: '22px 18px' }}>
                {/* Arabic text */}
                <div
                  className="text-arabic"
                  style={{
                    fontSize: 22, lineHeight: 1.8,
                    color: 'var(--accent-gold)',
                    marginBottom: 10,
                    direction: 'rtl',
                  }}
                >
                  {failMotivation.ar}
                </div>
                {/* Transliteration */}
                <div style={{
                  fontSize: 13, color: 'var(--text-muted)',
                  fontStyle: 'italic', marginBottom: 10,
                }}>
                  {failMotivation.trans}
                </div>
                {/* Translation in user language */}
                <div style={{
                  fontSize: 15, fontWeight: 600,
                  color: 'var(--text-main)', marginBottom: 10, lineHeight: 1.5,
                }}>
                  {getMotivText(failMotivation, lang)}
                </div>
                {/* Source */}
                <div style={{ fontSize: 11, color: 'var(--accent-gold)', opacity: 0.8, fontWeight: 600 }}>
                  — {failMotivation.source}
                </div>
              </div>
            )}

            {/* Primary: repeat lesson */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 12, height: 52, fontSize: 15, fontWeight: 700 }}
              onClick={onRestartLesson}
            >
              <BookOpen size={18} />
              {t(lang, 'btn_repeat_lesson')}
            </button>

            {/* Secondary: retry test without lesson */}
            <button
              className="btn btn-ghost"
              style={{ width: '100%', height: 44, fontSize: 13 }}
              onClick={() => startQuiz(mode)}
            >
              <RotateCcw size={15} />
              {t(lang, 'btn_retry_test')}
            </button>
          </div>

        ) : loading && !question ? (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>{t(lang, 'loading')}</p>

        ) : done ? (
          <div style={{ paddingBottom: 24 }}>
            {/* Result header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>
                {wrongAnswers.length === 0 ? '🎉' : '✅'}
              </div>
              <h2 className="title-screen">{t(lang, 'done_title')}</h2>
              <p className="text-muted" style={{ marginTop: 8, fontSize: 14 }}>{t(lang, 'done_msg')}</p>

              {/* Score pill */}
              <div style={{
                display: 'inline-flex', gap: 16, marginTop: 16, padding: '10px 20px',
                background: 'rgba(192,150,60,0.10)', border: '1px solid rgba(192,150,60,0.25)',
                borderRadius: 14,
              }}>
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 15 }}>
                  ✓ {correctVal}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 15 }}>
                  ✗ {wrongAnswers.length}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 15 }}>
                  {totalVal > 0 ? Math.round((correctVal / totalVal) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Error review */}
            {wrongAnswers.length > 0 && (
              <div className="glass-card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <XCircle size={16} color="var(--danger)" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>
                    {t(lang, 'fail_errors_warn')} ({wrongAnswers.length})
                  </span>
                </div>
                {wrongAnswers.map((w, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => speakArabic(w.ar)}
                        style={{
                          background: 'rgba(192,150,60,0.10)', border: '1px solid rgba(192,150,60,0.25)',
                          borderRadius: 8, padding: '4px 7px', cursor: 'pointer',
                          color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', flexShrink: 0,
                        }}
                      >
                        <Volume2 size={13} />
                      </button>
                      <div style={{ flex: 1 }}>
                        <div className="text-arabic" style={{ fontSize: 18, lineHeight: 1.4 }}>{w.ar}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{w.trans}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{w.correct}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-primary" onClick={() => startQuiz(mode)}>
              <RotateCcw size={16} />
              {t(lang, 'btn_retry_test')}
            </button>
          </div>

        ) : question ? (
          <div>
            {/* Progress bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {question.idx + 1} {t(lang, 'of')} {question.total}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginBottom: 24 }}>
              <div style={{
                width: `${((question.idx + 1) / question.total) * 100}%`,
                height: '100%', borderRadius: 2, background: 'var(--accent-teal)',
                transition: 'width 0.3s',
              }} />
            </div>

            {/* Arabic word card */}
            <div className="glass-card" style={{ textAlign: 'center', marginBottom: 24, padding: '28px 20px', position: 'relative' }}>
              <button
                onClick={() => speakArabic(question.ar)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(192,150,60,0.12)',
                  border: '1px solid rgba(192,150,60,0.30)',
                  borderRadius: 10, padding: '5px 8px',
                  cursor: 'pointer', color: 'var(--accent-gold)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Volume2 size={15} />
              </button>
              <div className="text-arabic-lg">{question.ar}</div>
              <div className="text-trans" style={{ marginTop: 10 }}>{question.trans}</div>
              {mode === 'visual' && (
                <p style={{ color: '#FFFFFF', fontSize: 13, marginTop: 12, opacity: 0.85 }}>
                  {t(lang, 'visual_question')}
                </p>
              )}
              {mode === 'written' && (
                <p style={{ color: '#FFFFFF', fontSize: 13, marginTop: 12, opacity: 0.85 }}>
                  {t(lang, 'written_question')}
                </p>
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`glass-card ${feedback.correct ? 'flash-correct' : 'flash-wrong'}`}
                style={{
                  marginBottom: 16, padding: '12px 16px',
                  borderColor: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                {feedback.correct
                  ? <CheckCircle2 size={20} color="var(--accent-teal)" />
                  : <XCircle size={20} color="var(--danger)" />}
                <span style={{ color: feedback.correct ? 'var(--accent-teal)' : 'var(--danger)', fontWeight: 600 }}>
                  {feedback.correct ? t(lang, 'correct_msg') : `${t(lang, 'wrong_msg')} ${feedback.msg}`}
                </span>
                {!feedback.correct && errorCount > 0 && errorCount < MAX_ERRORS && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    color: 'var(--danger)', background: 'rgba(224,85,85,0.15)',
                    padding: '2px 8px', borderRadius: 10,
                  }}>
                    {errorCount}/{MAX_ERRORS}
                  </span>
                )}
              </div>
            )}

            {/* Backend motivation (after reset) */}
            {motivation && (
              <div className="glass-card glass-card--gold" style={{ marginBottom: 16, fontSize: 13, color: 'var(--accent-gold)' }}>
                {motivation}
              </div>
            )}

            {/* Visual choices */}
            {mode === 'visual' && question.choices && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {question.choices.map((ch, i) => (
                  <button
                    key={i}
                    className="btn btn-ghost"
                    style={{
                      height: 'auto', padding: '14px 20px',
                      textAlign: 'left', justifyContent: 'flex-start',
                      color: '#FFFFFF', fontSize: 15, fontWeight: 600,
                    }}
                    disabled={!!feedback || loading}
                    onClick={() => handleVisualAnswer(ch.word_id)}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            )}

            {/* Written input */}
            {mode === 'written' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  className="input-field"
                  placeholder={t(lang, 'written_placeholder')}
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleWrittenAnswer()}
                  disabled={!!feedback}
                  autoComplete="off"
                />
                <button
                  className="btn btn-primary"
                  disabled={!typed.trim() || !!feedback || loading}
                  onClick={handleWrittenAnswer}
                >
                  {t(lang, 'btn_check')}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
    </>
  );
}

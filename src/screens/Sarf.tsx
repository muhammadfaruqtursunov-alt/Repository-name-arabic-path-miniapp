import { useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Eye, PenLine, BookOpen } from 'lucide-react';
import type { Lang } from '../i18n';
import { sarfSections, sarfText } from '../data/sarfData';
import { SARF_GROUPS } from '../data/sarfVerbs';
import type { SarfGroup } from '../utils/sarfConjugator';
import SarfLesson from './SarfLesson';
import SarfTest from './SarfTest';
import type { SarfTestMode } from './SarfTest';

interface Props {
  lang: Lang;
  onBack: () => void;
}

type SLang = Exclude<Lang, 'ar'>;
function L(lang: Lang, ru: string, en?: string, uz?: string, tj?: string): string {
  const l = (lang === 'ar' ? 'ru' : lang) as SLang;
  return ({ ru, en: en ?? ru, uz: uz ?? ru, tj: tj ?? ru } as Record<SLang, string>)[l];
}

type View = 'home' | 'lessons' | 'lesson' | 'testcfg' | 'test';

export default function Sarf({ lang, onBack }: Props) {
  const [view, setView] = useState<View>('home');
  const [lessonIdx, setLessonIdx] = useState(0);
  const [group, setGroup] = useState<SarfGroup | 'all'>('all');
  const [mode, setMode] = useState<SarfTestMode>('visual');

  // ── Урок (плеер) ──
  if (view === 'lesson') {
    return (
      <SarfLesson
        lang={lang}
        sectionIndex={lessonIdx}
        isLast={lessonIdx >= sarfSections.length - 1}
        onBack={() => setView('lessons')}
        onNextLesson={() => setLessonIdx((i) => Math.min(i + 1, sarfSections.length - 1))}
      />
    );
  }

  // ── Тест (раннер) ──
  if (view === 'test') {
    return <SarfTest lang={lang} group={group} mode={mode} onBack={() => setView('testcfg')} />;
  }

  // ── Список уроков ──
  if (view === 'lessons') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>{L(lang, 'Уроки сарфа', 'Sarf lessons')}</h1>
        </div>
        <div className="page-content" style={{ paddingTop: 14 }}>
          {sarfSections.map((sec, i) => (
            <div
              key={sec.key}
              className="glass-card"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}
              onClick={() => { setLessonIdx(i); setView('lesson'); }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {sec.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div className="title-card" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--accent-gold)' }}>{i + 1}. </span>
                  {sarfText(sec.title, lang)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'rtl', textAlign: 'right', marginTop: 2 }}>
                  {sarfText(sec.title, 'fa')}
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Конфигурация теста ──
  if (view === 'testcfg') {
    return (
      <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ background: 'var(--bg-card)' }}>
          <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="title-card" style={{ flex: 1 }}>{L(lang, 'Настройка теста', 'Test setup')}</h1>
        </div>
        <div className="page-content" style={{ paddingTop: 16 }}>
          {/* Группа глаголов */}
          <div className="text-badge text-muted" style={{ marginBottom: 8 }}>{L(lang, 'Группа глаголов', 'Verb group')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {SARF_GROUPS.map((g) => (
              <button
                key={g.group}
                className={`btn ${group === g.group ? 'btn-primary' : 'btn-ghost'}`}
                style={{ height: 'auto', padding: '12px 10px', flexDirection: 'column', gap: 4 }}
                onClick={() => setGroup(g.group)}
              >
                <span className="sarf-ar" style={{ fontSize: 20, color: group === g.group ? 'var(--on-accent)' : 'var(--accent-gold)' }}>{g.ar}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{g.ru} · {g.pattern}</span>
              </button>
            ))}
            <button
              className={`btn ${group === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 'auto', padding: '12px 10px', flexDirection: 'column', gap: 4, gridColumn: 'span 2' }}
              onClick={() => setGroup('all')}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>{L(lang, 'Все группы', 'All groups')}</span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>{L(lang, '60 глаголов', '60 verbs')}</span>
            </button>
          </div>

          <div className="gold-divider" />

          {/* Режим */}
          <div className="text-badge text-muted" style={{ marginBottom: 8 }}>{L(lang, 'Вид теста', 'Test type')}</div>
          <div
            className="glass-card"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}
            onClick={() => { setMode('visual'); setView('test'); }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Eye size={22} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="title-card">{L(lang, 'Визуальный', 'Visual')}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{L(lang, 'Игра с харакатами — найди огласовку', 'Harakat game — find the vowel')}</div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
          <div
            className="glass-card"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            onClick={() => { setMode('written'); setView('test'); }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PenLine size={22} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="title-card">{L(lang, 'Письменный', 'Written')} · بِالْعَرَبِيَّة</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{L(lang, 'Напиши تصريف по-арабски', 'Write the tasrif in Arabic')}</div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    );
  }

  // ── Домашний экран Сарфа (2 кнопки) ──
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{L(lang, 'Сарф (морфология)', 'Sarf (morphology)')}</h1>
      </div>
      <div className="page-content" style={{ paddingTop: 16 }}>
        <div className="glass-card glass-card--gold" style={{ textAlign: 'center', marginBottom: 18, padding: '22px 16px' }}>
          <div className="sarf-ar sarf-ar--lg">عِلْمُ الصَّرْف</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            {L(lang, 'Как строятся арабские слова: спряжение глагола ضَرَبَ и 12 производных.', 'How Arabic words are built: conjugation of ضَرَبَ and the 12 derivatives.')}
          </p>
        </div>

        <div
          className="glass-card"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, padding: '20px 18px' }}
          onClick={() => setView('lessons')}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={26} color="var(--accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="title-card" style={{ fontSize: 17 }}>{L(lang, 'Урок', 'Lesson')}</div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
              {L(lang, 'Теория по темам + полный тасриф', 'Theory by topic + full tasrif')}
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </div>

        <div
          className="glass-card"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '20px 18px' }}
          onClick={() => setView('testcfg')}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={26} color="var(--accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="title-card" style={{ fontSize: 17 }}>{L(lang, 'Тест', 'Test')}</div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
              {L(lang, 'Визуальный + письменный · сделай тасриф', 'Visual + written · do the tasrif')}
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
}

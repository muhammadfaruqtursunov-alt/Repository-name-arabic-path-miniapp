import { useState } from 'react';
import { ChevronLeft, ChevronDown, BookOpen, Compass, Eye, PenLine, BookOpenText, Library } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import type { VolumeInfo } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import SectionTile from '../components/SectionTile';

export type SectionKey = 'arabic' | 'quran';

interface Props {
  lang: Lang;
  section: SectionKey;
  volumes: VolumeInfo[];
  onBack: () => void;
  onOpenVolume: (bookId: number) => void;
  onOpenTests: () => void;
  onOpenGuide: () => void;
  onOpenSarf: () => void;
  onOpenTrainer: () => void;
  onOpenQuran: () => void;
}

// ru, en, uz, tj — пустые uz/tj падают на ru (как в Sarf.tsx)
function L(lang: Lang, ru: string, en?: string, uz?: string, tj?: string): string {
  if (lang === 'en') return en ?? ru;
  if (lang === 'uz') return uz ?? ru;
  if (lang === 'tj') return tj ?? ru;
  return ru;
}

export function sectionTitle(lang: Lang, key: SectionKey): string {
  return key === 'arabic'
    ? L(lang, 'Арабский язык', 'Arabic language', 'Arab tili', 'Забони арабӣ')
    : L(lang, 'Коран', 'Quran', 'Qurʼon', 'Қуръон');
}

export function soonLabel(lang: Lang): string {
  return L(lang, 'Скоро', 'Soon', 'Tez kunda', 'Зуд');
}

const ICON = { size: 22, color: 'var(--accent)' } as const;

export default function Section(props: Props) {
  const { lang, section, onBack } = props;
  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header islamic-header" style={{ background: 'var(--bg-card)' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
          aria-label={L(lang, 'Назад', 'Back', 'Orqaga', 'Бозгашт')}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>{sectionTitle(lang, section)}</h1>
      </div>
      <div className="page-content">
        {section === 'arabic' ? <ArabicSection {...props} /> : <QuranSection lang={lang} onOpenQuran={props.onOpenQuran} />}
      </div>
    </div>
  );
}

function ArabicSection({ lang, volumes, onOpenVolume, onOpenTests, onOpenGuide, onOpenSarf, onOpenTrainer }: Props) {
  const [medExpanded, setMedExpanded] = useState(false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Мединский курс — сворачиваемый, три тома */}
      <div style={{ gridColumn: 'span 2' }}>
        <div
          className={`glass-card${volumes.some(v => v.is_current) ? ' glass-card--gold' : ''}`}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: medExpanded ? 8 : 0 }}
          onClick={() => setMedExpanded(!medExpanded)}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen {...ICON} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="title-card">{t(lang, 'medina')}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {t(lang, 'book_1')} · {t(lang, 'book_2')} · {t(lang, 'book_3')}
            </div>
          </div>
          <ChevronDown
            size={18}
            color="var(--text-muted)"
            style={{ transform: medExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
          />
        </div>

        {medExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {volumes.slice(0, 3).map(vol => (
              <div
                key={vol.book_id}
                className={`glass-card${vol.is_current ? ' glass-card--gold' : ''}`}
                style={{ cursor: 'pointer', position: 'relative', padding: '10px 10px 12px' }}
                onClick={() => onOpenVolume(vol.book_id)}
              >
                {vol.is_current && (
                  <div className="badge badge--gold text-badge" style={{ position: 'absolute', top: 6, right: 6, fontSize: 8 }}>
                    {t(lang, 'current_badge')}
                  </div>
                )}
                <div className="title-card" style={{ fontSize: 12, marginBottom: 6, paddingRight: vol.is_current ? 28 : 0 }}>
                  {t(lang, `book_${vol.book_id}` as 'book_1')}
                </div>
                <ProgressBar pct={vol.pct} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {vol.learned_words}/{vol.total_words}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionTile
        icon={<div style={{ display: 'flex', gap: 2 }}><Eye size={18} color="var(--accent)" /><PenLine size={18} color="var(--accent)" /></div>}
        title={t(lang, 'tests_title')}
        subtitle={`${t(lang, 'tab_visual')} · ${t(lang, 'tab_written')}`}
        onClick={onOpenTests}
      />
      <SectionTile
        icon={<span style={{ fontSize: 22 }}>📖</span>}
        title={L(lang, 'Сарф', 'Sarf', 'Sarf', 'Сарф')}
        subtitle={L(lang, 'Урок · Тест', 'Lesson · Test', 'Dars · Test', 'Дарс · Санҷиш')}
        onClick={onOpenSarf}
      />
      <SectionTile
        icon={<span style={{ fontSize: 22 }}>✏️</span>}
        title={L(lang, 'Нахв', 'Nahw', 'Nahv', 'Наҳв')}
        subtitle={L(lang, 'Синтаксис', 'Syntax', 'Sintaksis', 'Синтаксис')}
        soonLabel={soonLabel(lang)}
      />
      <SectionTile
        icon={<Compass {...ICON} />}
        title={t(lang, 'umrah_title')}
        subtitle={`🕋 ${t(lang, 'umrah_subtitle')}`}
        onClick={onOpenGuide}
      />
      <SectionTile
        icon={<span style={{ fontSize: 22 }}>📝</span>}
        title={L(lang, 'Тренажёр слов', 'Word trainer', 'Soʻz mashqi', 'Машқи калимаҳо')}
        subtitle={L(lang, 'Свой словарь', 'Your own words', 'Oʻz soʻzlaringiz', 'Луғати худ')}
        onClick={onOpenTrainer}
        wide
      />
    </div>
  );
}

function QuranSection({ lang, onOpenQuran }: { lang: Lang; onOpenQuran: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <SectionTile
        icon={<BookOpenText {...ICON} />}
        title={L(lang, 'Слова Корана', 'Quran words', 'Qurʼon soʻzlari', 'Калимаҳои Қуръон')}
        subtitle={L(
          lang,
          'Урок = страница мусхафа · 114 сур · 30 джузов',
          'One lesson = one mushaf page · 114 surahs · 30 juz',
          'Bir dars = mushafning bir sahifasi · 114 sura · 30 pora',
          'Як дарс = як саҳифаи мусҳаф · 114 сура · 30 пора',
        )}
        onClick={onOpenQuran}
        gold
        wide
      />
      <SectionTile
        icon={<Library {...ICON} />}
        title={L(lang, '«Сирадж» — трудные слова', 'Al-Siraj — difficult words', '«Siroj» — qiyin soʻzlar', '«Сироҷ» — калимаҳои душвор')}
        subtitle={L(lang, 'Объяснения по сурам', 'Explanations by surah', 'Suralar boʻyicha izohlar', 'Шарҳҳо аз рӯи сураҳо')}
        soonLabel={soonLabel(lang)}
        wide
      />
    </div>
  );
}

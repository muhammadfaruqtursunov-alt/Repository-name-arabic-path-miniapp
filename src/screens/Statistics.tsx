import { useEffect, useState } from 'react';
import { BookOpen, Clock, Flame, MessageCircleQuestion, BookOpenText } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { Stats } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import { formatAppTime } from '../utils/formatTime';
import { learnedCount, pagesDoneCount, syncFromCloud, useQuranProgress } from '../utils/quranProgress';
import { TOTAL_PAGES } from '../utils/quranData';

interface Props { lang: Lang; }

const BOOK_ICONS = ['', '📗', '📘', '📕'];
const QURAN_WORDS_TOTAL = 4800;

function L(lang: Lang, ru: string, en: string, uz: string, tj: string): string {
  return lang === 'en' ? en : lang === 'uz' ? uz : lang === 'tj' ? tj : ru;
}

export default function Statistics({ lang }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  useQuranProgress();

  useEffect(() => { api.getStats().then(setStats).catch(() => {}); void syncFromCloud(); }, []);

  if (!stats) return (
    <div className="page-content" style={{ paddingTop: 40, textAlign: 'center' }}>
      <p className="text-muted">{t(lang, 'loading')}</p>
    </div>
  );

  const cards = [
    { label: t(lang, 'stat_words'),  value: stats.total_learned,                      icon: <BookOpen size={20} color="var(--accent)" /> },
    { label: t(lang, 'stat_hours'),  value: formatAppTime(stats.total_app_time ?? 0), icon: <Clock size={20} color="var(--accent)" /> },
    { label: t(lang, 'stat_streak'), value: `${stats.streak}`,                        icon: <Flame size={20} color="var(--accent)" /> },
    { label: t(lang, 'stat_tests'),  value: stats.questions_asked,                    icon: <MessageCircleQuestion size={20} color="var(--accent)" /> },
  ];

  return (
    <div className="screen-enter page-content" style={{ paddingTop: 20 }}>
      <h1 className="title-screen" style={{ marginBottom: 20 }}>{t(lang, 'stats_title')}</h1>

      {/* 2×2 metric grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 10px' }}>
            {/* Icon badge */}
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.icon}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {c.value}
            </div>
            <div className="text-muted" style={{ fontSize: 11, textAlign: 'center' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Progress by book */}
      <h2 className="title-card" style={{ marginBottom: 14, fontSize: 14 }}>{t(lang, 'activity_title')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          const learned = learnedCount();
          const pct = Math.round((learned / QURAN_WORDS_TOTAL) * 100);
          return (
            <div className="glass-card glass-card--gold" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpenText size={18} color="var(--accent)" />
                </div>
                <span className="title-card" style={{ flex: 1, fontSize: 13 }}>
                  {L(lang, 'Коран', 'Quran', 'Qurʼon', 'Қуръон')}
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>{pct}%</span>
              </div>
              <ProgressBar pct={pct} />
              <div className="text-muted" style={{ fontSize: 11, marginTop: 5 }}>
                {learned} / {QURAN_WORDS_TOTAL} {t(lang, 'words_count')} ·{' '}
                {L(lang, 'страниц', 'pages', 'sahifa', 'саҳифа')}: {pagesDoneCount()} / {TOTAL_PAGES}
              </div>
            </div>
          );
        })()}
        {stats.books.map((b) => (
          <div key={b.book_id} className="glass-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {/* Book icon badge */}
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                {BOOK_ICONS[b.book_id]}
              </div>
              <span className="title-card" style={{ flex: 1, fontSize: 13 }}>
                {t(lang, `book_${b.book_id}` as 'book_1')}
              </span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>
                {b.pct}%
              </span>
            </div>
            <ProgressBar pct={b.pct} />
            <div className="text-muted" style={{ fontSize: 11, marginTop: 5 }}>
              {b.learned} / {b.total} {t(lang, 'words_count')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

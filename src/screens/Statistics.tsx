import { useEffect, useState } from 'react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { Stats } from '../api/client';
import ProgressBar from '../components/ProgressBar';

interface Props { lang: Lang; }

const BOOK_EMOJIS = ['', '🟢', '🟡', '🔴'];

export default function Statistics({ lang }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { api.getStats().then(setStats).catch(() => {}); }, []);

  if (!stats) return (
    <div className="page-content" style={{ paddingTop: 40, textAlign: 'center' }}>
      <p className="text-muted">{t(lang, 'loading')}</p>
    </div>
  );

  const cards = [
    { label: t(lang, 'stat_words'), value: stats.total_learned },
    { label: t(lang, 'stat_hours'), value: t(lang, 'hours_placeholder') },
    { label: t(lang, 'stat_streak'), value: `${stats.streak} 🔥` },
    { label: t(lang, 'stat_tests'), value: stats.questions_asked },
  ];

  return (
    <div className="screen-enter page-content" style={{ paddingTop: 20 }}>
      <h1 className="title-screen" style={{ marginBottom: 20 }}>{t(lang, 'stats_title')}</h1>

      {/* 2×2 metric grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 6 }}>
              {c.value}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Progress by book */}
      <h2 className="title-card" style={{ marginBottom: 14 }}>{t(lang, 'activity_title')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stats.books.map((b) => (
          <div key={b.book_id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="title-card">
                {BOOK_EMOJIS[b.book_id]} {t(lang, `book_${b.book_id}` as 'book_1')}
              </span>
              <span style={{ color: 'var(--accent-teal)', fontWeight: 700, fontSize: 13 }}>
                {b.pct}%
              </span>
            </div>
            <ProgressBar pct={b.pct} />
            <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
              {b.learned} / {b.total} {t(lang, 'words_count')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

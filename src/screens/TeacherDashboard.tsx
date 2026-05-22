import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { TeacherStats } from '../api/client';
import type { Lang } from '../i18n';

interface Props { lang: Lang; }

export default function TeacherDashboard({ lang: _lang }: Props) {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTeacherStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingTop: 24 }}>
      <h1 className="title-screen" style={{ marginBottom: 20 }}>👨‍🏫 Кабинет учителя</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Учеников', value: stats?.total_students ?? 0, emoji: '👥' },
          { label: 'Активных', value: stats?.active_students ?? 0, emoji: '✅' },
          { label: 'Слов выучено', value: stats?.total_words_learned ?? 0, emoji: '📚' },
          { label: 'Вопросов', value: stats?.unanswered_questions ?? 0, emoji: '❓' },
        ].map((card) => (
          <div key={card.label} className="glass-card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28 }}>{card.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-gold)', marginTop: 4 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Students list */}
      <div className="glass-card">
        <p className="title-card" style={{ marginBottom: 12 }}>Топ учеников</p>
        {(stats?.students ?? []).length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Пока нет учеников</p>
        )}
        {(stats?.students ?? []).map((s, i) => (
          <div key={s.user_id}>
            {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 20 }}>{i + 1}.</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{s.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Т{s.current_book} У{s.current_lesson}</span>
              <span style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 600 }}>{s.learned} сл.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

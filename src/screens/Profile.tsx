import { useState, useEffect } from 'react';
import { Layers, TrendingUp, Timer } from 'lucide-react';
import { ACHIEVEMENTS, getUnlocked } from '../utils/achievements';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import { api } from '../api/client';
import type { Stats } from '../api/client';
import type { UserProfile } from '../api/client';
import { formatAppTime } from '../utils/formatTime';

interface Props {
  lang: Lang;
  user: UserProfile;
  onLangChange: (lang: Lang) => void;
  onResetProgress: () => void;
}

function getLevel(totalLearned: number, lang: Lang): string {
  if (totalLearned < 70)  return t(lang, 'level_beginner');
  if (totalLearned < 200) return t(lang, 'level_intermediate');
  return t(lang, 'level_advanced');
}

export default function Profile({ lang, user, onLangChange: _onLangChange, onResetProgress }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const unlockedIds = getUnlocked();
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const avatarUrl = tgUser?.photo_url;

  useEffect(() => { api.getStats().then(setStats).catch(() => {}); }, []);

  const rows = [
    { icon: <Layers size={18} />, label: t(lang, 'volume_label'), value: `📖 ${t(lang, `book_${user.current_book}` as 'book_1')}` },
    { icon: <TrendingUp size={18} />, label: t(lang, 'level_label'), value: getLevel(user.total_learned, lang) },
    { icon: <Timer size={18} />, label: t(lang, 'time_in_app'), value: stats ? formatAppTime(stats.total_app_time ?? 0) : '…' },
  ];

  return (
    <div className="screen-enter page-content" style={{ paddingTop: 32 }}>
      {/* Avatar + name */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '2.5px solid var(--accent-gold)',
          overflow: 'hidden', background: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 12px',
        }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
        </div>
        <h1 className="title-screen">{user.name}</h1>
        <div style={{ marginTop: 10 }}>
          <span className="badge badge--teal">{getLevel(user.total_learned, lang)}</span>
        </div>
      </div>

      {/* Info rows */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        {rows.map((row, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{row.icon}</span>
              <span className="text-muted" style={{ flex: 1 }}>{row.label}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <span className="title-card">{t(lang, 'achievements_title')}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent-gold)', fontWeight: 700 }}>
            {unlockedIds.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                title={ach.title}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px',
                  background: unlocked ? 'rgba(192,150,60,0.10)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${unlocked ? 'rgba(192,150,60,0.30)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                  opacity: unlocked ? 1 : 0.35,
                  transition: 'opacity 200ms',
                }}
              >
                <span style={{ fontSize: 24 }}>{ach.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: unlocked ? 'var(--accent-gold)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                  {ach.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset progress */}
      {!confirmReset ? (
        <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
          {t(lang, 'btn_reset')}
        </button>
      ) : (
        <div className="glass-card" style={{ borderColor: 'rgba(224,85,85,0.3)' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 14, fontSize: 14 }}>{t(lang, 'reset_confirm_msg')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>
              {t(lang, 'cancel')}
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onResetProgress(); setConfirmReset(false); }}>
              {t(lang, 'btn_reset_confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

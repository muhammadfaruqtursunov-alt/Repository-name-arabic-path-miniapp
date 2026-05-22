import { BookOpen, Compass, PenLine, Eye, MessageCircleQuestion, SlidersHorizontal, Layers, Flame, TrendingUp } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import type { UserProfile, VolumeInfo } from '../api/client';
import ProgressBar from '../components/ProgressBar';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  user: UserProfile;
  volumes: VolumeInfo[];
  onOpenVolume: (bookId: number) => void;
  onOpenGuide: () => void;
  onOpenTests: () => void;
  onOpenAskTeacher: () => void;
  onOpenSettings: () => void;
}

const LEVEL_EMOJIS = ['', '🟢', '🟡', '🔴'];

function getLevel(totalLearned: number, lang: Lang): string {
  if (totalLearned < 70)  return t(lang, 'level_beginner');
  if (totalLearned < 200) return t(lang, 'level_intermediate');
  return t(lang, 'level_advanced');
}

export default function Dashboard({
  lang, onLangChange: _onLangChange, user, volumes, onOpenVolume,
  onOpenGuide, onOpenTests, onOpenAskTeacher, onOpenSettings,
}: Props) {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const avatarUrl = tgUser?.photo_url;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="islamic-header"
        style={{
          padding: '16px 16px 0',
          background: 'linear-gradient(180deg, rgba(13,31,26,0.9) 0%, transparent 100%)',
        }}
      >
        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '2px solid var(--accent-gold)',
              overflow: 'hidden', background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20 }}>👤</span>}
            </div>
            <div>
              <div className="title-card">{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span className="badge badge--teal text-badge">
                  <TrendingUp size={10} />
                  {getLevel(user.total_learned, lang)}
                </span>
              </div>
            </div>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8 }}
            onClick={onOpenSettings}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Progress card */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="text-badge text-muted" style={{ marginBottom: 4 }}>
                {t(lang, 'current_volume')}
              </div>
              <div className="title-card">
                {LEVEL_EMOJIS[user.current_book] ?? '📖'}{' '}
                {user.book_info?.[`title_${lang === 'ar' ? 'ru' : lang}` as 'title_ru'] ?? user.book_info?.title_ru}
              </div>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                {user.book_info?.author}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => onOpenVolume(0)}>
              <Layers size={14} /> {t(lang, 'btn_change')}
            </button>
          </div>

          <ProgressBar pct={user.book_progress?.pct ?? 0} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {t(lang, 'words_learned')}: <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{user.book_progress?.learned}</span> / {user.book_progress?.total}
            </span>
            <span style={{ color: 'var(--accent-teal)', fontSize: 12, fontWeight: 700 }}>
              {user.book_progress?.pct}%
            </span>
          </div>

          <div className="gold-divider" />

          {/* Streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={16} color="var(--accent-gold)" />
            <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{user.streak}</span>
            <span className="text-muted" style={{ fontSize: 13 }}>{t(lang, 'streak_days')}</span>
            {user.rank && (
              <>
                <span style={{ margin: '0 4px', color: 'var(--border)' }}>·</span>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {t(lang, 'rank_label')} #{user.rank}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Grid 2×3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Books */}
          {volumes.slice(0, 3).map((vol) => (
            <div
              key={vol.book_id}
              className={`glass-card${vol.is_current ? ' glass-card--gold' : ''}`}
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => onOpenVolume(vol.book_id)}
            >
              {vol.is_current && (
                <div className="badge badge--gold text-badge" style={{ position: 'absolute', top: 10, right: 10, fontSize: 9 }}>
                  {t(lang, 'current_badge')}
                </div>
              )}
              <BookOpen size={28} color="var(--accent-teal)" style={{ marginBottom: 8 }} />
              <div className="title-card" style={{ marginBottom: 2 }}>
                {vol.level_emoji} {t(lang, `book_${vol.book_id}` as 'book_1')}
              </div>
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                {t(lang, 'medina')} · {t(lang, `book_${vol.book_id}` as 'book_1')}
              </div>
              <ProgressBar pct={vol.pct} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                {vol.learned_words} / {vol.total_words}
              </div>
            </div>
          ))}

          {/* Umrah Guide */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={onOpenGuide}>
            <Compass size={28} color="var(--accent-gold)" style={{ marginBottom: 8 }} />
            <div className="title-card" style={{ marginBottom: 2 }}>
              {t(lang, 'umrah_title')}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              🕋 {t(lang, 'umrah_subtitle')}
            </div>
          </div>

          {/* Tests */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={onOpenTests}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Eye size={22} color="var(--accent-teal)" />
              <PenLine size={22} color="var(--accent-teal)" />
            </div>
            <div className="title-card" style={{ marginBottom: 2 }}>Тесты</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {t(lang, 'tab_visual')} · {t(lang, 'tab_written')}
            </div>
          </div>

          {/* Ask teacher */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={onOpenAskTeacher}>
            <MessageCircleQuestion size={28} color="var(--accent-gold)" style={{ marginBottom: 8 }} />
            <div className="title-card" style={{ marginBottom: 2 }}>
              {t(lang, 'teacher_title')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

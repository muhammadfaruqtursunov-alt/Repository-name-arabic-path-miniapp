import { useState } from 'react';
import {
  BookOpen, Compass, PenLine, Eye, MessageCircleQuestion,
  Palette, Layers, Flame, TrendingUp, RotateCcw, ChevronDown,
} from 'lucide-react';
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
  onOpenThemes: () => void;
  onOpenReview: () => void;
  onOpenSarf: () => void;
}

function getLevel(totalLearned: number, lang: Lang): string {
  if (totalLearned < 70)  return t(lang, 'level_beginner');
  if (totalLearned < 200) return t(lang, 'level_intermediate');
  return t(lang, 'level_advanced');
}

export default function Dashboard({
  lang, onLangChange: _onLangChange, user, volumes, onOpenVolume,
  onOpenGuide, onOpenTests, onOpenAskTeacher, onOpenSettings: _onOpenSettings,
  onOpenThemes, onOpenReview, onOpenSarf,
}: Props) {
  const [medExpanded, setMedExpanded] = useState(false);

  const tgUser  = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const avatarUrl = tgUser?.photo_url;

  return (
    <div>
      {/* ── Шапка ────────────────────────────────────────────── */}
      <div
        className="islamic-header"
        style={{ padding: '16px 16px 0', background: 'linear-gradient(180deg, rgba(13,31,26,0.9) 0%, transparent 100%)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--accent-tint)', color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 20, padding: '2px 8px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  <TrendingUp size={10} />
                  {getLevel(user.total_learned, lang)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenThemes}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Palette size={18} color="var(--on-accent)" />
          </button>
        </div>
      </div>

      {/* ── Контент ──────────────────────────────────────────── */}
      <div className="page-content" style={{ paddingTop: 0 }}>

        {/* Прогресс-карточка */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="text-badge text-muted" style={{ marginBottom: 4 }}>
                {t(lang, 'current_volume')}
              </div>
              <div className="title-card">
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

        {/* Сетка кнопок */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

          {/* ── Мединский курс — сворачиваемый ── */}
          <div style={{ gridColumn: 'span 2' }}>
            {/* Заголовок группы */}
            <div
              className={`glass-card${volumes.some(v => v.is_current) ? ' glass-card--gold' : ''}`}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: medExpanded ? 8 : 0 }}
              onClick={() => setMedExpanded(!medExpanded)}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={22} color="var(--accent)" />
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

            {/* Три книги — раскрываются */}
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

          {/* ── Умра разговорник ── */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={onOpenGuide}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Compass size={22} color="var(--accent)" />
            </div>
            <div className="title-card" style={{ marginBottom: 2 }}>
              {t(lang, 'umrah_title')}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              🕋 {t(lang, 'umrah_subtitle')}
            </div>
          </div>

          {/* ── Тесты ── */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={onOpenTests}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye size={20} color="var(--accent)" />
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PenLine size={20} color="var(--accent)" />
              </div>
            </div>
            <div className="title-card" style={{ marginBottom: 2 }}>{t(lang, 'tests_title')}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {t(lang, 'tab_visual')} · {t(lang, 'tab_written')}
            </div>
          </div>

          {/* ── Вопрос учителю ── */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={onOpenAskTeacher}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <MessageCircleQuestion size={22} color="var(--accent)" />
            </div>
            <div className="title-card" style={{ marginBottom: 2 }}>
              {t(lang, 'teacher_title')}
            </div>
          </div>

          {/* ── Сарф ── */}
          <div
            className="glass-card"
            style={{ cursor: 'pointer', position: 'relative' }}
            onClick={onOpenSarf}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>📖</span>
            </div>
            <div className="title-card" style={{ marginBottom: 2 }}>
              {lang === 'ru' ? 'Сарф' : lang === 'en' ? 'Sarf' : 'Сарф'}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {lang === 'ru' ? 'Урок · Тест' : lang === 'en' ? 'Lesson · Test' : lang === 'uz' ? 'Dars · Test' : 'Дарс · Санҷиш'}
            </div>
          </div>

          {/* ── Нахв (скоро) ── */}
          <div
            className="glass-card"
            style={{ opacity: 0.55, cursor: 'default', position: 'relative' }}
          >
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'var(--accent-tint)', color: 'var(--accent)',
              borderRadius: 10, padding: '2px 7px', fontSize: 9, fontWeight: 700,
              border: '1px solid var(--accent-border)',
            }}>
              {lang === 'ru' ? 'Скоро' : lang === 'en' ? 'Soon' : lang === 'uz' ? 'Tez kunda' : 'Зуд'}
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>✏️</span>
            </div>
            <div className="title-card" style={{ marginBottom: 2 }}>
              {lang === 'ru' ? 'Нахв' : lang === 'en' ? 'Nahw' : 'Нахв'}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {lang === 'ru' ? 'Синтаксис' : lang === 'en' ? 'Syntax' : lang === 'uz' ? 'Sintaksis' : 'Синтаксис'}
            </div>
          </div>

          {/* ── Повторение SRS ── */}
          <div
            className="glass-card glass-card--gold"
            style={{ cursor: 'pointer', gridColumn: 'span 2' }}
            onClick={onOpenReview}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RotateCcw size={22} color="var(--accent)" />
              </div>
              <div>
                <div className="title-card">{t(lang, 'review_title')}</div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {t(lang, 'review_all_words')} · SRS
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

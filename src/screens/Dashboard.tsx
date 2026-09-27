import {
  MessageCircleQuestion, Palette, Layers, Flame, TrendingUp, RotateCcw,
  Languages, BookOpenText, MoonStar, ScrollText,
} from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';
import type { UserProfile, VolumeInfo } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import SectionTile from '../components/SectionTile';
import { sectionTitle, soonLabel } from './Section';
import type { SectionKey } from './Section';
import { getLastSection, lastPage, learnedCount } from '../utils/quranProgress';

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  user: UserProfile;
  volumes: VolumeInfo[];
  onOpenVolume: (bookId: number) => void;
  onOpenSection: (key: SectionKey) => void;
  onOpenQuran: () => void;
  onOpenAqidah: () => void;
  onOpenAskTeacher: () => void;
  onOpenSettings: () => void;
  onOpenThemes: () => void;
  onOpenReview: () => void;
}

function L(lang: Lang, ru: string, en: string, uz: string, tj: string): string {
  return lang === 'en' ? en : lang === 'uz' ? uz : lang === 'tj' ? tj : ru;
}

function getLevel(totalLearned: number, lang: Lang): string {
  if (totalLearned < 70)  return t(lang, 'level_beginner');
  if (totalLearned < 200) return t(lang, 'level_intermediate');
  return t(lang, 'level_advanced');
}

export default function Dashboard({
  lang, onLangChange: _onLangChange, user, volumes, onOpenVolume, onOpenSection, onOpenQuran, onOpenAqidah,
  onOpenAskTeacher, onOpenSettings: _onOpenSettings, onOpenThemes, onOpenReview,
}: Props) {
  // Карточка прогресса показывает, где ученик учился последним
  const quranLast = getLastSection() === 'quran' && lastPage() > 0;
  const quranLearned = learnedCount();
  const tgUser  = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const avatarUrl = tgUser?.photo_url;

  return (
    <div>
      {/* ── Шапка ────────────────────────────────────────────── */}
      <div
        className="islamic-header"
        style={{ padding: '16px 16px 0', background: 'var(--header-gradient)' }}
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
          {quranLast ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div className="text-badge text-muted" style={{ marginBottom: 4 }}>
                    {L(lang, 'Вы учили последним', 'Last studied', 'Oxirgi oʻrganilgan', 'Охирин омӯхташуда')}
                  </div>
                  <div className="title-card">{L(lang, 'Слова Корана', 'Quran words', 'Qurʼon soʻzlari', 'Калимаҳои Қуръон')}</div>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {L(lang, 'Страница', 'Page', 'Sahifa', 'Саҳифа')} {lastPage()} / 604
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={onOpenQuran}>
                  <BookOpenText size={14} /> {L(lang, 'Продолжить', 'Continue', 'Davom etish', 'Идома')}
                </button>
              </div>
              <ProgressBar pct={Math.round((quranLearned / 4800) * 100)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {t(lang, 'words_learned')}: <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{quranLearned}</span> / 4800
                </span>
              </div>
            </>
          ) : (<>
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
          </>)}

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

        {/* Разделы */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <SectionTile
            icon={<Languages size={22} color="var(--accent)" />}
            title={sectionTitle(lang, 'arabic')}
            subtitle={L(lang, 'Мединский курс · Сарф · Разговорник', 'Medina course · Sarf · Phrasebook', 'Madina kursi · Sarf · Soʻzlashgich', 'Курси Мадина · Сарф · Гуфтугӯ')}
            onClick={() => onOpenSection('arabic')}
            gold={volumes.some(v => v.is_current)}
          />
          <SectionTile
            icon={<BookOpenText size={22} color="var(--accent)" />}
            title={L(lang, 'Коран', 'Quran', 'Qurʼon', 'Қуръон')}
            subtitle={L(lang, 'Слова Корана по страницам', 'Quran words page by page', 'Qurʼon soʻzlari sahifalab', 'Калимаҳои Қуръон саҳифа ба саҳифа')}
            onClick={onOpenQuran}
          />
          <SectionTile
            icon={<MoonStar size={22} color="var(--accent)" />}
            title={L(lang, 'Акида', 'Aqidah', 'Aqida', 'Ақида')}
            subtitle={L(lang, 'Книги по вероучению', 'Books on creed', 'Aqida kitoblari', 'Китобҳо оид ба ақида')}
            onClick={onOpenAqidah}
          />
          <SectionTile
            icon={<ScrollText size={22} color="var(--accent)" />}
            title={L(lang, 'Хадисы', 'Hadith', 'Hadislar', 'Ҳадисҳо')}
            subtitle={L(lang, 'Сборники хадисов', 'Hadith collections', 'Hadis toʻplamlari', 'Маҷмӯаҳои ҳадис')}
            soonLabel={soonLabel(lang)}
          />
          <SectionTile
            icon={<RotateCcw size={22} color="var(--accent)" />}
            title={t(lang, 'review_title')}
            subtitle={`${t(lang, 'review_all_words')} · SRS`}
            onClick={onOpenReview}
            wide
            gold
          />
          <SectionTile
            icon={<MessageCircleQuestion size={22} color="var(--accent)" />}
            title={t(lang, 'teacher_title')}
            onClick={onOpenAskTeacher}
            wide
          />
        </div>
      </div>
    </div>
  );
}

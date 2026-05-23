import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipe } from './hooks/useSwipe';
import { t, normalizeLang, getLangDir } from './i18n';
import type { Lang } from './i18n';
import { api } from './api/client';
import type { UserProfile, VolumeInfo } from './api/client';

import BottomNav from './components/BottomNav';
import type { NavTab } from './components/BottomNav';
import AchievementPopup from './components/AchievementPopup';
import { checkAchievements } from './utils/achievements';
import type { Achievement } from './utils/achievements';

import LanguageSelect   from './screens/LanguageSelect';
import NameInput        from './screens/NameInput';
import Dashboard        from './screens/Dashboard';
import VolumeScreen     from './screens/VolumeScreen';
import Tests            from './screens/Tests';
import UmrahGuide       from './screens/UmrahGuide';
import AskTeacher       from './screens/AskTeacher';
import Statistics       from './screens/Statistics';
import Profile          from './screens/Profile';
import Settings         from './screens/Settings';
import LessonScreen     from './screens/LessonScreen';
import ReviewScreen     from './screens/ReviewScreen';
import TeacherDashboard from './screens/TeacherDashboard';
import Themes           from './screens/Themes';
import { loadTheme, applyTheme } from './utils/theme';

type Screen =
  | 'loading'
  | 'welcome'       // opened in browser (no Telegram initData)
  | 'error_retry'   // network/server error while inside Telegram
  | 'lang_select'
  | 'name_input'
  | 'dashboard'
  | 'volume'
  | 'lesson'
  | 'tests'
  | 'umrah'
  | 'ask_teacher'
  | 'review'
  | 'themes';

// ── Background helpers ────────────────────────────────────────────
const BG_STORAGE_KEY = 'ap_bg_url';

function applyBackground(url: string) {
  const el = document.getElementById('app-bg');
  if (el) (el as HTMLElement).style.backgroundImage = url ? `url(${url})` : '';
}

const TAB_ORDER: NavTab[] = ['home', 'stats', 'profile', 'settings'];

export default function App() {
  const [screen, setScreen]   = useState<Screen>('loading');
  const [lang, setLang]       = useState<Lang>('ru');
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [tab, setTab]         = useState<NavTab>('home');
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [selectedBook, setSelectedBook] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(1);
  const [onboardingLang, setOnboardingLang] = useState<Lang>('ru');
  const [initError, setInitError] = useState<string | null>(null);

  // Achievements
  const [achQueue, setAchQueue] = useState<Achievement[]>([]);
  const [currentAch, setCurrentAch] = useState<Achievement | null>(null);

  useEffect(() => {
    if (currentAch || achQueue.length === 0) return;
    setCurrentAch(achQueue[0]);
    setAchQueue(q => q.slice(1));
  }, [achQueue, currentAch]);

  // ── Session time tracking ─────────────────────────────────────────
  const sessionStart = useRef<number>(Date.now());
  useEffect(() => {
    function flushSession() {
      const secs = Math.floor((Date.now() - sessionStart.current) / 1000);
      if (secs < 5) return;
      // keepalive fetch survives page unload
      try {
        fetch(`https://arabskiy-put-v2-production.up.railway.app/api/webapp/user/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Init-Data': window.Telegram?.WebApp?.initData ?? '' },
          body: JSON.stringify({ seconds: secs }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        flushSession();
      } else {
        // App came back to foreground — reset start
        sessionStart.current = Date.now();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flushSession);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flushSession);
    };
  }, []);

  // Apply saved theme on mount (accent, surface, mood)
  useEffect(() => { applyTheme(loadTheme()); }, []);

  // Restore font sizes, colors + background from localStorage on mount
  useEffect(() => {
    const set = (key: string, cssProp: string, suffix = '') => {
      const v = localStorage.getItem(key);
      if (v) document.documentElement.style.setProperty(cssProp, `${v}${suffix}`);
    };
    set('ap_arabic_size',       '--font-arabic-size',  'px');
    set('ap_trans_size',        '--font-trans-size',   'px');
    set('ap_translation_size',  '--translation-size',  'px');
    set('ap_arabic_color',      '--arabic-color');
    set('ap_trans_color',       '--trans-color');
    set('ap_translation_color', '--translation-color');
    set('ap_arabic_weight',     '--arabic-weight');
    set('ap_arabic_style',      '--arabic-style');
    set('ap_trans_style',       '--trans-style');
    const localBg = localStorage.getItem(BG_STORAGE_KEY);
    if (localBg) applyBackground(localBg);
  }, []);

  // Apply RTL on lang change
  useEffect(() => {
    document.documentElement.dir = getLangDir(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Init Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    init();
  }, []);

  // Wait up to 3s for Telegram to populate initData
  async function waitForInitData(): Promise<string> {
    for (let i = 0; i < 15; i++) {
      const d = window.Telegram?.WebApp?.initData ?? '';
      if (d) return d;
      await new Promise(r => setTimeout(r, 200));
    }
    return '';
  }

  async function init(retryCount = 0) {
    setInitError(null);
    if (retryCount === 0) setScreen('loading');

    const initData = await waitForInitData();
    if (!initData) {
      // Not inside Telegram (browser) — show "open via Telegram" message
      setScreen('welcome');
      return;
    }

    try {
      const profile = await api.getUser();
      const appLang = normalizeLang(profile.lang);
      setLang(appLang);
      setUser(profile);
      // Check achievements on load
      try {
        const stats = await api.getStats();
        const newAchs = checkAchievements({
          totalLearned: stats.total_learned,
          streak: stats.streak,
          questionsAsked: stats.questions_asked,
        });
        if (newAchs.length > 0) setAchQueue(q => [...q, ...newAchs]);
      } catch {}
      const vols = await api.getVolumes();
      setVolumes(vols);
      // Apply global background (local override takes priority)
      try {
        const cfg = await api.getAppConfig();
        const localBg = localStorage.getItem(BG_STORAGE_KEY);
        const bgToApply = localBg !== null ? localBg : (cfg.bg_url || '');
        applyBackground(bgToApply);
      } catch {}
      setScreen('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('404') || msg.includes('not found')) {
        // New user — go to onboarding (was wrongly showing "click button" before)
        setScreen('lang_select');
      } else if (msg.includes('hash') || msg.includes('401')) {
        // Invalid Telegram session signature
        setScreen('welcome');
      } else {
        // Network/server error (Railway sleeping, timeout, 502, etc.)
        // Auto-retry once — Railway needs ~2s to wake up from sleep
        if (retryCount === 0) {
          await new Promise(r => setTimeout(r, 2500));
          return init(1);
        }
        // Second failure — show retry screen with button
        setInitError(msg);
        setScreen('error_retry');
      }
    }
  }

  async function handleCreateUser(name: string): Promise<string | null> {
    const initData = await waitForInitData();
    if (!initData) {
      return 'Откройте приложение через кнопку в Telegram боте';
    }
    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const tgId = tgUser?.id ?? 0;
      await api.createUser(name, onboardingLang, tgId);
      const profile = await api.getUser();
      setUser(profile);
      setLang(normalizeLang(profile.lang));
      const vols = await api.getVolumes();
      setVolumes(vols);
      setScreen('dashboard');
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[handleCreateUser]', msg);
      return msg;
    }
  }

  async function handleLangChange(newLang: Lang) {
    setLang(newLang);
    try { await api.setLang(newLang); } catch {}
    if (user) setUser({ ...user, lang: newLang });
  }

  function handleBgChange(url: string) {
    localStorage.setItem(BG_STORAGE_KEY, url);
    applyBackground(url);
  }

  function handleTabChange(newTab: NavTab, dir?: 'left' | 'right') {
    if (newTab === tab) return;
    const fromIdx = TAB_ORDER.indexOf(tab);
    const toIdx   = TAB_ORDER.indexOf(newTab);
    const direction = dir ?? (toIdx > fromIdx ? 'left' : 'right');
    setSlideDir(direction);
    setTab(newTab);
    if (newTab === 'home') setScreen('dashboard');
    // Reset animation class after it plays
    setTimeout(() => setSlideDir(null), 300);
  }

  const handleSwipeLeft = useCallback(() => {
    const idx = TAB_ORDER.indexOf(tab);
    if (idx < TAB_ORDER.length - 1) handleTabChange(TAB_ORDER[idx + 1], 'left');
  }, [tab]);

  const handleSwipeRight = useCallback(() => {
    const idx = TAB_ORDER.indexOf(tab);
    if (idx > 0) handleTabChange(TAB_ORDER[idx - 1], 'right');
  }, [tab]);

  const swipeHandlers = useSwipe(handleSwipeLeft, handleSwipeRight);

  // ── Screen routing ────────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="text-arabic" style={{ fontSize: 28, color: 'var(--accent-gold)', marginBottom: 16 }}>
            الطريق العربي
          </div>
          <p>{t(lang, 'loading')}</p>
        </div>
      </div>
    );
  }

  if (screen === 'welcome') {
    // No initData — user opened the URL in a browser instead of Telegram.
    // Show a minimal, clear instruction and nothing else.
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', gap: 24,
      }}>
        {/* Arabic title */}
        <div className="text-arabic" style={{ fontSize: 32, color: 'var(--accent-gold)' }}>
          الطريق العربي
        </div>

        {/* Instruction card */}
        <div className="glass-card" style={{ maxWidth: 340, padding: '28px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👆</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, lineHeight: 1.4 }}>
            Нажмите синюю кнопку<br />«Открыть приложение» выше
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Приложение работает только внутри Telegram.
            Вернитесь в бот и нажмите кнопку в меню.
          </p>
        </div>

        {/* Bot link */}
        <a
          href="https://t.me/arabskiy_put_bot"
          style={{
            color: 'var(--accent-teal)', fontSize: 14, fontWeight: 600,
            textDecoration: 'none', padding: '10px 24px',
            border: '1.5px solid rgba(45,212,160,0.4)',
            borderRadius: 16, background: 'rgba(45,212,160,0.08)',
          }}
        >
          → Открыть @arabskiy_put_bot
        </a>

        {initError && (
          <p style={{ fontSize: 11, color: 'var(--danger)', maxWidth: 300, wordBreak: 'break-all' }}>
            ⚠️ {initError}
          </p>
        )}
      </div>
    );
  }

  // ── Error + Retry screen (network/server errors inside Telegram) ──
  if (screen === 'error_retry') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', gap: 20,
      }}>
        <div className="text-arabic" style={{ fontSize: 32, color: 'var(--accent-gold)' }}>
          الطريق العربي
        </div>

        <div className="glass-card" style={{ maxWidth: 340, padding: '28px 24px' }}>
          <div style={{ fontSize: 42, marginBottom: 14 }}>📡</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, lineHeight: 1.4 }}>
            Не удалось подключиться
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Проверьте интернет-соединение и попробуйте снова. Сервер мог временно не отвечать.
          </p>
          {initError && (
            <p style={{ fontSize: 10, color: 'var(--danger)', wordBreak: 'break-all', marginBottom: 16, opacity: 0.8 }}>
              {initError}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => init()}
          >
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'lang_select') {
    return (
      <LanguageSelect
        lang={lang}
        onSelect={(l) => { setOnboardingLang(l); setLang(l); setScreen('name_input'); }}
      />
    );
  }

  if (screen === 'name_input') {
    return (
      <NameInput
        lang={onboardingLang}
        onSubmit={(name) => handleCreateUser(name)}
      />
    );
  }

  if (screen === 'volume' && user) {
    return (
      <VolumeScreen
        lang={lang}
        bookId={selectedBook}
        currentLesson={user.current_lesson}
        onBack={() => setScreen('dashboard')}
        onStartLesson={(bookId, lesson) => {
          setSelectedBook(bookId);
          setSelectedLesson(lesson);
          setScreen('lesson');   // ← go to study first, then test
        }}
      />
    );
  }

  // Lesson study screen — shows word cards before the test
  if (screen === 'lesson') {
    return (
      <LessonScreen
        lang={lang}
        bookId={selectedBook}
        lesson={selectedLesson}
        onBack={() => setScreen('volume')}
        onStartTest={() => setScreen('tests')}
      />
    );
  }

  if (screen === 'tests') {
    return (
      <Tests
        lang={lang}
        bookId={selectedBook}
        lesson={selectedLesson}
        onBack={() => setScreen('volume')}
        onRestartLesson={() => setScreen('lesson')}
      />
    );
  }

  if (screen === 'umrah') {
    return (
      <UmrahGuide lang={lang} onBack={() => setScreen('dashboard')} />
    );
  }

  if (screen === 'ask_teacher') {
    return (
      <AskTeacher lang={lang} onBack={() => setScreen('dashboard')} />
    );
  }

  if (screen === 'review') {
    return (
      <ReviewScreen lang={lang} onBack={() => setScreen('dashboard')} />
    );
  }

  if (screen === 'themes') {
    return (
      <Themes lang={lang} onBack={() => {
        if (user?.is_teacher) { setScreen('dashboard'); }
        else { setTab('settings'); setScreen('dashboard'); }
      }} />
    );
  }

  // Teacher view
  if (user?.is_teacher) {
    return (
      <TeacherDashboard
        lang={lang}
        onLangChange={handleLangChange}
        onBgChange={handleBgChange}
        onOpenThemes={() => setScreen('themes')}
      />
    );
  }

  // Dashboard + bottom nav tabs
  if (user) {
    const slideClass = slideDir === 'left'
      ? 'screen-slide-left'
      : slideDir === 'right'
      ? 'screen-slide-right'
      : '';

    return (
      <div
        style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}
        {...swipeHandlers}
      >
        <AchievementPopup achievement={currentAch} onDone={() => setCurrentAch(null)} />
        <div key={tab} className={slideClass} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {tab === 'home' && (
            <Dashboard
              lang={lang}
              onLangChange={handleLangChange}
              user={user}
              volumes={volumes}
              onOpenVolume={(bookId) => {
                setSelectedBook(bookId || user.current_book);
                setScreen('volume');
              }}
              onOpenGuide={() => setScreen('umrah')}
              onOpenTests={() => {
                setSelectedBook(user.current_book);
                setSelectedLesson(user.current_lesson);
                setScreen('lesson');  // ← study first, then test
              }}
              onOpenAskTeacher={() => setScreen('ask_teacher')}
              onOpenReview={() => setScreen('review')}
              onOpenSettings={() => handleTabChange('settings')}
              onOpenThemes={() => setScreen('themes')}
            />
          )}

          {tab === 'stats' && <Statistics lang={lang} />}

          {tab === 'profile' && (
            <Profile
              lang={lang}
              user={user}
              onLangChange={handleLangChange}
              onResetProgress={async () => { await init(); }}
            />
          )}

          {tab === 'settings' && (
            <Settings
              lang={lang}
              onLangChange={handleLangChange}
              onBgChange={handleBgChange}
              onOpenThemes={() => setScreen('themes')}
            />
          )}
        </div>

        <BottomNav active={tab} lang={lang} onChange={handleTabChange} />
      </div>
    );
  }

  return null;
}

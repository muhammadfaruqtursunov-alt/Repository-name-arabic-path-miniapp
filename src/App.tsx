import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipe } from './hooks/useSwipe';
import { t, normalizeLang, getLangDir } from './i18n';
import type { Lang } from './i18n';
import { api } from './api/client';
import type { UserProfile, VolumeInfo } from './api/client';

import BottomNav from './components/BottomNav';
import type { NavTab } from './components/BottomNav';

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
import TeacherDashboard from './screens/TeacherDashboard';

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
  | 'ask_teacher';

// â”€â”€ Background helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Session time tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        // App came back to foreground â€” reset start
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
      // Not inside Telegram (browser) â€” show "open via Telegram" message
      setScreen('welcome');
      return;
    }

    try {
      const profile = await api.getUser();
      const appLang = normalizeLang(profile.lang);
      setLang(appLang);
      setUser(profile);
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
        // New user â€” go to onboarding (was wrongly showing "click button" before)
        setScreen('lang_select');
      } else if (msg.includes('hash') || msg.includes('401')) {
        // Invalid Telegram session signature
        setScreen('welcome');
      } else {
        // Network/server error (Railway sleeping, timeout, 502, etc.)
        // Auto-retry once â€” Railway needs ~2s to wake up from sleep
        if (retryCount === 0) {
          await new Promise(r => setTimeout(r, 2500));
          return init(1);
        }
        // Second failure â€” show retry screen with button
        setInitError(msg);
        setScreen('error_retry');
      }
    }
  }

  async function handleCreateUser(name: string): Promise<string | null> {
    const initData = await waitForInitData();
    if (!initData) {
      return 'ÐžÑ‚ÐºÑ€Ð¾Ð¹Ñ‚Ðµ Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ñ‡ÐµÑ€ÐµÐ· ÐºÐ½Ð¾Ð¿ÐºÑƒ Ð² Telegram Ð±Ð¾Ñ‚Ðµ';
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

  // â”€â”€ Screen routing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (screen === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="text-arabic" style={{ fontSize: 28, color: 'var(--accent-gold)', marginBottom: 16 }}>
            Ø§Ù„Ø·Ø±ÙŠÙ‚ Ø§Ù„Ø¹Ø±Ø¨ÙŠ
          </div>
          <p>{t(lang, 'loading')}</p>
        </div>
      </div>
    );
  }

  if (screen === 'welcome') {
    // No initData â€” user opened the URL in a browser instead of Telegram.
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
          Ø§Ù„Ø·Ø±ÙŠÙ‚ Ø§Ù„Ø¹Ø±Ø¨ÙŠ
        </div>

        {/* Instruction card */}
        <div className="glass-card" style={{ maxWidth: 340, padding: '28px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ‘†</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, lineHeight: 1.4 }}>
            ÐÐ°Ð¶Ð¼Ð¸Ñ‚Ðµ ÑÐ¸Ð½ÑŽÑŽ ÐºÐ½Ð¾Ð¿ÐºÑƒ<br />Â«ÐžÑ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸ÐµÂ» Ð²Ñ‹ÑˆÐµ
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÐµÑ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð²Ð½ÑƒÑ‚Ñ€Ð¸ Telegram.
            Ð’ÐµÑ€Ð½Ð¸Ñ‚ÐµÑÑŒ Ð² Ð±Ð¾Ñ‚ Ð¸ Ð½Ð°Ð¶Ð¼Ð¸Ñ‚Ðµ ÐºÐ½Ð¾Ð¿ÐºÑƒ Ð² Ð¼ÐµÐ½ÑŽ.
          </p>
        </div>

        {/* Bot link */}
        <a
          href="https://t.me/arabskiy_put_bot"
          style={{
            color: 'var(--accent-teal)', fontSize: 14, fontWeight: 600,
            textDecoration: 'none', padding: '10px 24px',
            border: '1.5px solid rgba(192,150,60,0.35)',
            borderRadius: 16, background: 'rgba(255,255,255,0.05)',
          }}
        >
          â†’ ÐžÑ‚ÐºÑ€Ñ‹Ñ‚ÑŒ @arabskiy_put_bot
        </a>

        {initError && (
          <p style={{ fontSize: 11, color: 'var(--danger)', maxWidth: 300, wordBreak: 'break-all' }}>
            âš ï¸ {initError}
          </p>
        )}
      </div>
    );
  }

  // â”€â”€ Error + Retry screen (network/server errors inside Telegram) â”€â”€
  if (screen === 'error_retry') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', gap: 20,
      }}>
        <div className="text-arabic" style={{ fontSize: 32, color: 'var(--accent-gold)' }}>
          Ø§Ù„Ø·Ø±ÙŠÙ‚ Ø§Ù„Ø¹Ø±Ø¨ÙŠ
        </div>

        <div className="glass-card" style={{ maxWidth: 340, padding: '28px 24px' }}>
          <div style={{ fontSize: 42, marginBottom: 14 }}>ðŸ“¡</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, lineHeight: 1.4 }}>
            ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¿Ð¾Ð´ÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÑŒÑÑ
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            ÐŸÑ€Ð¾Ð²ÐµÑ€ÑŒÑ‚Ðµ Ð¸Ð½Ñ‚ÐµÑ€Ð½ÐµÑ‚-ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ðµ Ð¸ Ð¿Ð¾Ð¿Ñ€Ð¾Ð±ÑƒÐ¹Ñ‚Ðµ ÑÐ½Ð¾Ð²Ð°. Ð¡ÐµÑ€Ð²ÐµÑ€ Ð¼Ð¾Ð³ Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ Ð½Ðµ Ð¾Ñ‚Ð²ÐµÑ‡Ð°Ñ‚ÑŒ.
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
            ðŸ”„ ÐŸÐ¾Ð¿Ñ€Ð¾Ð±Ð¾Ð²Ð°Ñ‚ÑŒ ÑÐ½Ð¾Ð²Ð°
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
          setScreen('lesson');   // â† go to study first, then test
        }}
      />
    );
  }

  // Lesson study screen â€” shows word cards before the test
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

  // Teacher view
  if (user?.is_teacher) {
    return (
      <TeacherDashboard
        lang={lang}
        onLangChange={handleLangChange}
        onBgChange={handleBgChange}
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
                setScreen('lesson');  // â† study first, then test
              }}
              onOpenAskTeacher={() => setScreen('ask_teacher')}
              onOpenSettings={() => handleTabChange('settings')}
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
            <Settings lang={lang} onLangChange={handleLangChange} onBgChange={handleBgChange} />
          )}
        </div>

        <BottomNav active={tab} lang={lang} onChange={handleTabChange} />
      </div>
    );
  }

  return null;
}

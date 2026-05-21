import { useState, useEffect } from 'react';
import { t, normalizeLang, getLangDir } from './i18n';
import type { Lang } from './i18n';
import { api } from './api/client';
import type { UserProfile, VolumeInfo } from './api/client';

import BottomNav from './components/BottomNav';
import type { NavTab } from './components/BottomNav';

import Welcome       from './screens/Welcome';
import LanguageSelect from './screens/LanguageSelect';
import NameInput     from './screens/NameInput';
import Dashboard     from './screens/Dashboard';
import VolumeScreen  from './screens/VolumeScreen';
import Tests         from './screens/Tests';
import UmrahGuide    from './screens/UmrahGuide';
import AskTeacher    from './screens/AskTeacher';
import Statistics    from './screens/Statistics';
import Profile       from './screens/Profile';
import Settings      from './screens/Settings';

type Screen =
  | 'loading'
  | 'welcome'
  | 'lang_select'
  | 'name_input'
  | 'dashboard'
  | 'volume'
  | 'tests'
  | 'umrah'
  | 'ask_teacher';

export default function App() {
  const [screen, setScreen]   = useState<Screen>('loading');
  const [lang, setLang]       = useState<Lang>('ru');
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [tab, setTab]         = useState<NavTab>('home');
  const [selectedBook, setSelectedBook] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(1);
  const [onboardingLang, setOnboardingLang] = useState<Lang>('ru');
  const [initError, setInitError] = useState<string | null>(null);

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

  async function init() {
    setInitError(null);

    const initData = await waitForInitData();
    if (!initData) {
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
      setScreen('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('404') || msg.includes('not found') || msg.includes('hash') || msg.includes('401')) {
        setScreen('welcome');
      } else {
        setInitError(msg);
        setScreen('welcome');
      }
    }
  }

  async function handleCreateUser(name: string): Promise<string | null> {
    const initData = window.Telegram?.WebApp?.initData ?? '';
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

  function handleTabChange(newTab: NavTab) {
    setTab(newTab);
    if (newTab === 'home') setScreen('dashboard');
  }

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
    const hasTelegram = !!(window.Telegram?.WebApp?.initData);
    return (
      <>
        {!hasTelegram && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
            background: 'rgba(245,197,24,0.15)',
            borderBottom: '1px solid rgba(245,197,24,0.4)',
            padding: '10px 16px',
            color: '#b8860b', fontSize: 12, textAlign: 'center',
          }}>
            {window.Telegram?.WebApp?.platform === 'tdesktop'
              ? '🖥️ Нажмите кнопку «🌐 Открыть Mini App» внизу справа'
              : '⚠️ Откройте через кнопку в Telegram боте'}
          </div>
        )}
        {initError && hasTelegram && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
            background: 'rgba(224,85,85,0.15)',
            borderBottom: '1px solid rgba(224,85,85,0.4)',
            padding: '10px 16px',
            color: 'var(--danger)', fontSize: 12,
            wordBreak: 'break-all',
          }}>
            ⚠️ API error: {initError}
          </div>
        )}
        <Welcome
          lang={lang}
          onStart={() => { setInitError(null); setScreen('lang_select'); }}
          onLogin={() => init()}
        />
      </>
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
          setScreen('tests');
        }}
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

  // Dashboard + bottom nav tabs
  if (user) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
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
              setScreen('tests');
            }}
            onOpenAskTeacher={() => setScreen('ask_teacher')}
            onOpenSettings={() => setTab('settings')}
          />
        )}

        {tab === 'stats' && <Statistics lang={lang} />}

        {tab === 'profile' && (
          <Profile
            lang={lang}
            user={user}
            onLangChange={handleLangChange}
            onResetProgress={async () => {
              // Reload after reset
              await init();
            }}
          />
        )}

        {tab === 'settings' && (
          <Settings lang={lang} onLangChange={handleLangChange} />
        )}

        <BottomNav active={tab} lang={lang} onChange={handleTabChange} />
      </div>
    );
  }

  return null;
}

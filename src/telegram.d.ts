// Telegram Web App global type declaration
interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  platform: string;
  version: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    query_id?: string;
    hash?: string;
    auth_date?: number;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
  };
  requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

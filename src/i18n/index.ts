import { ru } from './ru';
import type { TranslationKeys } from './ru';
import { tj } from './tj';
import { en } from './en';
import { ar } from './ar';
import { uz } from './uz';

export type Lang = 'ru' | 'tj' | 'en' | 'ar' | 'uz';

export const LANGS: { code: Lang; label: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿', dir: 'ltr' },
  { code: 'tj', label: 'Тоҷик',  flag: '🇹🇯', dir: 'ltr' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺', dir: 'ltr' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦', dir: 'rtl' },
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
];

const translations: Record<Lang, Record<string, string>> = { ru, tj, en, ar, uz };

export function t(lang: Lang, key: TranslationKeys): string {
  const dict = translations[lang] ?? translations.ru;
  return (dict as Record<string, string>)[key] ?? (translations.ru as Record<string, string>)[key] ?? key;
}

export function getLangDir(lang: Lang): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Map any bot lang to miniapp lang */
export function normalizeLang(lang: string): Lang {
  if (['ru', 'tj', 'en', 'ar', 'uz'].includes(lang)) return lang as Lang;
  return 'ru';
}

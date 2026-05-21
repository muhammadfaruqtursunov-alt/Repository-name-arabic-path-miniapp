import { ru } from './ru';
import type { TranslationKeys } from './ru';
import { tj } from './tj';
import { en } from './en';
import { ar } from './ar';

export type Lang = 'ru' | 'tj' | 'en' | 'ar';

export const LANGS: { code: Lang; label: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'tj', label: 'Тоҷ',  flag: '🇹🇯', dir: 'ltr' },
  { code: 'ru', label: 'Рус',  flag: '🇷🇺', dir: 'ltr' },
  { code: 'ar', label: 'عرب', flag: '🇸🇦', dir: 'rtl' },
  { code: 'en', label: 'Eng',  flag: '🇬🇧', dir: 'ltr' },
];

const translations: Record<Lang, Record<string, string>> = { ru, tj, en, ar };

export function t(lang: Lang, key: TranslationKeys): string {
  const dict = translations[lang] ?? translations.ru;
  return (dict as Record<string, string>)[key] ?? (translations.ru as Record<string, string>)[key] ?? key;
}

export function getLangDir(lang: Lang): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Map bot lang (ru/tj/en/uz) to miniapp lang (ru/tj/en/ar) */
export function normalizeLang(lang: string): Lang {
  if (['ru', 'tj', 'en', 'ar'].includes(lang)) return lang as Lang;
  return 'ru';
}

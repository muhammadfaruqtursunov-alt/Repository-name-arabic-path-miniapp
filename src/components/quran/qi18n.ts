import type { Lang } from '../../i18n';

/** ru, en, uz, tj — строки раздела «Коран» (ar-интерфейс показывает ru). */
export function L(lang: Lang, ru: string, en: string, uz: string, tj: string): string {
  return lang === 'en' ? en : lang === 'uz' ? uz : lang === 'tj' ? tj : ru;
}

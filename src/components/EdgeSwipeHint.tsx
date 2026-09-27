import { useEffect } from 'react';
import type { Lang } from '../i18n';

const SEEN_KEY = 'ap_edge_hint_seen';

export function edgeHintSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}
export function markEdgeHintSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* нет доступа к хранилищу */ }
}

const TEXT: Record<'ru' | 'en' | 'uz' | 'tj', [string, string]> = {
  ru: ['Назад — свайпом от края', 'Проведите пальцем от левого или правого края экрана к центру'],
  en: ['Go back with an edge swipe', 'Swipe from the left or right edge of the screen towards the centre'],
  uz: ['Orqaga — chetdan surish', 'Barmogʻingizni ekranning chap yoki oʻng chetidan markazga qarab suring'],
  tj: ['Бозгашт — аз кунҷи экран', 'Ангуштро аз кунҷи чап ё рости экран ба сӯи марказ кашед'],
};

/**
 * Разовая анимированная подсказка для новичка: назад — свайпом от края экрана.
 * Закрывается касанием или сама через 7 секунд, больше не показывается.
 */
export default function EdgeSwipeHint({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);

  const [title, sub] = TEXT[lang === 'ar' ? 'ru' : lang];

  return (
    <div className="edge-hint" onClick={onClose} role="dialog" aria-label={title}>
      <div className="edge-hint__side edge-hint__side--l"><span className="edge-hint__finger">👆</span></div>
      <div className="edge-hint__side edge-hint__side--r"><span className="edge-hint__finger">👆</span></div>
      <div className="edge-hint__card">
        <div className="edge-hint__arrows" aria-hidden>
          <span>›››</span><span className="edge-hint__dot" /><span>‹‹‹</span>
        </div>
        <div className="edge-hint__title">{title}</div>
        <div className="edge-hint__sub">{sub}</div>
      </div>
    </div>
  );
}

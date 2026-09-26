import { useEffect, useRef } from 'react';

/** Ширина полосы у левого/правого края, откуда свайп означает «назад». */
export const EDGE_ZONE = 28;
const MIN_INWARD = 60;

export function isEdgeStart(x: number): boolean {
  return x <= EDGE_ZONE || x >= window.innerWidth - EDGE_ZONE;
}

/**
 * Свайп от края экрана внутрь = шаг назад (как на iPhone).
 * Свайпы по середине экрана не трогаем — ими листаются карточки
 * (useSwipe игнорирует касания, начатые у края).
 */
export function useEdgeSwipeBack(onBack: () => void, enabled: boolean) {
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    if (!enabled) return;
    let sx = 0;
    let sy = 0;
    let side: 'left' | 'right' | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      side = sx <= EDGE_ZONE ? 'left' : sx >= window.innerWidth - EDGE_ZONE ? 'right' : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!side) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const inward = side === 'left' ? dx : -dx;
      side = null;
      if (inward > MIN_INWARD && Math.abs(dx) > Math.abs(dy) * 1.5) cb.current();
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [enabled]);
}

/**
 * Нативная кнопка «Назад» Telegram (стрелка в шапке; на Android — ещё и
 * системный жест/кнопка «назад»). Без неё Android-жест закрывает мини-апп.
 */
export function useTelegramBackButton(visible: boolean, onBack: () => void) {
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const handler = () => cb.current();
    if (!visible) {
      bb.hide();
      return;
    }
    bb.onClick(handler);
    bb.show();
    return () => {
      bb.offClick(handler);
      bb.hide();
    };
  }, [visible]);
}

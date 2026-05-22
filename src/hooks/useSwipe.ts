import { useRef } from 'react';

/**
 * Detects horizontal swipe gestures.
 * Only fires when horizontal movement dominates vertical (real swipe, not scroll).
 */
export function useSwipe(
  onSwipeLeft:  () => void,
  onSwipeRight: () => void,
  threshold = 55,
) {
  const startX = useRef(0);
  const startY = useRef(0);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Only count as horizontal swipe if X dominates Y
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx < 0) onSwipeLeft();   // swipe left  → next tab
        else        onSwipeRight();  // swipe right → prev tab
      }
    },
  };
}

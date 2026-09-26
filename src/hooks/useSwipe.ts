import { useRef } from 'react';
import { isEdgeStart } from './useBackNavigation';

/**
 * Detects horizontal swipe gestures.
 * Only fires when horizontal movement dominates vertical (real swipe, not scroll).
 * By default ignores touches that start at the screen edge — those are the
 * "back" gesture (see useEdgeSwipeBack). Pass ignoreEdge=false on root screens
 * where there is no "back" and edge swipes should also switch tabs.
 */
export function useSwipe(
  onSwipeLeft:  () => void,
  onSwipeRight: () => void,
  threshold = 55,
  ignoreEdge = true,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const skip = useRef(false);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      skip.current = ignoreEdge && isEdgeStart(startX.current);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (skip.current) return;
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

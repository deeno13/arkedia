import { useRef, type PointerEvent } from 'react';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface SwipeOptions {
  /** Pixels of travel before a drag counts as a swipe. */
  threshold?: number;
  /** Keep reading swipes during one drag (Snake), or one swipe per touch (2048). */
  continuous?: boolean;
}

/**
 * Pointer handlers that turn a touch or mouse drag into up/down/left/right. Spread them
 * on the board and give it `touch-action: none` (`touch-none`) so the drag doesn't scroll.
 */
export function useSwipe(onSwipe: (direction: SwipeDirection) => void, { threshold = 24, continuous = false }: SwipeOptions = {}) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const locked = useRef(false);

  const end = () => {
    origin.current = null;
    locked.current = false;
  };

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      // Controls drawn over the board (dialogs, buttons) must keep their own clicks.
      if (event.target !== event.currentTarget && (event.target as Element).closest('button, a, input, select, textarea')) return;
      origin.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
      locked.current = false;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const start = origin.current;
      if (!start || start.id !== event.pointerId || locked.current) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      if (continuous) origin.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
      else locked.current = true;
    },
    onPointerUp: end,
    onPointerCancel: end,
  };
}

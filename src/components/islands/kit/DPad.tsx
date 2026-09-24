import type { SwipeDirection } from './useSwipe';

interface DPadProps {
  /** Accessible name for the group, e.g. "Steer the snake". */
  label: string;
  onPress: (direction: SwipeDirection) => void;
  disabled?: boolean;
  className?: string;
}

const PADS: { direction: SwipeDirection; area: string; points: string }[] = [
  { direction: 'up', area: 'col-start-2 row-start-1', points: '12,6 19,17 5,17' },
  { direction: 'left', area: 'col-start-1 row-start-2', points: '6,12 17,5 17,19' },
  { direction: 'right', area: 'col-start-3 row-start-2', points: '18,12 7,5 7,19' },
  { direction: 'down', area: 'col-start-2 row-start-3', points: '12,18 19,7 5,7' },
];

/**
 * On-screen direction pad for touch play. Fires on pointer down so taps feel immediate;
 * keyboard activation (Enter/Space on a focused pad) still works through click.
 */
export function DPad({ label, onPress, disabled = false, className = '' }: DPadProps) {
  return (
    <div role="group" aria-label={label} className={['grid grid-cols-3 grid-rows-3 gap-1.5', className].join(' ')}>
      {PADS.map(({ direction, area, points }) => (
        <button
          key={direction}
          type="button"
          aria-label={direction[0].toUpperCase() + direction.slice(1)}
          disabled={disabled}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            onPress(direction);
          }}
          onClick={(event) => {
            // detail === 0: activated from the keyboard, not by the pointer that already fired.
            if (event.detail === 0) onPress(direction);
          }}
          className={[
            area,
            'flex size-12 touch-manipulation select-none items-center justify-center rounded-die border-2 border-ink bg-card text-ink transition-colors duration-150',
            'hover:bg-paper-deep active:bg-ink active:text-paper disabled:cursor-not-allowed disabled:opacity-45',
          ].join(' ')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
            <polygon points={points} fill="currentColor" />
          </svg>
        </button>
      ))}
    </div>
  );
}

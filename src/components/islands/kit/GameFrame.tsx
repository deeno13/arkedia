import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

export interface GameStat {
  label: string;
  value: ReactNode;
}

export interface GameResult {
  /** Short headline, e.g. "Solved", "You lose", "Draw". */
  title: string;
  /** One line of detail, e.g. "4:12 — a new best for Hard." */
  detail?: string;
  tone: 'win' | 'loss' | 'draw';
}

interface GameFrameProps {
  /** Accessible name for the whole game region, e.g. "Sudoku board". */
  label: string;
  /** Option controls (difficulty, mode) shown at the top-left. Disable them mid-round if changing would be unfair. */
  options?: ReactNode;
  /** Live numbers (score, time, moves, best). Values render with tabular numerals. */
  stats?: GameStat[];
  onNewGame: () => void;
  newGameLabel?: string;
  /** Extra actions beside New game (Undo, Hint, Pause…). */
  actions?: ReactNode;
  /** The board. */
  children: ReactNode;
  /** Current prompt or last move, announced politely to screen readers. Always meaningful text. */
  status: ReactNode;
  /** When set, the round is over: shows the result strip in the game's ink with a play-again action. */
  result?: GameResult | null;
}

/**
 * The die-cut frame every Arkedia board sits in: options and stats on top, the board,
 * then a live status line that turns into a result strip when the round ends.
 *
 * Focus: after New game / Play again, focus moves into the board (the first
 * `[data-board-focus]`, else the first `[tabindex="0"]`, else the first enabled control),
 * so keyboard play continues. When a round ends and focus was lost (the focused control
 * became disabled), focus moves to Play again.
 */
export function GameFrame({
  label,
  options,
  stats = [],
  onNewGame,
  newGameLabel = 'New game',
  actions,
  children,
  status,
  result,
}: GameFrameProps) {
  const frameRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const hasResult = Boolean(result);

  useEffect(() => {
    const frame = frameRef.current;
    if (!hasResult || !frame) return;
    const active = document.activeElement;
    const focusLost = !active || active === document.body || (frame.contains(active) && (active as HTMLButtonElement).disabled);
    if (focusLost) frame.querySelector<HTMLElement>('[data-play-again]')?.focus({ preventScroll: true });
  }, [hasResult]);

  function startNewGame() {
    onNewGame();
    // After React commits the new round (a macrotask later), hand focus to the board.
    window.setTimeout(() => {
      const board = boardRef.current;
      const target =
        board?.querySelector<HTMLElement>('[data-board-focus]') ??
        board?.querySelector<HTMLElement>('[tabindex="0"]') ??
        board?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled)');
      target?.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <section ref={frameRef} aria-label={label} className="overflow-hidden rounded-die border-2 border-ink bg-card text-ink">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">{options}</div>
        {stats.length > 0 && (
          <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{stat.label}</dt>
                <dd className="text-base font-bold tabular-nums font-stretch-semi-expanded">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div ref={boardRef} className="relative px-3 py-4 sm:px-5 sm:py-6">{children}</div>

      <div
        className={[
          'flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink px-3 py-2.5 sm:px-4',
          result?.tone === 'win' ? 'bg-game text-on-game' : result ? 'bg-ink text-paper' : '',
        ].join(' ')}
      >
        <p aria-live="polite" aria-atomic="true" className="min-w-[min(100%,15rem)] flex-1 text-sm leading-6">
          {result ? (
            <>
              <strong className="text-base font-extrabold font-stretch-expanded">{result.title}</strong>
              {result.detail && (
                <>
                  <span className="sr-only">. </span>
                  <span className="ml-2">{result.detail}</span>
                </>
              )}
            </>
          ) : (
            status
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button
            variant={result ? 'paper' : 'primary'}
            size="sm"
            onClick={startNewGame}
            data-play-again={result ? '' : undefined}
          >
            {result ? 'Play again' : newGameLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

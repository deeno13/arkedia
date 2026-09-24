import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { recordRound } from '../../lib/progress';
import { generateLightsOut, popcount, pressMask, solveLightsOut, type LightsOutPuzzle, type LightsOutSize } from '../../lib/playable/lights-out';
import { Button } from './kit/Button';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';

const SIZES: { value: LightsOutSize; label: string }[] = [
  { value: 3, label: 'Warm-up 3×3' },
  { value: 5, label: 'Classic 5×5' },
];

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function LightsOutGame({ slug }: { slug: string }) {
  const progress = useProgress(slug);
  const [size, setSize] = usePref<LightsOutSize>(slug, 'size', 5);
  const [puzzle, setPuzzle] = useState<LightsOutPuzzle>(() => generateLightsOut(size));
  const [board, setBoard] = useState(puzzle.board);
  const [moves, setMoves] = useState(0);
  const [focused, setFocused] = useState(0);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  /** Set once a hint or the solution has been seen for this puzzle; such rounds don't set a best. */
  const [assisted, setAssisted] = useState(false);
  const [status, setStatus] = useState(`${popcount(puzzle.board)} lights on. Press a square to flip it and its neighbours.`);
  const [result, setResult] = useState<GameResult | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const cells = size * size;
  const solution = useMemo(() => solveLightsOut(size, board) ?? 0, [size, board]);
  const bucket = `${size}x${size}`;
  const best = progress.best[bucket];
  const solved = result !== null;

  function start(nextSize: LightsOutSize) {
    const next = generateLightsOut(nextSize);
    setPuzzle(next);
    setBoard(next.board);
    setMoves(0);
    setFocused(0);
    setHintCell(null);
    setShowSolution(false);
    setAssisted(false);
    setResult(null);
    setStatus(`New ${nextSize}×${nextSize} board: ${popcount(next.board)} lights on. It can be cleared in ${next.minimum} presses.`);
  }

  function changeSize(nextSize: LightsOutSize) {
    setSize(nextSize);
    start(nextSize);
  }

  function restart() {
    setBoard(puzzle.board);
    setMoves(0);
    setHintCell(null);
    setResult(null);
    setStatus(`Back to the starting board: ${popcount(puzzle.board)} lights on.`);
  }

  function press(index: number) {
    if (solved) return;
    const next = board ^ pressMask(size, index);
    const nextMoves = moves + 1;
    const where = `row ${Math.floor(index / size) + 1}, column ${(index % size) + 1}`;
    setBoard(next);
    setMoves(nextMoves);
    setFocused(index);
    setHintCell(null);
    if (next !== 0) {
      const lit = popcount(next);
      setStatus(`Pressed ${where}. ${lit} ${lit === 1 ? 'light' : 'lights'} still on.`);
      return;
    }
    const { isNewBest, previousBest } = recordRound(slug, {
      outcome: 'win',
      ...(assisted ? {} : { score: nextMoves, scoreOrder: 'lower' as const }),
      bucket,
    });
    const verdict =
      nextMoves === puzzle.minimum
        ? `${nextMoves} presses, the fewest possible.`
        : `${nextMoves} presses; the fewest possible was ${puzzle.minimum}.`;
    const bestNote = assisted
      ? ' Rounds with hints don’t set a best.'
      : isNewBest
        ? previousBest === undefined
          ? ' Your first best.'
          : ' A new best.'
        : ` Your best is ${previousBest}.`;
    setResult({ title: 'Lights out', detail: verdict + bestNote, tone: 'win' });
  }

  function hint() {
    if (solved || solution === 0) return;
    // Any press from a minimal solution is safe: presses commute, so order never matters.
    const index = Math.log2(solution & -solution);
    setHintCell(index);
    setAssisted(true);
    setFocused(index);
    cellRefs.current[index]?.focus();
    setStatus(`Hint: press row ${Math.floor(index / size) + 1}, column ${(index % size) + 1}. ${popcount(solution)} presses from here clear the board.`);
  }

  function toggleSolution() {
    const next = !showSolution;
    setShowSolution(next);
    if (next) setAssisted(true);
    setStatus(next ? `Solution shown: press the ${popcount(solution)} marked squares, in any order.` : 'Solution hidden.');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const [row, col] = [Math.floor(focused / size), focused % size];
    const targets: Record<string, number> = {
      ArrowUp: Math.max(row - 1, 0) * size + col,
      ArrowDown: Math.min(row + 1, size - 1) * size + col,
      ArrowLeft: row * size + Math.max(col - 1, 0),
      ArrowRight: row * size + Math.min(col + 1, size - 1),
      Home: row * size,
      End: row * size + size - 1,
    };
    if (!(event.key in targets) || event.altKey || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    setFocused(targets[event.key]);
    cellRefs.current[targets[event.key]]?.focus();
  }

  return (
    <GameFrame
      label="Lights Out board"
      options={<Segmented label="Board" options={SIZES} value={size} onChange={changeSize} />}
      stats={[
        { label: 'Moves', value: moves },
        { label: 'Minimum', value: puzzle.minimum },
        { label: 'Best', value: best ?? '—' },
      ]}
      onNewGame={() => start(size)}
      actions={
        solved ? (
          <Button size="sm" variant="paper" onClick={restart}>
            Replay this board
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={restart} disabled={moves === 0}>
              Restart
            </Button>
            <Button size="sm" onClick={hint}>
              Show a hint
            </Button>
            <Button size="sm" onClick={toggleSolution} aria-pressed={showSolution}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </Button>
          </>
        )
      }
      status={status}
      result={result}
    >
      <div
        role="grid"
        aria-label={`Lights Out, ${size} by ${size}`}
        aria-describedby="lights-out-keys"
        onKeyDown={handleKeyDown}
        className={['mx-auto grid w-full gap-1.5 sm:gap-2', size === 5 ? 'max-w-[23rem] grid-cols-5' : 'max-w-[15rem] grid-cols-3'].join(' ')}
      >
        {Array.from({ length: size }, (_, row) => (
          <div role="row" key={row} className="contents">
            {Array.from({ length: size }, (_, col) => {
              const index = row * size + col;
              const on = Boolean(board & (1 << index));
              const marked = (showSolution && Boolean(solution & (1 << index))) || hintCell === index;
              return (
                <div role="gridcell" key={col} className="aspect-square">
                  <button
                    type="button"
                    ref={(node) => {
                      cellRefs.current[index] = node;
                    }}
                    tabIndex={index === (focused < cells ? focused : 0) ? 0 : -1}
                    aria-label={`Row ${row + 1}, column ${col + 1}, ${on ? 'on' : 'off'}${marked ? ', press this' : ''}`}
                    onClick={() => press(index)}
                    onFocus={() => setFocused(index)}
                    disabled={solved}
                    className={[
                      'relative flex size-full items-center justify-center rounded-die border-2 border-ink transition-colors duration-150 ease-out',
                      'disabled:cursor-default',
                      on ? 'bg-game text-on-game' : 'bg-card text-ink-muted hover:bg-paper-deep',
                      hintCell === index ? 'outline-3 -outline-offset-7 outline-dashed outline-ink' : '',
                    ].join(' ')}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 40 40"
                      className={['size-3/5 transition-transform duration-200 ease-out', on ? 'scale-100' : 'scale-75'].join(' ')}
                    >
                      {on ? (
                        <g fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <circle cx="20" cy="20" r="8" />
                          {RAYS.map((angle) => (
                            <line key={angle} x1="20" y1="5" x2="20" y2="9" transform={`rotate(${angle} 20 20)`} />
                          ))}
                        </g>
                      ) : (
                        <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
                      )}
                    </svg>
                    {marked && (
                      <svg aria-hidden="true" viewBox="0 0 12 12" className="absolute left-1 top-1 size-3.5 sm:size-4">
                        <circle cx="6" cy="6" r="5" className="fill-ink" />
                        <circle cx="6" cy="6" r="2" className="fill-paper" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p id="lights-out-keys" className="mx-auto mt-4 max-w-[23rem] text-center text-xs leading-5 text-ink-muted">
        Arrow keys move between squares; Enter or Space presses. A ringed dot marks a suggested press.
      </p>
    </GameFrame>
  );
}

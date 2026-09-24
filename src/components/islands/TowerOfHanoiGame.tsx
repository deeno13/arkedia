import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from './kit/Button';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { recordRound } from '../../lib/progress';
import {
  GOAL_PEG,
  MAX_DISKS,
  MIN_DISKS,
  PEG_COUNT,
  applyMove,
  checkMove,
  createTower,
  isSolved,
  optimalMoveCount,
  solveFrom,
  topDisk,
  type Pegs,
} from '../../lib/playable/tower-of-hanoi';

const DISK_HEIGHT = 24;
const BASE_HEIGHT = 10;
/** Clearance between the top of a rod and a lifted disk. */
const LIFT_GAP = 14;

type Autoplay = 'off' | 'playing' | 'paused';

interface Round {
  disks: number;
  pegs: Pegs;
  history: Pegs[];
  selected: number | null;
  /** The solution player moved at least one disk this round. */
  assisted: boolean;
  autoplay: Autoplay;
  result: GameResult | null;
}

const newRound = (disks: number): Round => ({
  disks,
  pegs: createTower(disks),
  history: [],
  selected: null,
  assisted: false,
  autoplay: 'off',
  result: null,
});

const DISK_OPTIONS = Array.from({ length: MAX_DISKS - MIN_DISKS + 1 }, (_, index) => ({
  value: MIN_DISKS + index,
  label: String(MIN_DISKS + index),
}));

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function TowerOfHanoiGame({ slug }: { slug: string }) {
  const [diskPref, setDiskPref] = usePref(slug, 'disks', 3);
  const [round, setRound] = useState(() => newRound(Math.min(MAX_DISKS, Math.max(MIN_DISKS, diskPref))));
  const [status, setStatus] = useState('Move the tower to peg 3. Pick a peg to lift its top disk, then pick where it goes.');
  const [focusPeg, setFocusPeg] = useState(0);
  const progress = useProgress(slug);
  const pegRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** A pointer press that just lifted a disk: its click must not also drop it, and a release over another peg drops it there. */
  const press = useRef<number | null>(null);

  const { disks, pegs, history, selected, assisted, autoplay, result } = round;
  const moves = history.length;
  const optimal = optimalMoveCount(disks);
  const best = progress.best[String(disks)];
  const over = result !== null;
  const locked = over || autoplay === 'playing';
  const stackHeight = disks * DISK_HEIGHT;
  const liftBottom = BASE_HEIGHT + stackHeight + LIFT_GAP + 12;

  function startNew(nextDisks = disks) {
    setRound(newRound(nextDisks));
    setStatus(`New tower of ${nextDisks} disks on peg 1. Move it to peg 3 in as few moves as you can: the minimum is ${optimalMoveCount(nextDisks)}.`);
  }

  /** Applies a legal move and closes the round when the tower is home. */
  function commitMove(current: Round, from: number, to: number, bySolver: boolean) {
    const disk = topDisk(current.pegs, from)!;
    const next = applyMove(current.pegs, from, to);
    const used = current.history.length + 1;
    const nextAssisted = current.assisted || bySolver;
    let nextResult: GameResult | null = null;
    if (isSolved(next, current.disks)) {
      if (nextAssisted) {
        recordRound(slug, { outcome: 'complete', bucket: String(current.disks) });
        nextResult = {
          title: 'Tower moved',
          detail: `${used} moves in all, with help from the solution player. Solve it on your own to set a best.`,
          tone: 'draw',
        };
      } else {
        const { isNewBest, previousBest } = recordRound(slug, {
          outcome: 'win',
          score: used,
          scoreOrder: 'lower',
          bucket: String(current.disks),
        });
        const verdict = used === optimalMoveCount(current.disks) ? 'the minimum. Perfect.' : `the minimum is ${optimalMoveCount(current.disks)}.`;
        nextResult = {
          title: 'Solved',
          detail: `${used} moves; ${verdict}${isNewBest && previousBest !== undefined ? ` New best for ${current.disks} disks.` : ''}`,
          tone: 'win',
        };
      }
    }
    const remaining = solveFrom(next).length;
    setStatus(
      `${bySolver ? 'Solver: disk' : 'Disk'} ${disk} from peg ${from + 1} to peg ${to + 1}. Move ${used}.` +
        (nextResult ? '' : ` Fewest moves left from here: ${remaining}.`),
    );
    setRound({
      ...current,
      pegs: next,
      history: [...current.history, current.pegs],
      selected: null,
      assisted: nextAssisted,
      autoplay: nextResult ? 'off' : current.autoplay,
      result: nextResult,
    });
  }

  function choosePeg(peg: number) {
    if (locked) return;
    if (selected === null) {
      const disk = topDisk(pegs, peg);
      if (disk === undefined) {
        setStatus(`Peg ${peg + 1} is empty. Pick a peg that has disks.`);
        return;
      }
      setRound({ ...round, selected: peg });
      setStatus(`Lifted disk ${disk} from peg ${peg + 1}. Choose a peg to put it on, or Escape to cancel.`);
      return;
    }
    if (peg === selected) {
      setRound({ ...round, selected: null });
      setStatus(`Disk ${topDisk(pegs, peg)} back on peg ${peg + 1}.`);
      return;
    }
    const check = checkMove(pegs, selected, peg);
    if (!check.ok) {
      setStatus(`Disk ${check.disk} can't go on disk ${check.onto}: a bigger disk never sits on a smaller one. Pick another peg.`);
      return;
    }
    commitMove(round, selected, peg, false);
  }

  function cancel() {
    if (selected === null || locked) return;
    setRound({ ...round, selected: null });
    setStatus('Cancelled. Pick a peg to lift its top disk.');
  }

  function undo() {
    if (locked || history.length === 0) return;
    setRound({ ...round, pegs: history[history.length - 1], history: history.slice(0, -1), selected: null });
    setStatus(`Undone. Back to move ${history.length - 1}.`);
  }

  function watch() {
    setRound({ ...round, autoplay: 'playing', assisted: true, selected: null });
    setStatus(`Watching the shortest solution from here: ${solveFrom(pegs).length} moves. This round won't count as a win.`);
  }

  // The solution player: each tick asks the solver for the next optimal move from the CURRENT position,
  // so pausing, moving by hand and resuming always continues optimally.
  useEffect(() => {
    if (autoplay !== 'playing' || over) return;
    const reduced = prefersReducedMotion();
    const timer = window.setTimeout(
      () => {
        const [from, to] = solveFrom(pegs)[0];
        if (reduced || selected === from) {
          commitMove(round, from, to, true);
        } else {
          setRound({ ...round, selected: from });
        }
      },
      reduced ? 260 : selected === null ? 200 : 260,
    );
    return () => window.clearTimeout(timer);
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= PEG_COUNT) {
      event.preventDefault();
      choosePeg(digit - 1);
      setFocusPeg(digit - 1);
      pegRefs.current[digit - 1]?.focus();
    } else if (event.key === 'Escape') {
      if (selected !== null) event.preventDefault();
      cancel();
    } else if (event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      undo();
    } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && pegRefs.current.some((peg) => peg === event.target)) {
      event.preventDefault();
      const index = (focusPeg + (event.key === 'ArrowRight' ? 1 : PEG_COUNT - 1)) % PEG_COUNT;
      setFocusPeg(index);
      pegRefs.current[index]?.focus();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, peg: number) {
    press.current = null;
    if (event.button !== 0 || locked || selected !== null || pegs[peg].length === 0) return;
    press.current = peg;
    choosePeg(peg);
  }

  // Dragging: a release over a different peg drops the lifted disk there.
  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const from = press.current;
    if (from === null) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-peg]');
    const to = target ? Number(target.dataset.peg) : from;
    if (to !== from) {
      press.current = null;
      choosePeg(to);
    }
  }

  function handleClick(peg: number) {
    if (press.current === peg) {
      press.current = null;
      return;
    }
    press.current = null;
    choosePeg(peg);
  }

  return (
    <GameFrame
      label="Tower of Hanoi board"
      options={
        <Segmented
          label="Disks"
          options={DISK_OPTIONS}
          value={disks}
          disabled={autoplay === 'playing'}
          onChange={(value) => {
            setDiskPref(value);
            startNew(value);
          }}
        />
      }
      stats={[
        { label: 'Moves', value: moves },
        { label: 'Minimum', value: optimal },
        { label: 'Best', value: best === undefined ? '—' : best },
      ]}
      onNewGame={() => startNew()}
      actions={
        over ? null : (
          <>
            <Button size="sm" variant="secondary" onClick={undo} disabled={locked || moves === 0}>
              Undo
            </Button>
            {autoplay === 'off' ? (
              <Button size="sm" variant="secondary" onClick={watch}>
                Watch the solution
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const next = autoplay === 'playing' ? 'paused' : 'playing';
                    setRound({ ...round, autoplay: next, selected: null });
                    setStatus(next === 'paused' ? 'Solution paused. Move by hand if you like; Resume continues from wherever the disks are.' : 'Solution resumed.');
                  }}
                >
                  {autoplay === 'playing' ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setRound({ ...round, autoplay: 'off', selected: null });
                    setStatus('Solution stopped. Carry on by hand; this round no longer counts as a win.');
                  }}
                >
                  Stop
                </Button>
              </>
            )}
          </>
        )
      }
      status={status}
      result={result}
    >
      <div onKeyDown={handleKeyDown} onPointerUp={handlePointerUp}>
        <div role="group" aria-label="Pegs" className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {pegs.map((stack, peg) => {
            const top = stack[stack.length - 1];
            const isSource = selected === peg;
            return (
              <button
                key={peg}
                ref={(node) => {
                  pegRefs.current[peg] = node;
                }}
                type="button"
                data-peg={peg}
                tabIndex={peg === focusPeg ? 0 : -1}
                aria-disabled={locked || undefined}
                aria-label={`Peg ${peg + 1}${peg === GOAL_PEG ? ', goal' : ''}: ${
                  stack.length === 0 ? 'empty' : `disks ${stack.slice().reverse().join(', ')} from top to bottom`
                }${isSource ? `. Disk ${top} is lifted` : ''}`}
                onPointerDown={(event) => handlePointerDown(event, peg)}
                onClick={() => handleClick(peg)}
                onFocus={() => setFocusPeg(peg)}
                className={[
                  'relative block rounded-die transition-colors duration-150 select-none',
                  locked ? 'cursor-default' : 'cursor-pointer hover:bg-paper-deep',
                  isSource ? 'bg-paper-deep' : '',
                ].join(' ')}
                style={{ height: liftBottom + DISK_HEIGHT + 6 }}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 w-1.5 -translate-x-1/2 rounded-t-full bg-ink"
                  style={{ bottom: BASE_HEIGHT, height: stackHeight + LIFT_GAP }}
                />
                <span aria-hidden="true" className="absolute inset-x-1 bottom-0 rounded-[3px] bg-ink" style={{ height: BASE_HEIGHT }} />
                {stack.map((disk, level) => {
                  const lifted = isSource && level === stack.length - 1;
                  const bottom = BASE_HEIGHT + level * DISK_HEIGHT;
                  return (
                    <span
                      key={disk}
                      aria-hidden="true"
                      className={[
                        'absolute left-1/2 flex items-center justify-center rounded-[4px] border-2 border-ink text-xs font-bold tabular-nums transition-transform duration-200 ease-out',
                        lifted ? 'bg-ink text-paper' : 'bg-game text-on-game',
                      ].join(' ')}
                      style={{
                        bottom,
                        height: DISK_HEIGHT - 2,
                        width: `${24 + (disks === 1 ? 0 : ((disk - 1) / (disks - 1)) * 72)}%`,
                        transform: `translateX(-50%) translateY(${lifted ? bottom - liftBottom : 0}px)`,
                      }}
                    >
                      {disk}
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>
        <div aria-hidden="true" className="mt-2 grid grid-cols-3 gap-1.5 text-center text-xs font-semibold text-ink-soft sm:gap-3">
          {pegs.map((_, peg) => (
            <span key={peg}>
              <b className="font-bold text-ink">{peg + 1}</b>
              {peg === 0 ? ' Start' : peg === GOAL_PEG ? ' Goal' : ''}
            </span>
          ))}
        </div>
      </div>
    </GameFrame>
  );
}

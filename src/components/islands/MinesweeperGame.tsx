import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { recordRound } from '../../lib/progress';
import {
  MINESWEEPER_LEVELS,
  chord,
  createBoard,
  flagCount,
  reveal,
  toggleFlag,
  type MinesweeperBoard,
  type MinesweeperDifficulty,
} from '../../lib/playable/minesweeper';

type TapMode = 'reveal' | 'flag';

const LONG_PRESS_MS = 400;

/** Each count has its own ink, but the digit always carries the meaning. */
const NUMBER_CLASSES = ['', 'text-cobalt', 'text-green', 'text-vermilion', 'text-violet', 'text-brick', 'text-teal', 'text-ink', 'text-ink-soft'];

const LEVEL_OPTIONS = (Object.keys(MINESWEEPER_LEVELS) as MinesweeperDifficulty[]).map((value) => ({
  value,
  label: MINESWEEPER_LEVELS[value].label,
}));

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function MineIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-[62%] w-[62%] ${className}`}>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3 5.3 18.7" />
      </g>
      <circle cx="12" cy="12" r="6.5" fill="currentColor" />
      <circle cx="9.8" cy="9.8" r="1.7" className="fill-paper" />
    </svg>
  );
}

function FlagIcon({ wrong = false }: { wrong?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[62%] w-[62%]">
      <path d="M9 3.5v14" stroke="#1d1c1a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 3.5 19.5 8 10 12.5Z" className="fill-game" stroke="#1d1c1a" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 20h10" stroke="#1d1c1a" strokeWidth="3" strokeLinecap="round" />
      {wrong && (
        <g strokeLinecap="round">
          <path d="M4 4 20 20M20 4 4 20" stroke="#fbf9f4" strokeWidth="5" />
          <path d="M4 4 20 20M20 4 4 20" stroke="#1d1c1a" strokeWidth="2.4" />
        </g>
      )}
    </svg>
  );
}

export default function MinesweeperGame({ slug }: { slug: string }) {
  const [difficulty, setDifficulty] = usePref<MinesweeperDifficulty>(slug, 'difficulty', 'beginner');
  const level = MINESWEEPER_LEVELS[difficulty] ?? MINESWEEPER_LEVELS.beginner;
  const [board, setBoard] = useState<MinesweeperBoard>(() => createBoard(level));
  const [mode, setMode] = useState<TapMode>('reveal');
  const [focusIndex, setFocusIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState('Pick any square to start. The first one is always safe.');
  const [result, setResult] = useState<GameResult | null>(null);
  const record = useProgress(slug);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const press = useRef<{ index: number; x: number; y: number; timer: number; fired: boolean } | null>(null);
  const lastPointer = useRef('mouse');

  useEffect(() => {
    if (board.status !== 'playing') return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [board.status]);

  useEffect(() => () => window.clearTimeout(press.current?.timer), []);

  // Like the classic timer, the clock reads 1 the moment the first square opens.
  const elapsed = startedAt === null ? 0 : Math.max(1, Math.ceil(((endedAt ?? now) - startedAt) / 1000));
  const minesLeft = board.mines - flagCount(board);
  const over = board.status === 'won' || board.status === 'lost';
  const best = record.best[difficulty];

  function newGame(next: MinesweeperDifficulty = difficulty) {
    setBoard(createBoard(MINESWEEPER_LEVELS[next]));
    setStartedAt(null);
    setEndedAt(null);
    setResult(null);
    setFocusIndex(0);
    setStatus('Pick any square to start. The first one is always safe.');
  }

  function place(index: number) {
    return `row ${Math.floor(index / board.cols) + 1}, column ${(index % board.cols) + 1}`;
  }

  function commit(next: MinesweeperBoard, message: string) {
    if (next === board) return;
    const time = Date.now();
    const start = startedAt ?? time;
    if (startedAt === null && next.status !== 'ready') setStartedAt(time);
    setNow(time);
    setBoard(next);

    if (next.status === 'won' || next.status === 'lost') {
      setEndedAt(time);
      const seconds = Math.max(1, Math.ceil((time - start) / 1000));
      if (next.status === 'won') {
        const { isNewBest, previousBest } = recordRound(slug, { outcome: 'win', score: seconds, scoreOrder: 'lower', bucket: difficulty });
        setResult({
          title: 'Field cleared',
          detail: isNewBest
            ? `${formatTime(seconds)} on ${level.label}${previousBest === undefined ? ' — your first clear.' : ' — a new best.'}`
            : `${formatTime(seconds)} on ${level.label}. Best is ${formatTime(previousBest ?? seconds)}.`,
          tone: 'win',
        });
      } else {
        recordRound(slug, { outcome: 'loss', bucket: difficulty });
        const wrongFlags = next.cells.filter((cell) => cell.state === 'flagged' && !cell.mine).length;
        setResult({
          title: 'Mine hit',
          detail: `At ${place(next.explodedIndex ?? 0)}. All mines are shown${wrongFlags > 0 ? `; ${wrongFlags} crossed flag${wrongFlags === 1 ? ' was' : 's were'} wrong` : ''}.`,
          tone: 'loss',
        });
      }
    }
    setStatus(message);
  }

  function opened(next: MinesweeperBoard) {
    return next.cells.filter((cell, i) => cell.state === 'revealed' && board.cells[i].state !== 'revealed').length;
  }

  function doReveal(index: number) {
    const cell = board.cells[index];
    if (over) return;
    if (cell.state === 'flagged') {
      setStatus(`${place(index)} is flagged. Remove the flag first.`);
      return;
    }
    if (cell.state === 'revealed') {
      doChord(index);
      return;
    }
    const next = reveal(board, index);
    const count = opened(next);
    const shown = next.cells[index];
    commit(
      next,
      count > 1
        ? `Opened ${count} squares from ${place(index)}.`
        : `${place(index)}: ${shown.adjacent === 0 ? 'empty' : `${shown.adjacent} mine${shown.adjacent === 1 ? '' : 's'} touching`}.`,
    );
  }

  function doFlag(index: number) {
    if (over) return;
    const cell = board.cells[index];
    if (cell.state === 'revealed') {
      setStatus(`${place(index)} is already open.`);
      return;
    }
    const next = toggleFlag(board, index);
    const left = next.mines - flagCount(next);
    commit(next, `${cell.state === 'flagged' ? 'Removed flag from' : 'Flagged'} ${place(index)}. ${left} mine${left === 1 ? '' : 's'} left.`);
  }

  function doChord(index: number) {
    if (over) return;
    const cell = board.cells[index];
    if (cell.state !== 'revealed' || cell.adjacent === 0) {
      setStatus('Chord works on an open number: it opens the rest of its neighbours once enough flags touch it.');
      return;
    }
    const next = chord(board, index);
    if (next === board) {
      setStatus(`${place(index)} needs exactly ${cell.adjacent} flag${cell.adjacent === 1 ? '' : 's'} around it before it can chord.`);
      return;
    }
    commit(next, `Chorded ${place(index)}: opened ${opened(next)} square${opened(next) === 1 ? '' : 's'}.`);
  }

  function focusCell(index: number) {
    setFocusIndex(index);
    cellRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const row = Math.floor(index / board.cols);
    const col = index % board.cols;
    const key = event.key;
    let target: number | null = null;
    if (key === 'ArrowUp') target = row > 0 ? index - board.cols : index;
    else if (key === 'ArrowDown') target = row < board.rows - 1 ? index + board.cols : index;
    else if (key === 'ArrowLeft') target = col > 0 ? index - 1 : index;
    else if (key === 'ArrowRight') target = col < board.cols - 1 ? index + 1 : index;
    else if (key === 'Home') target = row * board.cols;
    else if (key === 'End') target = row * board.cols + board.cols - 1;

    if (target !== null) {
      event.preventDefault();
      focusCell(target);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      doReveal(index);
    } else if (key === 'f' || key === 'F') {
      event.preventDefault();
      doFlag(index);
    } else if (key === 'c' || key === 'C') {
      event.preventDefault();
      doChord(index);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, index: number) {
    lastPointer.current = event.pointerType;
    setFocusIndex(index);
    if (event.pointerType === 'mouse' || over) return;
    window.clearTimeout(press.current?.timer);
    const entry = { index, x: event.clientX, y: event.clientY, fired: false, timer: 0 };
    entry.timer = window.setTimeout(() => {
      entry.fired = true;
      doFlagRef.current(index);
    }, LONG_PRESS_MS);
    press.current = entry;
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const entry = press.current;
    if (entry && !entry.fired && Math.hypot(event.clientX - entry.x, event.clientY - entry.y) > 10) {
      window.clearTimeout(entry.timer);
      press.current = null;
    }
  }

  function cancelPress() {
    if (press.current && !press.current.fired) {
      window.clearTimeout(press.current.timer);
      press.current = null;
    }
  }

  function handleClick(index: number) {
    if (press.current?.fired) {
      press.current = null;
      return;
    }
    const cell = board.cells[index];
    if (cell.state === 'revealed') doChord(index);
    else if (mode === 'flag') doFlag(index);
    else doReveal(index);
  }

  // The long-press timer fires after later renders; always call the latest handler.
  const doFlagRef = useRef(doFlag);
  doFlagRef.current = doFlag;

  const cellSize = difficulty === 'beginner' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base';

  return (
    <GameFrame
      label="Minesweeper"
      options={
        <>
          <Segmented
            label="Level"
            options={LEVEL_OPTIONS}
            value={difficulty}
            onChange={(value) => {
              setDifficulty(value);
              newGame(value);
            }}
          />
          <Segmented
            label="Tap to"
            options={[
              { value: 'reveal', label: 'Reveal' },
              { value: 'flag', label: 'Flag' },
            ]}
            value={mode}
            onChange={(value) => setMode(value as TapMode)}
            disabled={over}
          />
        </>
      }
      stats={[
        { label: 'Mines', value: minesLeft },
        { label: 'Time', value: formatTime(elapsed) },
        { label: 'Best', value: best === undefined ? '—' : formatTime(best) },
      ]}
      onNewGame={() => newGame()}
      status={status}
      result={result}
    >
      <div className={difficulty === 'beginner' ? '' : '-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0'}>
        <div
          role="group"
          aria-label={`Minefield, ${board.rows} by ${board.cols}, ${board.mines} mines. Arrow keys move, Enter reveals, F flags, C chords.`}
          className={[
            'mx-auto grid select-none gap-px overflow-hidden rounded-die border-2 border-ink bg-ink',
            difficulty === 'beginner' ? 'w-full max-w-[27rem]' : 'w-[32rem] max-w-none sm:w-full sm:max-w-[40rem]',
          ].join(' ')}
          style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`, touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {board.cells.map((cell, index) => {
            const lost = board.status === 'lost';
            const exploded = board.explodedIndex === index;
            const wrongFlag = lost && cell.state === 'flagged' && !cell.mine;
            const where = `Row ${Math.floor(index / board.cols) + 1}, column ${(index % board.cols) + 1}`;
            let label = `${where}, covered`;
            let content = null;
            let tone = 'bg-paper-deep hover:bg-rule';

            if (cell.state === 'flagged') {
              label = wrongFlag ? `${where}, wrong flag, no mine here` : board.status === 'won' || lost ? `${where}, mine, flagged` : `${where}, flagged`;
              content = <FlagIcon wrong={wrongFlag} />;
              if (over) tone = 'bg-paper-deep';
            } else if (cell.state === 'revealed' && cell.mine) {
              label = exploded ? `${where}, mine, the one you hit` : `${where}, mine`;
              content = <MineIcon />;
              tone = exploded ? 'bg-ink text-paper' : 'bg-card text-ink';
            } else if (cell.state === 'revealed') {
              label = cell.adjacent === 0 ? `${where}, empty` : `${where}, ${cell.adjacent}`;
              content = cell.adjacent > 0 ? cell.adjacent : null;
              tone = `bg-card ${NUMBER_CLASSES[cell.adjacent]}`;
            } else if (over) {
              tone = 'bg-paper-deep';
            }

            return (
              <button
                key={index}
                ref={(node) => {
                  cellRefs.current[index] = node;
                }}
                type="button"
                aria-label={label}
                tabIndex={index === focusIndex ? 0 : -1}
                onFocus={() => setFocusIndex(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPointerDown={(event) => handlePointerDown(event, index)}
                onPointerMove={handlePointerMove}
                onPointerUp={cancelPress}
                onPointerCancel={cancelPress}
                onPointerLeave={cancelPress}
                onClick={() => handleClick(index)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (lastPointer.current === 'mouse') doFlag(index);
                }}
                className={[
                  'relative flex aspect-square items-center justify-center font-black leading-none tabular-nums font-stretch-semi-expanded',
                  'transition-colors duration-150 focus-visible:z-10 focus-visible:outline-offset-[-3px]',
                  exploded ? 'focus-visible:outline-paper' : '',
                  over ? 'cursor-default' : 'cursor-pointer',
                  cellSize,
                  tone,
                ].join(' ')}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </GameFrame>
  );
}

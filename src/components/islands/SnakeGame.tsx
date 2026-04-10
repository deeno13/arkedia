import { useEffect, useMemo, useState } from 'react';
import {
  SNAKE_BOARD_SIZE,
  SNAKE_START_DELAY,
  advanceSnake,
  getInitialSnakeState,
  getNextDirection,
  type CellPosition,
  type Direction,
} from '../../lib/playable/snake';

function positionsEqual(left: CellPosition, right: CellPosition) {
  return left.x === right.x && left.y === right.y;
}

const keyDirectionMap: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

export default function SnakeGame() {
  const [state, setState] = useState(() => getInitialSnakeState());
  const boardHelpId = 'snake-board-help';

  useEffect(() => {
    if (state.status !== 'playing') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((current) => advanceSnake(current));
    }, SNAKE_START_DELAY);

    return () => window.clearInterval(timer);
  }, [state.status]);

  function requestDirection(direction: Direction) {
    setState((current) => ({
      ...current,
      direction: getNextDirection(current.direction, direction),
      status: current.status === 'idle' ? 'playing' : current.status,
    }));
  }

  function togglePause() {
    setState((current) => ({
      ...current,
      status:
        current.status === 'playing'
          ? 'paused'
          : current.status === 'paused' || current.status === 'idle'
            ? 'playing'
            : current.status,
    }));
  }

  function reset() {
    setState(getInitialSnakeState());
  }

  const board = useMemo(
    () =>
      Array.from({ length: SNAKE_BOARD_SIZE * SNAKE_BOARD_SIZE }, (_, index) => {
        const x = index % SNAKE_BOARD_SIZE;
        const y = Math.floor(index / SNAKE_BOARD_SIZE);
        const cell = { x, y };
        const isHead = positionsEqual(state.snake[0], cell);
        const isBody = state.snake.slice(1).some((segment) => positionsEqual(segment, cell));
        const isFood = positionsEqual(state.food, cell);

        return { x, y, isHead, isBody, isFood };
      }),
    [state.food, state.snake],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={state.status === 'lost' ? reset : togglePause}
          className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          {state.status === 'playing'
            ? 'Pause'
            : state.status === 'paused'
              ? 'Resume'
              : state.status === 'lost'
                ? 'Start a new run'
                : 'Start'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Restart Snake
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)]">
        <div>
          <p id={boardHelpId} className="mb-3 text-sm leading-7 text-slate-700">
            Focus the board and use the arrow keys or WASD to steer. Press the space bar to pause or resume.
          </p>
          <div
            tabIndex={0}
            aria-label="Snake game board"
            aria-describedby={boardHelpId}
            onKeyDown={(event) => {
              const requested = keyDirectionMap[event.key];

              if (requested) {
                event.preventDefault();
                requestDirection(requested);
              }

              if (event.key === ' ') {
                event.preventDefault();
                togglePause();
              }
            }}
            className="grid aspect-square max-w-[28rem] grid-cols-10 gap-1 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 outline-none"
          >
            {board.map((cell) => (
              <div
                key={`${cell.x}-${cell.y}`}
                aria-hidden="true"
                className={[
                  'flex items-center justify-center rounded-md border text-[10px] font-semibold uppercase',
                  cell.isHead
                    ? 'border-sky-400 bg-sky-600 text-white'
                    : cell.isBody
                      ? 'border-sky-200 bg-sky-100 text-sky-900'
                      : cell.isFood
                        ? 'border-amber-300 bg-amber-100 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-300',
                ].join(' ')}
              >
                {cell.isHead ? 'H' : cell.isBody ? 'S' : cell.isFood ? 'F' : ''}
              </div>
            ))}
          </div>

          <div className="mt-4 grid w-full max-w-[12rem] grid-cols-3 gap-2" aria-label="Directional controls">
            <span />
            <button
              type="button"
              onClick={() => requestDirection('up')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
              aria-label="Move up"
            >
              Up
            </button>
            <span />
            <button
              type="button"
              onClick={() => requestDirection('left')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
              aria-label="Move left"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => requestDirection('down')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
              aria-label="Move down"
            >
              Down
            </button>
            <button
              type="button"
              onClick={() => requestDirection('right')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
              aria-label="Move right"
            >
              Right
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-950">Current state</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700" aria-live="polite">
              {state.status === 'lost'
                ? `Game over. Final score: ${state.score}.`
                : state.status === 'playing'
                  ? `Score ${state.score}. Snake moving ${state.direction}.`
                  : state.status === 'paused'
                    ? `Paused with score ${state.score}.`
                    : 'Ready to begin. Start the board and use the keyboard to steer.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-sky-50 px-3 py-3">
              <p className="text-slate-500">Score</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{state.score}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-slate-500">Direction</p>
              <p className="mt-1 text-lg font-semibold capitalize text-slate-950">{state.direction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

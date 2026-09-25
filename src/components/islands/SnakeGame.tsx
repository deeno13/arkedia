import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { recordRound } from '../../lib/progress';
import { OFFSETS, createSnake, step, togglePause, turn, type Direction, type SnakeState } from '../../lib/playable/snake';
import { Button } from './kit/Button';
import { DPad } from './kit/DPad';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { useSwipe } from './kit/useSwipe';

type Speed = 'slow' | 'normal' | 'fast';

const SPEEDS: Record<Speed, { label: string; ms: number }> = {
  slow: { label: 'Slow', ms: 180 },
  normal: { label: 'Normal', ms: 125 },
  fast: { label: 'Fast', ms: 85 },
};

const KEYS: Record<string, Direction> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

/** SVG units per cell. */
const U = 10;

const END_TITLES = { wall: 'Hit the wall', self: 'Bit your own tail', full: 'Board filled' } as const;

export default function SnakeGame({ slug }: { slug: string }) {
  const record = useProgress(slug);
  const [speedPref, setSpeedPref] = usePref<string>(slug, 'speed', 'normal');
  const speed: Speed = speedPref in SPEEDS ? (speedPref as Speed) : 'normal';
  const [game, setGame] = useState(() => createSnake());
  const [result, setResult] = useState<GameResult | null>(null);
  const gameRef = useRef(game);
  const boardRef = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const whereId = useId();

  function commit(next: SnakeState) {
    const previous = gameRef.current;
    if (next === previous) return;
    gameRef.current = next;
    setGame(next);
    if (next.status !== 'over' || previous.status === 'over') return;

    const label = SPEEDS[speed].label;
    const { isNewBest, previousBest } = recordRound(slug, {
      outcome: next.end === 'full' ? 'win' : 'complete',
      score: next.score,
      scoreOrder: 'higher',
      bucket: speed,
    });
    const bestNote = isNewBest
      ? previousBest === undefined
        ? `First round on ${label}.`
        : `New best on ${label}, up from ${previousBest}.`
      : `Best on ${label}: ${previousBest}.`;
    setResult({
      title: END_TITLES[next.end ?? 'wall'],
      detail: `${next.score} eaten. ${bestNote}`,
      tone: next.end === 'full' || (isNewBest && next.score > 0) ? 'win' : 'loss',
    });
  }

  function newGame() {
    commit(createSnake());
    setResult(null);
    boardRef.current?.focus();
  }

  const playing = game.status === 'playing';

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => commit(step(gameRef.current)), SPEEDS[speed].ms);
    return () => window.clearInterval(timer);
    // commit reads the latest state from gameRef; `speed` is the only render value it uses.
  }, [playing, speed]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && gameRef.current.status === 'playing') commit(togglePause(gameRef.current));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const swipe = useSwipe((direction) => commit(turn(gameRef.current, direction)), { continuous: true, threshold: 22 });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    const direction = KEYS[key];
    const onBoard = event.target === boardRef.current;
    if (direction) {
      event.preventDefault();
      commit(turn(gameRef.current, direction));
    } else if (key === 'p' || (key === ' ' && onBoard)) {
      event.preventDefault();
      const current = gameRef.current;
      if (current.status === 'ready') commit(turn(current, current.direction));
      else if (current.status === 'over') newGame();
      else commit(togglePause(current));
    } else if (key === 'enter' && onBoard && gameRef.current.status === 'over') {
      event.preventDefault();
      newGame();
    }
  }

  const { size, snake, food, status } = game;
  const head = snake[0];
  const ahead = OFFSETS[game.direction];
  const side = { x: -ahead.y, y: ahead.x };
  const eyes = [1, -1].map((sign) => ({
    x: (head.x + 0.5 + ahead.x * 0.18 + side.x * 0.22 * sign) * U,
    y: (head.y + 0.5 + ahead.y * 0.18 + side.y * 0.22 * sign) * U,
  }));
  // Run the body through segment centres, then stretch the tail end to its cell edge.
  const [tail, beforeTail] = [snake.at(-1)!, snake.at(-2) ?? head];
  const body = [...snake, { x: tail.x + (tail.x - beforeTail.x) * 0.15, y: tail.y + (tail.y - beforeTail.y) * 0.15 }]
    .map((cell, index) => `${index === 0 ? 'M' : 'L'}${(cell.x + 0.5) * U} ${(cell.y + 0.5) * U}`)
    .join(' ');
  const best = record.best[speed];

  const statusText =
    status === 'ready'
      ? 'Press an arrow key or swipe on the board to start.'
      : status === 'paused'
        ? 'Paused. Press Space, P or an arrow key to carry on.'
        : game.score === 0
          ? 'Go. Steer to the black diamond.'
          : `${game.score} eaten, snake ${snake.length} long.`;

  return (
    <GameFrame
      label="Snake"
      options={
        <Segmented
          label="Speed"
          options={(Object.keys(SPEEDS) as Speed[]).map((value) => ({ value, label: SPEEDS[value].label }))}
          value={speed}
          disabled={status === 'playing' || status === 'paused'}
          onChange={(value) => {
            setSpeedPref(value);
            if (gameRef.current.status === 'over') newGame();
          }}
        />
      }
      stats={[
        { label: 'Score', value: game.score },
        { label: 'Best', value: best ?? '–' },
      ]}
      onNewGame={newGame}
      actions={
        !result && (
          <Button
            size="sm"
            disabled={status !== 'playing' && status !== 'paused'}
            onClick={() => {
              commit(togglePause(gameRef.current));
              boardRef.current?.focus();
            }}
          >
            {status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
        )
      }
      status={statusText}
      result={result}
    >
      <div onKeyDown={handleKeyDown} className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:items-end">
        <div
          ref={boardRef}
          tabIndex={0}
          role="application"
          aria-roledescription="game board"
          aria-label={`Snake board, ${size} by ${size} squares`}
          aria-describedby={`${helpId} ${whereId}`}
          {...swipe}
          className="relative aspect-square w-full max-w-[26rem] touch-none select-none overflow-hidden rounded-die border-2 border-ink bg-paper"
        >
          <svg viewBox={`0 0 ${size * U} ${size * U}`} aria-hidden="true" className="block size-full">
            <g stroke="var(--color-rule)" strokeWidth="0.6">
              {Array.from({ length: size - 1 }, (_, index) => (
                <path key={index} d={`M${(index + 1) * U} 0V${size * U}M0 ${(index + 1) * U}H${size * U}`} />
              ))}
            </g>
            {food && (
              <polygon
                points={[
                  [food.x + 0.5, food.y + 0.12],
                  [food.x + 0.88, food.y + 0.5],
                  [food.x + 0.5, food.y + 0.88],
                  [food.x + 0.12, food.y + 0.5],
                ]
                  .map(([x, y]) => `${x * U},${y * U}`)
                  .join(' ')}
                fill="var(--color-ink)"
              />
            )}
            <path d={body} fill="none" className="stroke-game" strokeWidth={U * 0.7} strokeLinecap="square" strokeLinejoin="miter" />
            <rect x={head.x * U + 0.6} y={head.y * U + 0.6} width={U - 1.2} height={U - 1.2} rx="1.6" className="fill-game" stroke="var(--color-ink)" strokeWidth="0.9" />
            {eyes.map((eye, index) =>
              status === 'over' && game.end !== 'full' ? (
                <path
                  key={index}
                  d={`M${eye.x - 1.1} ${eye.y - 1.1}l2.2 2.2m0 -2.2l-2.2 2.2`}
                  className="stroke-on-game"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              ) : (
                <rect key={index} x={eye.x - 0.9} y={eye.y - 0.9} width="1.8" height="1.8" className="fill-on-game" />
              ),
            )}
          </svg>

          {(status === 'ready' || status === 'paused') && (
            <p className="pointer-events-none absolute inset-x-4 top-[18%] mx-auto w-fit rounded-die border-2 border-ink bg-card px-3 py-1.5 text-center text-sm font-semibold">
              {status === 'ready' ? 'Press an arrow key or swipe to start' : 'Paused'}
            </p>
          )}
          <p id={whereId} className="sr-only">
            {`Head at row ${head.y + 1}, column ${head.x + 1}, heading ${game.direction}.`}
            {food ? ` Food at row ${food.y + 1}, column ${food.x + 1}.` : ''}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DPad label="Steer the snake" onPress={(direction) => commit(turn(gameRef.current, direction))} disabled={status === 'over'} />
          <p id={helpId} className="max-w-[12rem] text-center text-xs leading-5 text-ink-soft">
            Arrows or WASD steer. Space or P pauses. On touch, swipe the board or use the pad.
          </p>
        </div>
      </div>
    </GameFrame>
  );
}

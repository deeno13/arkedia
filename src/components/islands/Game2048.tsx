import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { recordRound } from '../../lib/progress';
import { GOAL, SIZE, canMove, createBoard, liveTiles, play, topTile, type Board2048, type Move } from '../../lib/playable/2048';
import { Button } from './kit/Button';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { useProgress } from './kit/useProgress';
import { useSwipe } from './kit/useSwipe';

/**
 * A round is recorded exactly once: when the board locks up (no legal move), when the
 * player chooses "Stop here" after making 2048, or when they start a new game after
 * making 2048. A round abandoned before 2048 is not recorded.
 */
interface Round {
  board: Board2048;
  /** `goal`: 2048 just appeared and the player is choosing to stop or keep going. */
  phase: 'playing' | 'goal' | 'endless' | 'over';
  reached: boolean;
}

const KEYS: Record<string, Move> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

const INTRO = 'Slide with the arrow keys or a swipe. Equal numbers that collide merge.';

/** Paper → ink → the game's ink as values climb; every pairing keeps text ≥4.5:1. */
const LOOKS: Record<number, string> = {
  2: 'bg-card text-ink',
  4: 'bg-paper-deep text-ink',
  8: 'bg-rule text-ink',
  16: 'bg-ink-muted text-card',
  32: 'bg-ink-soft text-card',
  64: 'bg-ink text-card',
  128: 'bg-game text-on-game',
  256: 'bg-game text-on-game shadow-[inset_0_0_0_3px_var(--color-ink)]',
  512: 'bg-game text-on-game shadow-[inset_0_0_0_6px_var(--color-ink)]',
  1024: 'bg-ink text-card shadow-[inset_0_0_0_4px_var(--game-ink)]',
  2048: 'bg-game text-on-game shadow-[inset_0_0_0_3px_var(--color-ink),inset_0_0_0_6px_var(--color-card)]',
};

/** Indexed by digit count, sized against the board's width. */
const TEXT_SIZES = ['', 'text-[12cqw] font-stretch-semi-expanded', 'text-[12cqw] font-stretch-semi-expanded', 'text-[8.5cqw]', 'text-[6.8cqw]', 'text-[5.4cqw]'];

const TILE_KEYFRAMES = `
@keyframes ark-tile-appear { from { opacity: 0; transform: scale(0.4); } }
@keyframes ark-tile-merge { 0% { transform: scale(0.8); } 55% { transform: scale(1.08); } 100% { transform: scale(1); } }
`;

export default function Game2048({ slug }: { slug: string }) {
  const record = useProgress(slug);
  const [round, setRound] = useState<Round>(() => ({ board: createBoard(), phase: 'playing', reached: false }));
  const [undo, setUndo] = useState<Round | null>(null);
  const [status, setStatus] = useState(INTRO);
  const [result, setResult] = useState<GameResult | null>(null);
  const roundRef = useRef(round);
  const boardRef = useRef<HTMLDivElement>(null);
  const choiceRef = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const rowsId = useId();

  function apply(next: Round) {
    roundRef.current = next;
    setRound(next);
  }

  function finish(ended: Round) {
    const { score } = ended.board;
    const { isNewBest, previousBest } = recordRound(slug, { outcome: ended.reached ? 'win' : 'loss', score, scoreOrder: 'higher' });
    const bestNote = isNewBest
      ? previousBest === undefined
        ? 'Your first score.'
        : `New best, up from ${previousBest}.`
      : `Best: ${previousBest}.`;
    return {
      title: ended.reached ? 'You made 2048' : 'Out of moves',
      detail: `${score} points, top tile ${topTile(ended.board)}. ${bestNote}`,
      tone: ended.reached || (isNewBest && score > 0) ? 'win' : 'loss',
    } satisfies GameResult;
  }

  function move(direction: Move) {
    const current = roundRef.current;
    if (current.phase === 'goal' || current.phase === 'over') return;
    const { board, moved, gained, merges } = play(current.board, direction);
    if (!moved) {
      setStatus(`Nothing slides ${direction}. Try another direction.`);
      return;
    }
    const madeGoal = !current.reached && merges.includes(GOAL);
    const stuck = !canMove(board);
    const next: Round = {
      board,
      phase: stuck ? 'over' : madeGoal ? 'goal' : current.phase,
      reached: current.reached || madeGoal,
    };
    apply(next);
    setUndo(stuck ? null : current);
    setStatus(
      madeGoal
        ? 'You made 2048. Keep going for a bigger tile, or stop here and bank the score.'
        : `Slid ${direction}.${merges.length ? ` Merged ${merges.join(', ')} for ${gained} points.` : ''}`,
    );
    if (stuck) setResult(finish(next));
  }

  function newGame() {
    const current = roundRef.current;
    // Making 2048 is a finished achievement; starting over banks it instead of discarding it.
    if (current.reached && current.phase !== 'over') finish(current);
    apply({ board: createBoard(), phase: 'playing', reached: false });
    setUndo(null);
    setResult(null);
    setStatus(INTRO);
    boardRef.current?.focus();
  }

  function stopHere() {
    const current = roundRef.current;
    apply({ ...current, phase: 'over' });
    setUndo(null);
    setResult(finish(current));
    boardRef.current?.focus();
  }

  function keepGoing() {
    apply({ ...roundRef.current, phase: 'endless' });
    setStatus('Keep going. The round ends when no tile can move.');
    boardRef.current?.focus();
  }

  function takeBack() {
    if (!undo || roundRef.current.phase === 'over') return;
    apply(undo);
    setUndo(null);
    setStatus('Took back the last move.');
    boardRef.current?.focus();
  }

  useEffect(() => {
    if (round.phase === 'goal') choiceRef.current?.querySelector('button')?.focus();
  }, [round.phase]);

  const swipe = useSwipe(move, { threshold: 28 });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.altKey) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') {
      event.preventDefault();
      takeBack();
      return;
    }
    if (event.ctrlKey || event.metaKey) return;
    const direction = KEYS[key];
    if (direction) {
      event.preventDefault();
      move(direction);
    } else if (key === 'u') {
      event.preventDefault();
      takeBack();
    }
  }

  const { board, phase } = round;
  const live = liveTiles(board);
  const valueAt = new Map(live.map((tile) => [tile.row * SIZE + tile.col, tile.value]));
  const rows = Array.from(
    { length: SIZE },
    (_, row) => `Row ${row + 1}: ${Array.from({ length: SIZE }, (_, col) => valueAt.get(row * SIZE + col) ?? 'empty').join(', ')}.`,
  ).join(' ');

  return (
    <GameFrame
      label="2048"
      stats={[
        { label: 'Score', value: board.score },
        { label: 'Best', value: record.best.default ?? '–' },
        { label: 'Top tile', value: topTile(board) },
      ]}
      onNewGame={newGame}
      actions={
        !result && (
          <Button size="sm" disabled={!undo || phase === 'over'} onClick={takeBack}>
            Undo
          </Button>
        )
      }
      status={status}
      result={result}
    >
      <style>{TILE_KEYFRAMES}</style>
      <div
        ref={boardRef}
        tabIndex={0}
        role="application"
        aria-roledescription="game board"
        aria-label={`2048 board, score ${board.score}`}
        aria-describedby={`${helpId} ${rowsId}`}
        onKeyDown={handleKeyDown}
        {...swipe}
        className="@container relative mx-auto aspect-square w-full max-w-[28rem] touch-none select-none rounded-die border-2 border-ink bg-paper-deep [--gap:0.5rem] sm:[--gap:0.625rem]"
      >
        <div aria-hidden="true" className="absolute inset-(--gap) grid grid-cols-4 grid-rows-4 gap-(--gap)">
          {Array.from({ length: SIZE * SIZE }, (_, index) => (
            <div key={index} className="rounded-[4px] border-2 border-rule bg-paper" />
          ))}
        </div>

        <div aria-hidden="true" className="absolute inset-(--gap)">
          {board.tiles.map((tile) => (
            <div
              key={tile.id}
              style={{ transform: `translate(calc(${tile.col} * (100% + var(--gap))), calc(${tile.row} * (100% + var(--gap))))` }}
              className={[
                'absolute left-0 top-0 aspect-square w-[calc((100%-3*var(--gap))/4)] motion-safe:transition-transform motion-safe:duration-[120ms] motion-safe:ease-out',
                tile.kind === 'consumed' ? 'z-0' : tile.kind === 'merged' ? 'z-20' : 'z-10',
              ].join(' ')}
            >
              <div
                className={[
                  'flex size-full items-center justify-center rounded-[4px] border-2 border-ink font-black leading-none tabular-nums',
                  LOOKS[tile.value] ?? 'bg-ink text-card shadow-[inset_0_0_0_6px_var(--game-ink)]',
                  TEXT_SIZES[Math.min(String(tile.value).length, 5)],
                  tile.kind === 'new' ? 'motion-safe:animate-[ark-tile-appear_150ms_ease-out_100ms_backwards]' : '',
                  tile.kind === 'merged' ? 'motion-safe:animate-[ark-tile-merge_180ms_ease-out_90ms_backwards]' : '',
                ].join(' ')}
              >
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {phase === 'goal' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-paper/85 p-4">
            <div className="max-w-[18rem] rounded-die border-2 border-ink bg-card p-4 text-center">
              <p className="text-2xl font-black font-stretch-expanded">2048</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">Keep going for a bigger tile, or stop here and bank {board.score} points.</p>
              <div ref={choiceRef} className="mt-3 flex flex-wrap justify-center gap-2">
                <Button variant="primary" size="sm" onClick={keepGoing}>
                  Keep going
                </Button>
                <Button size="sm" onClick={stopHere}>
                  Stop here
                </Button>
              </div>
            </div>
          </div>
        )}

        <p id={rowsId} className="sr-only">
          {rows}
        </p>
      </div>
      <p id={helpId} className="mt-3 text-center text-xs leading-5 text-ink-soft">
        Arrows or WASD slide every tile. U undoes one move. On touch, swipe the board.
      </p>
    </GameFrame>
  );
}

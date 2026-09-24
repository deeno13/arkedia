import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { recordRound } from '../../lib/progress';
import {
  EMPTY_BOARD,
  chooseMove,
  emptyCells,
  evaluateMoves,
  findWin,
  other,
  play,
  toMove,
  type Board,
  type Level,
  type Mark,
} from '../../lib/playable/tic-tac-toe';

type Opponent = 'computer' | 'friend';
type First = 'you' | 'computer' | 'alternate';

const CELL_NAMES = ['top left', 'top middle', 'top right', 'middle left', 'centre', 'middle right', 'bottom left', 'bottom middle', 'bottom right'];
const LINE_NAMES: Record<string, string> = {
  '0,1,2': 'the top row',
  '3,4,5': 'the middle row',
  '6,7,8': 'the bottom row',
  '0,3,6': 'the left column',
  '1,4,7': 'the middle column',
  '2,5,8': 'the right column',
  '0,4,8': 'the diagonal',
  '2,4,6': 'the diagonal',
};
const OUTCOME_LABELS = { win: 'Win', draw: 'Draw', loss: 'Lose' } as const;
const THINK_MS = 350;

interface Round {
  id: number;
  board: Board;
  /** The human's mark against the computer (X always moves first). */
  humanMark: Mark;
  lastMove: number | null;
}

interface Tally {
  a: number;
  draws: number;
  b: number;
}

function MarkGlyph({ mark }: { mark: Mark }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="size-[62%] transition-[scale,opacity] duration-200 ease-out starting:scale-75 starting:opacity-0">
      {mark === 'X' ? (
        <path d="M22 22 78 78M78 22 22 78" fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      ) : (
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="12" />
      )}
    </svg>
  );
}

export default function TicTacToeGame({ slug }: { slug: string }) {
  const [opponent, setOpponent] = usePref<Opponent>(slug, 'opponent', 'computer');
  const [level, setLevel] = usePref<Level>(slug, 'level', 'medium');
  const [first, setFirst] = usePref<First>(slug, 'first', 'you');
  const [showValues, setShowValues] = usePref(slug, 'showValues', false);
  const progress = useProgress(slug);

  const startingMark = (roundNumber: number, firstChoice: First): Mark =>
    firstChoice === 'you' || (firstChoice === 'alternate' && roundNumber % 2 === 0) ? 'X' : 'O';
  const [round, setRound] = useState<Round>(() => ({ id: 0, board: EMPTY_BOARD, humanMark: startingMark(0, first), lastMove: null }));
  const [tally, setTally] = useState<Tally>({ a: 0, draws: 0, b: 0 });
  const [focused, setFocused] = useState(4);
  const finishedRound = useRef(-1);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { board, humanMark } = round;
  const vsComputer = opponent === 'computer';
  const cpuMark = other(humanMark);
  const win = findWin(board);
  const over = Boolean(win) || emptyCells(board).length === 0;
  const turn = toMove(board);
  const cpuTurn = vsComputer && !over && turn === cpuMark;
  const values = showValues && !over && !cpuTurn ? evaluateMoves(board) : null;

  function startRound(options: { first?: First; resetTally?: boolean } = {}) {
    const id = round.id + 1;
    setRound({ id, board: EMPTY_BOARD, humanMark: startingMark(id, options.first ?? first), lastMove: null });
    if (options.resetTally) setTally({ a: 0, draws: 0, b: 0 });
  }

  function applyMove(index: number) {
    if (over || board[index]) return;
    const next = play(board, index, turn);
    setRound({ ...round, board: next, lastMove: index });
    const winner = findWin(next)?.mark;
    if (!winner && emptyCells(next).length > 0) return;
    if (finishedRound.current === round.id) return;
    finishedRound.current = round.id;
    // Tally sides: "a" is you (or X), "b" is the computer (or O).
    const aMark = vsComputer ? humanMark : 'X';
    setTally((current) =>
      !winner
        ? { ...current, draws: current.draws + 1 }
        : winner === aMark
          ? { ...current, a: current.a + 1 }
          : { ...current, b: current.b + 1 },
    );
    if (vsComputer) recordRound(slug, { outcome: !winner ? 'draw' : winner === humanMark ? 'win' : 'loss', bucket: level });
  }

  useEffect(() => {
    if (!cpuTurn) return;
    const timer = window.setTimeout(() => applyMove(chooseMove(board, level)), THINK_MS);
    return () => window.clearTimeout(timer);
    // applyMove reads this same round; the effect re-arms whenever the round changes.
  }, [round, cpuTurn, level]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      const col = focused % 3;
      const next =
        event.key === 'ArrowLeft' ? focused - col + ((col + 2) % 3) : event.key === 'ArrowRight' ? focused - col + ((col + 1) % 3) : (focused + delta + 9) % 9;
      setFocused(next);
      cellRefs.current[next]?.focus();
      return;
    }
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      const index = Number(event.key) - 1;
      setFocused(index);
      cellRefs.current[index]?.focus();
      if (!cpuTurn) applyMove(index);
    }
  }

  const markName = (mark: Mark) => (vsComputer ? (mark === humanMark ? `you (${mark})` : `the computer (${mark})`) : mark);
  const lastMark = round.lastMove === null ? null : board[round.lastMove];
  const lastMoveText =
    round.lastMove === null || !lastMark
      ? ''
      : vsComputer
        ? `${lastMark === humanMark ? 'You' : 'The computer'} took ${CELL_NAMES[round.lastMove]}. `
        : `${lastMark} took ${CELL_NAMES[round.lastMove]}. `;
  const status = cpuTurn
    ? `${lastMoveText}The computer is thinking…`
    : vsComputer
      ? `${lastMoveText}Your move — you are ${humanMark}${round.lastMove === null ? (humanMark === 'X' ? ' and go first' : '') : ''}.`
      : `${lastMoveText}${turn} to move.`;

  let result: GameResult | null = null;
  if (over) {
    const where = win ? `Three in a row on ${LINE_NAMES[win.line.join(',')]}.` : '';
    if (!win) result = { title: 'Draw', detail: 'Every square is full and nobody made three. With best play, this is how it always ends.', tone: 'draw' };
    else if (!vsComputer) result = { title: `${win.mark} wins`, detail: where, tone: win.mark === 'X' ? 'win' : 'loss' };
    else if (win.mark === humanMark) result = { title: 'You win', detail: where, tone: 'win' };
    else result = { title: 'The computer wins', detail: `${where} Replay it and look for the fork.`, tone: 'loss' };
  }

  const stats = vsComputer
    ? [
        { label: 'You', value: tally.a },
        { label: 'Draws', value: tally.draws },
        { label: 'Computer', value: tally.b },
        { label: 'Best streak', value: progress.bestStreak },
      ]
    : [
        { label: 'X', value: tally.a },
        { label: 'Draws', value: tally.draws },
        { label: 'O', value: tally.b },
      ];

  return (
    <GameFrame
      label="Tic-tac-toe"
      options={
        <>
          <Segmented<Opponent>
            label="Opponent"
            value={opponent}
            options={[
              { value: 'computer', label: 'Computer' },
              { value: 'friend', label: 'Two players' },
            ]}
            onChange={(value) => {
              setOpponent(value);
              startRound({ resetTally: true });
            }}
          />
          {vsComputer && (
            <>
              <Segmented<Level>
                label="Level"
                value={level}
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
                onChange={(value) => {
                  setLevel(value);
                  startRound({ resetTally: true });
                }}
              />
              <Segmented<First>
                label="First move"
                value={first}
                options={[
                  { value: 'you', label: 'You' },
                  { value: 'computer', label: 'Computer' },
                  { value: 'alternate', label: 'Take turns' },
                ]}
                onChange={(value) => {
                  setFirst(value);
                  startRound({ first: value });
                }}
              />
            </>
          )}
        </>
      }
      stats={stats}
      onNewGame={() => startRound()}
      status={status}
      result={result}
    >
      <div className="mx-auto w-full max-w-[20rem]">
        <div
          role="group"
          aria-label={`Board. ${vsComputer ? `You are ${humanMark}.` : 'X moves first.'} Arrow keys move between squares, Enter plays, or press 1 to 9.`}
          onKeyDown={handleKeyDown}
          className="grid aspect-square grid-cols-3"
        >
          {board.map((cell, index) => {
            const inLine = win?.line.includes(index) ?? false;
            const humanPiece = vsComputer ? cell === humanMark : cell === 'X';
            const value = values?.[index];
            const blocked = Boolean(cell) || over || cpuTurn;
            return (
              <button
                key={index}
                ref={(node) => {
                  cellRefs.current[index] = node;
                }}
                type="button"
                tabIndex={index === focused ? 0 : -1}
                aria-disabled={blocked}
                aria-label={`${CELL_NAMES[index]}, ${cell ? markName(cell) : 'empty'}${inLine ? ', winning line' : ''}${value ? `, ${OUTCOME_LABELS[value].toLowerCase()} with best play` : ''}`}
                onFocus={() => setFocused(index)}
                onClick={() => {
                  if (!blocked) applyMove(index);
                }}
                className={[
                  'flex items-center justify-center border-ink transition-colors duration-150 focus-visible:outline-offset-[-7px]',
                  index % 3 < 2 ? 'border-r-[6px]' : '',
                  index < 6 ? 'border-b-[6px]' : '',
                  inLine ? (humanPiece ? 'bg-game text-on-game' : 'bg-ink text-paper outline-paper') : 'bg-card',
                  !inLine && cell ? (humanPiece ? 'text-game' : 'text-ink') : '',
                  blocked ? 'cursor-default' : 'cursor-pointer hover:bg-paper-deep',
                ].join(' ')}
              >
                {cell ? (
                  <MarkGlyph mark={cell} />
                ) : value ? (
                  <span
                    aria-hidden="true"
                    className={[
                      'text-xs font-bold uppercase tracking-wide font-stretch-semi-expanded',
                      value === 'win' ? 'text-ink underline decoration-2 underline-offset-4' : value === 'draw' ? 'text-ink-soft' : 'text-ink-muted line-through',
                    ].join(' ')}
                  >
                    {OUTCOME_LABELS[value]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-ink-soft">
          <input
            type="checkbox"
            checked={showValues}
            onChange={(event) => setShowValues(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-ink"
          />
          <span>
            <span className="font-semibold text-ink">Show what the computer sees.</span> Each empty square is labelled with how the game ends for the
            player to move if they go there and both sides then play perfectly.
          </span>
        </label>
      </div>
    </GameFrame>
  );
}

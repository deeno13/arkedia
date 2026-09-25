import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { recordRound } from '../../lib/progress';
import {
  COLS,
  EMPTY_BOARD,
  ROWS,
  chooseMove,
  drop,
  isFull,
  landingRow,
  lineThrough,
  other,
  type Board,
  type Disc,
  type Level,
} from '../../lib/playable/connect-four';

type Opponent = 'computer' | 'friend';
type First = 'you' | 'computer' | 'alternate';

const THINK_MS = 350;
/* Rack geometry in SVG units: 100 per hole, a preview row above, a 10-unit frame lip. */
const PAD = 10;
const TOP = 110;
const WIDTH = COLS * 100 + PAD * 2;
const HEIGHT = TOP + ROWS * 100 + PAD * 2;
const HOLE_R = 41;
const DISC_R = 34;
const cx = (col: number) => PAD + 50 + col * 100;
const cy = (row: number) => TOP + PAD + 50 + row * 100;
const RACK_PATH =
  `M0 ${TOP + 12}a12 12 0 0 1 12 -12H${WIDTH - 12}a12 12 0 0 1 12 12V${HEIGHT}H0Z` +
  Array.from({ length: ROWS * COLS }, (_, index) => {
    const x = cx(index % COLS);
    const y = cy(Math.floor(index / COLS));
    return `M${x - HOLE_R} ${y}a${HOLE_R} ${HOLE_R} 0 1 0 ${HOLE_R * 2} 0a${HOLE_R} ${HOLE_R} 0 1 0 ${-HOLE_R * 2} 0Z`;
  }).join('');

interface Round {
  id: number;
  board: Board;
  /** Which disc the human plays against the computer (disc 1 always moves first). */
  humanDisc: Disc;
  last: { row: number; col: number } | null;
}

/** Disc owned by the player (game ink, plain) or the opponent (ink, with a paper ring so it differs without colour). */
function DiscShape({ x, y, mine, dropFrom }: { x: number; y: number; mine: boolean; dropFrom?: number }) {
  return (
    <g
      className={dropFrom === undefined ? '' : 'transition-transform duration-200 ease-in starting:[transform:translateY(var(--drop-from))]'}
      style={dropFrom === undefined ? undefined : ({ '--drop-from': `${dropFrom}px` } as CSSProperties)}
    >
      <circle cx={x} cy={y} r={DISC_R} className={mine ? 'fill-game' : 'fill-ink'} />
      {!mine && <circle cx={x} cy={y} r={DISC_R * 0.55} fill="none" className="stroke-paper" strokeWidth="5" />}
    </g>
  );
}

export default function ConnectFourGame({ slug }: { slug: string }) {
  const [opponent, setOpponent] = usePref<Opponent>(slug, 'opponent', 'computer');
  const [level, setLevel] = usePref<Level>(slug, 'level', 'medium');
  const [first, setFirst] = usePref<First>(slug, 'first', 'you');
  const progress = useProgress(slug);

  const startingDisc = (roundNumber: number, firstChoice: First): Disc =>
    firstChoice === 'you' || (firstChoice === 'alternate' && roundNumber % 2 === 0) ? 1 : 2;
  const [round, setRound] = useState<Round>(() => ({ id: 0, board: EMPTY_BOARD, humanDisc: startingDisc(0, first), last: null }));
  const [tally, setTally] = useState({ a: 0, draws: 0, b: 0 });
  const [focused, setFocused] = useState(3);
  const [hovered, setHovered] = useState<number | null>(null);
  const [boardFocused, setBoardFocused] = useState(false);
  const finishedRound = useRef(-1);
  const columnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { board, humanDisc, last } = round;
  const vsComputer = opponent === 'computer';
  const discsPlayed = board.filter(Boolean).length;
  const turn: Disc = discsPlayed % 2 === 0 ? 1 : 2;
  const winLine = last ? lineThrough(board, last.row, last.col) : null;
  const over = Boolean(winLine) || isFull(board);
  const cpuTurn = vsComputer && !over && turn !== humanDisc;
  // Colour belongs to a person: against the computer you are always game ink; two players: first player is game ink.
  const mineDisc: Disc = vsComputer ? humanDisc : 1;
  const previewCol = over || cpuTurn ? null : (hovered ?? (boardFocused ? focused : null));
  const previewRow = previewCol === null ? -1 : landingRow(board, previewCol);

  function startRound(options: { first?: First; resetTally?: boolean } = {}) {
    const id = round.id + 1;
    setRound({ id, board: EMPTY_BOARD, humanDisc: startingDisc(id, options.first ?? first), last: null });
    if (options.resetTally) setTally({ a: 0, draws: 0, b: 0 });
  }

  function dropIn(col: number) {
    if (over || landingRow(board, col) < 0) return;
    const { board: next, row } = drop(board, col, turn);
    setRound({ ...round, board: next, last: { row, col } });
    const won = Boolean(lineThrough(next, row, col));
    if (!won && !isFull(next)) return;
    if (finishedRound.current === round.id) return;
    finishedRound.current = round.id;
    const winner = won ? turn : null;
    setTally((current) =>
      winner === null ? { ...current, draws: current.draws + 1 } : winner === mineDisc ? { ...current, a: current.a + 1 } : { ...current, b: current.b + 1 },
    );
    if (!vsComputer) return;
    if (winner === humanDisc) {
      recordRound(slug, {
        outcome: 'win',
        score: next.filter((cell) => cell === humanDisc).length,
        scoreOrder: 'lower',
        bucket: level,
      });
    } else recordRound(slug, { outcome: winner === null ? 'draw' : 'loss', bucket: level });
  }

  useEffect(() => {
    if (!cpuTurn) return;
    const timer = window.setTimeout(() => dropIn(chooseMove(board, turn, level)), THINK_MS);
    return () => window.clearTimeout(timer);
    // dropIn reads this same round; the effect re-arms whenever the round changes.
  }, [round, cpuTurn, level]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next =
        event.key === 'Home' ? 0 : event.key === 'End' ? COLS - 1 : (focused + (event.key === 'ArrowLeft' ? COLS - 1 : 1)) % COLS;
      setFocused(next);
      setHovered(null);
      columnRefs.current[next]?.focus();
      return;
    }
    if (/^[1-7]$/.test(event.key)) {
      event.preventDefault();
      const col = Number(event.key) - 1;
      setFocused(col);
      columnRefs.current[col]?.focus();
      if (!cpuTurn) dropIn(col);
    }
  }

  const sideName = (disc: Disc) =>
    vsComputer ? (disc === humanDisc ? 'You' : 'The computer') : `Player ${disc} (${disc === mineDisc ? 'solid' : 'ringed'})`;
  /** How a disc's owner reads inside a column summary: "yours, computer, yours" or "Player 1, Player 2". */
  const discOwner = (disc: Disc) => (vsComputer ? (disc === humanDisc ? 'yours' : 'computer') : `Player ${disc}`);
  const lastText = last ? `${sideName(board[last.row * COLS + last.col] as Disc)} dropped in column ${last.col + 1}. ` : '';
  const status = cpuTurn
    ? `${lastText}The computer is thinking…`
    : vsComputer
      ? `${lastText}Your move — you play the solid discs${last ? '' : humanDisc === 1 ? ' and go first' : ''}.`
      : `${lastText}Player ${turn}, ${turn === mineDisc ? 'solid' : 'ringed'} discs, to move.`;

  let result: GameResult | null = null;
  if (over) {
    const direction = !winLine
      ? ''
      : winLine[1] - winLine[0] === 1
        ? 'across'
        : winLine[1] - winLine[0] === COLS
          ? 'up and down'
          : 'on a diagonal';
    const winner = last ? board[last.row * COLS + last.col] : 0;
    if (!winLine) result = { title: 'Draw', detail: 'The rack is full and nobody connected four.', tone: 'draw' };
    else if (!vsComputer)
      result = { title: `Player ${winner} wins`, detail: `Four ${direction}.`, tone: winner === mineDisc ? 'win' : 'loss' };
    else if (winner === humanDisc)
      result = { title: 'You win', detail: `Four ${direction}, using ${board.filter((cell) => cell === humanDisc).length} discs.`, tone: 'win' };
    else result = { title: 'The computer wins', detail: `Four ${direction}. Look back for the threat you left open.`, tone: 'loss' };
  }

  const best = progress.best[level];
  const stats = vsComputer
    ? [
        { label: 'You', value: tally.a },
        { label: 'Draws', value: tally.draws },
        { label: 'Computer', value: tally.b },
        { label: 'Fewest discs to win', value: best === undefined ? '—' : best },
      ]
    : [
        { label: 'Player 1', value: tally.a },
        { label: 'Draws', value: tally.draws },
        { label: 'Player 2', value: tally.b },
      ];

  return (
    <GameFrame
      label="Connect Four"
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
      <div className="relative mx-auto w-full max-w-[30rem]">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" aria-hidden="true">
          {previewCol !== null && previewRow >= 0 && (
            <>
              <DiscShape x={cx(previewCol)} y={TOP / 2} mine={turn === mineDisc} />
              <circle
                cx={cx(previewCol)}
                cy={cy(previewRow)}
                r={DISC_R}
                fill="none"
                className="stroke-ink-muted"
                strokeWidth="5"
                strokeDasharray="12 10"
              />
            </>
          )}
          {board.map((cell, index) =>
            cell ? (
              <DiscShape
                key={`${round.id}-${index}`}
                x={cx(index % COLS)}
                y={cy(Math.floor(index / COLS))}
                mine={cell === mineDisc}
                dropFrom={last && last.row * COLS + last.col === index ? TOP / 2 - cy(last.row) : undefined}
              />
            ) : null,
          )}
          <path d={RACK_PATH} fillRule="evenodd" className="fill-ink" />
          {winLine && (
            <g strokeLinecap="round" fill="none">
              <line
                x1={cx(winLine[0] % COLS)}
                y1={cy(Math.floor(winLine[0] / COLS))}
                x2={cx(winLine[winLine.length - 1] % COLS)}
                y2={cy(Math.floor(winLine[winLine.length - 1] / COLS))}
                className="stroke-ink"
                strokeWidth="22"
              />
              <line
                x1={cx(winLine[0] % COLS)}
                y1={cy(Math.floor(winLine[0] / COLS))}
                x2={cx(winLine[winLine.length - 1] % COLS)}
                y2={cy(Math.floor(winLine[winLine.length - 1] / COLS))}
                className="stroke-paper"
                strokeWidth="10"
              />
            </g>
          )}
        </svg>
        <div
          role="group"
          aria-label={`Rack of ${COLS} columns. Left and right arrows choose a column, Enter or Space drops a disc, or press 1 to 7.`}
          onKeyDown={handleKeyDown}
          onFocus={() => setBoardFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setBoardFocused(false);
          }}
          onPointerLeave={() => setHovered(null)}
          className="absolute inset-0 flex"
          style={{ paddingInline: `${(PAD / WIDTH) * 100}%` }}
        >
          {Array.from({ length: COLS }, (_, col) => {
            // Read the column bottom to top: the order the discs were dropped in.
            const stack = Array.from({ length: ROWS }, (_, row) => board[(ROWS - 1 - row) * COLS + col]).filter((cell): cell is Disc => cell !== 0);
            const full = stack.length === ROWS;
            const blocked = over || cpuTurn || full;
            return (
              <button
                key={col}
                ref={(node) => {
                  columnRefs.current[col] = node;
                }}
                type="button"
                tabIndex={col === focused ? 0 : -1}
                aria-disabled={blocked}
                aria-label={`Column ${col + 1}: ${stack.length > 0 ? stack.map(discOwner).join(', ') : 'empty'}. ${stack.length} of ${ROWS} filled${
                  full ? ', column full' : ''
                }${winLine?.some((index) => index % COLS === col) ? ', part of the winning line' : ''}.`}
                onFocus={() => setFocused(col)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setHovered(col);
                }}
                onClick={() => {
                  if (!blocked) dropIn(col);
                }}
                className={[
                  'h-full flex-1 rounded-die focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-game',
                  blocked ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>
    </GameFrame>
  );
}

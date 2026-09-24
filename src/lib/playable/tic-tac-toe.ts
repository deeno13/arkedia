/**
 * Tic-tac-toe rules and a complete game-tree solver. Framework-free; randomness is
 * injectable so play is deterministic in tests.
 */

export type Mark = 'X' | 'O';
export type Cell = Mark | null;
/** Nine cells, row by row: index = row * 3 + col. */
export type Board = readonly Cell[];
export type Level = 'easy' | 'medium' | 'hard';
/** Outcome for the player who makes a move, assuming perfect play afterwards. */
export type Outcome = 'win' | 'draw' | 'loss';

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const EMPTY_BOARD: Board = Array.from({ length: 9 }, () => null);

export const other = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');

export function findWin(board: Board): { mark: Mark; line: readonly [number, number, number] } | null {
  for (const line of LINES) {
    const mark = board[line[0]];
    if (mark && mark === board[line[1]] && mark === board[line[2]]) return { mark, line };
  }
  return null;
}

export const emptyCells = (board: Board) => board.flatMap((cell, index) => (cell ? [] : [index]));

/** Whose turn it is: X always moves first. */
export const toMove = (board: Board): Mark => (board.filter(Boolean).length % 2 === 0 ? 'X' : 'O');

export function play(board: Board, index: number, mark: Mark): Board {
  if (board[index] || findWin(board)) throw new Error(`Illegal move at ${index}`);
  const next = board.slice();
  next[index] = mark;
  return next;
}

const memo = new Map<string, number>();

/**
 * Negamax value of the position for the player to move: positive = win, 0 = draw,
 * negative = loss. Magnitude prefers quicker wins and slower losses (10 − plies).
 */
function solve(board: Board, mark: Mark): number {
  const key = board.map((cell) => cell ?? '-').join('') + mark;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  let best = -Infinity;
  const empties = emptyCells(board);
  if (empties.length === 0) best = 0;
  for (const index of empties) {
    best = Math.max(best, moveScore(board, index, mark));
  }
  memo.set(key, best);
  return best;
}

/** Score of `mark` playing at `index`, from `mark`'s point of view. */
function moveScore(board: Board, index: number, mark: Mark): number {
  const next = play(board, index, mark);
  if (findWin(next)) return 1 + emptyCells(next).length;
  if (emptyCells(next).length === 0) return 0;
  return -solve(next, other(mark));
}

/** What each cell is worth to the player to move, under perfect play by both sides (null = occupied or game over). */
export function evaluateMoves(board: Board): (Outcome | null)[] {
  const mark = toMove(board);
  if (findWin(board)) return board.map(() => null);
  return board.map((cell, index) => {
    if (cell) return null;
    const score = moveScore(board, index, mark);
    return score > 0 ? 'win' : score < 0 ? 'loss' : 'draw';
  });
}

const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)];

/** A cell that completes three-in-a-row for `mark`, if any. */
function winningCell(board: Board, mark: Mark) {
  return emptyCells(board).find((index) => findWin(play(board, index, mark))?.mark === mark);
}

/**
 * The computer's move for whoever is to play.
 * - easy: any legal cell
 * - medium: win if possible, else block, else any legal cell
 * - hard: perfect minimax (never loses), random among equally good moves
 */
export function chooseMove(board: Board, level: Level, random: () => number = Math.random): number {
  const mark = toMove(board);
  const empties = emptyCells(board);
  if (empties.length === 0 || findWin(board)) throw new Error('No move available');
  if (level === 'easy') return pick(empties, random);
  if (level === 'medium') return winningCell(board, mark) ?? winningCell(board, other(mark)) ?? pick(empties, random);
  const scored = empties.map((index) => ({ index, score: moveScore(board, index, mark) }));
  const top = Math.max(...scored.map((entry) => entry.score));
  return pick(
    scored.filter((entry) => entry.score === top).map((entry) => entry.index),
    random,
  );
}

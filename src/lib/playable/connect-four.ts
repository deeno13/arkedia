/**
 * Connect Four rules and a computer opponent. Framework-free; randomness and the clock
 * are injectable so play is deterministic in tests.
 */

export const COLS = 7;
export const ROWS = 6;
export const SIZE = COLS * ROWS;

/** 1 moves first, 2 second; 0 is an empty hole. */
export type Disc = 1 | 2;
export type Cell = 0 | Disc;
/** 42 holes, row by row from the TOP: index = row * COLS + col. */
export type Board = readonly Cell[];
export type Level = 'easy' | 'medium' | 'hard';

export const EMPTY_BOARD: Board = Array.from({ length: SIZE }, () => 0 as Cell);

export const other = (disc: Disc): Disc => (disc === 1 ? 2 : 1);

/** Directions as [dRow, dCol]: horizontal, vertical, both diagonals. */
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

/** Every run of four holes on the board (69 of them), as cell indices. */
const WINDOWS: number[][] = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    for (const [dr, dc] of DIRECTIONS) {
      const endRow = row + dr * 3;
      const endCol = col + dc * 3;
      if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;
      WINDOWS.push([0, 1, 2, 3].map((step) => (row + dr * step) * COLS + col + dc * step));
    }
  }
}

/** Row a disc dropped in `col` would land in, or -1 when the column is full. */
export function landingRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + col] === 0) return row;
  }
  return -1;
}

export const legalColumns = (board: Board) => [0, 1, 2, 3, 4, 5, 6].filter((col) => board[col] === 0);

export function drop(board: Board, col: number, disc: Disc): { board: Board; row: number } {
  const row = landingRow(board, col);
  if (row < 0) throw new Error(`Column ${col + 1} is full`);
  const next = board.slice();
  next[row * COLS + col] = disc;
  return { board: next, row };
}

/**
 * The full line (4+ cells) through the disc at (row, col), or null. Checks all four
 * directions outward from the placed disc.
 */
export function lineThrough(board: Board, row: number, col: number): number[] | null {
  const disc = board[row * COLS + col];
  if (!disc) return null;
  for (const [dr, dc] of DIRECTIONS) {
    const line = [row * COLS + col];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === disc) {
        line.push(r * COLS + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 4) return line.sort((a, b) => a - b);
  }
  return null;
}

/** Scans the whole board for any four in a row. */
export function findWin(board: Board): { disc: Disc; line: number[] } | null {
  for (const window of WINDOWS) {
    const disc = board[window[0]];
    if (disc && window.every((index) => board[index] === disc)) return { disc, line: window };
  }
  return null;
}

export const isFull = (board: Board) => board.slice(0, COLS).every((cell) => cell !== 0);

/* ------------------------------------------------------------------ search */

const ORDER = [3, 2, 4, 1, 5, 0, 6];
const WIN = 1_000_000;
const CENTER_WEIGHT = [0, 1, 2, 4, 2, 1, 0];

/** Deterministic 32-bit Zobrist keys (xorshift), two per hole: one per disc colour. */
const ZOBRIST = (() => {
  let seed = 0x9e3779b9;
  const next = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return seed >>> 0;
  };
  return Array.from({ length: SIZE * 2 }, () => [next(), next()] as const);
})();

class TimeUp extends Error {}

interface Search {
  cells: Int8Array;
  heights: Int8Array;
  hash: number;
  check: number;
  table: Map<number, { check: number; depth: number; score: number; flag: 0 | 1 | 2; move: number }>;
  nodes: number;
  deadline: number;
  now: () => number;
}

function wouldWin(cells: Int8Array, row: number, col: number, disc: number): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && cells[r * COLS + c] === disc) {
        count++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

/** Positional score for `disc`: open windows it could still complete, minus the opponent's. */
function heuristic(cells: Int8Array, disc: number): number {
  let score = 0;
  for (let index = 0; index < SIZE; index++) {
    const cell = cells[index];
    if (cell) score += (cell === disc ? 1 : -1) * CENTER_WEIGHT[index % COLS] * 2;
  }
  for (const window of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const index of window) {
      if (cells[index] === disc) mine++;
      else if (cells[index] !== 0) theirs++;
    }
    if (theirs === 0) score += mine === 3 ? 40 : mine === 2 ? 8 : mine === 1 ? 1 : 0;
    else if (mine === 0) score -= theirs === 3 ? 44 : theirs === 2 ? 8 : theirs === 1 ? 1 : 0;
  }
  return score;
}

function negamax(s: Search, depth: number, alpha: number, beta: number, disc: number, ply: number, moves: number): number {
  if ((++s.nodes & 1023) === 0 && s.now() > s.deadline) throw new TimeUp();

  // Win now if possible.
  for (let col = 0; col < COLS; col++) {
    const row = ROWS - 1 - s.heights[col];
    if (row >= 0 && wouldWin(s.cells, row, col, disc)) return WIN - ply;
  }
  if (moves === SIZE) return 0;
  if (depth === 0) return heuristic(s.cells, disc);

  const alphaStart = alpha;
  const entry = s.table.get(s.hash);
  let ttMove = -1;
  if (entry && entry.check === s.check) {
    ttMove = entry.move;
    if (entry.depth >= depth) {
      if (entry.flag === 0) return entry.score;
      if (entry.flag === 1) alpha = Math.max(alpha, entry.score);
      else beta = Math.min(beta, entry.score);
      if (alpha >= beta) return entry.score;
    }
  }

  let best = -Infinity;
  let bestMove = -1;
  const order = ttMove >= 0 ? [ttMove, ...ORDER.filter((col) => col !== ttMove)] : ORDER;
  for (const col of order) {
    const row = ROWS - 1 - s.heights[col];
    if (row < 0) continue;
    const index = row * COLS + col;
    const keys = ZOBRIST[index * 2 + disc - 1];
    s.cells[index] = disc;
    s.heights[col]++;
    s.hash ^= keys[0];
    s.check ^= keys[1];
    let score: number;
    try {
      score = -negamax(s, depth - 1, -beta, -alpha, 3 - disc, ply + 1, moves + 1);
    } finally {
      s.cells[index] = 0;
      s.heights[col]--;
      s.hash ^= keys[0];
      s.check ^= keys[1];
    }
    if (score > best) {
      best = score;
      bestMove = col;
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }

  s.table.set(s.hash, {
    check: s.check,
    depth,
    score: best,
    flag: best <= alphaStart ? 2 : best >= beta ? 1 : 0,
    move: bestMove,
  });
  return best;
}

export interface SearchReport {
  col: number;
  /** Deepest fully searched depth. */
  depth: number;
  score: number;
  nodes: number;
}

/**
 * Iterative-deepening alpha-beta search. Returns the best column found at the deepest
 * depth that finished before the time budget ran out.
 */
export function searchMove(
  board: Board,
  disc: Disc,
  { maxDepth, budgetMs, now = () => performance.now() }: { maxDepth: number; budgetMs: number; now?: () => number },
): SearchReport {
  const cells = Int8Array.from(board);
  const heights = new Int8Array(COLS);
  let hash = 0;
  let check = 0;
  let moves = 0;
  for (let index = 0; index < SIZE; index++) {
    if (!cells[index]) continue;
    heights[index % COLS]++;
    moves++;
    hash ^= ZOBRIST[index * 2 + cells[index] - 1][0];
    check ^= ZOBRIST[index * 2 + cells[index] - 1][1];
  }
  const s: Search = { cells, heights, hash, check, table: new Map(), nodes: 0, deadline: now() + budgetMs, now };
  const legal = ORDER.filter((col) => heights[col] < ROWS);
  if (legal.length === 0) throw new Error('Board is full');

  let report: SearchReport = { col: legal[0], depth: 0, score: 0, nodes: 0 };
  for (let depth = 1; depth <= Math.min(maxDepth, SIZE - moves); depth++) {
    try {
      let bestCol = -1;
      let bestScore = -Infinity;
      let alpha = -Infinity;
      const previous = report.depth > 0 ? report.col : -1;
      const order = previous >= 0 ? [previous, ...legal.filter((col) => col !== previous)] : legal;
      for (const col of order) {
        const row = ROWS - 1 - heights[col];
        const index = row * COLS + col;
        if (wouldWin(cells, row, col, disc)) {
          bestCol = col;
          bestScore = WIN;
          break;
        }
        const keys = ZOBRIST[index * 2 + disc - 1];
        cells[index] = disc;
        heights[col]++;
        s.hash ^= keys[0];
        s.check ^= keys[1];
        let score: number;
        try {
          score = -negamax(s, depth - 1, -Infinity, -alpha, 3 - disc, 1, moves + 1);
        } finally {
          cells[index] = 0;
          heights[col]--;
          s.hash ^= keys[0];
          s.check ^= keys[1];
        }
        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
        }
        alpha = Math.max(alpha, score);
      }
      report = { col: bestCol, depth, score: bestScore, nodes: s.nodes };
      // A forced win or loss is already proven; deeper search cannot change it.
      if (Math.abs(bestScore) > WIN - SIZE) break;
    } catch (error) {
      if (error instanceof TimeUp) break;
      throw error;
    }
  }
  return { ...report, nodes: s.nodes };
}

/** Columns where `disc` wins on the spot. */
const winningColumns = (board: Board, disc: Disc) =>
  legalColumns(board).filter((col) => lineThrough(drop(board, col, disc).board, landingRow(board, col), col));

/**
 * The computer's column.
 * - easy: wins or blocks only half the time, otherwise plays anywhere, loosely centred
 * - medium: 4-ply search
 * - hard: iterative deepening to 8+ plies within ~550ms
 */
export function chooseMove(
  board: Board,
  disc: Disc,
  level: Level,
  random: () => number = Math.random,
  now?: () => number,
): number {
  const legal = legalColumns(board);
  if (legal.length === 0) throw new Error('Board is full');
  if (level === 'easy') {
    const wins = winningColumns(board, disc);
    if (wins.length && random() < 0.5) return wins[0];
    const blocks = winningColumns(board, other(disc));
    if (blocks.length && random() < 0.5) return blocks[0];
    // Sometimes avoid handing the opponent a win by playing under their spot.
    const safe =
      random() < 0.5
        ? legal.filter((col) => {
            const after = drop(board, col, disc).board;
            return !winningColumns(after, other(disc)).length;
          })
        : [];
    const pool = safe.length ? safe : legal;
    // Weight central columns a little: 1..4..1.
    const weights = pool.map((col) => 4 - Math.abs(3 - col));
    let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll < 0) return pool[i];
    }
    return pool[pool.length - 1];
  }
  if (level === 'medium') return searchMove(board, disc, { maxDepth: 4, budgetMs: 300, now }).col;
  return searchMove(board, disc, { maxDepth: 12, budgetMs: 550, now }).col;
}

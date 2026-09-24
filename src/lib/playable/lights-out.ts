/**
 * Lights Out on an n×n board. A board is a bitmask with bit `row * n + col` set for a lit
 * cell; a set of presses uses the same layout. Pressing toggles the cell and its orthogonal
 * neighbours, so pressing is XOR, presses commute, and pressing twice cancels.
 * Solving is linear algebra over GF(2): find presses x with A·x = board.
 */

export type LightsOutSize = 3 | 5;

export interface LightsOutPuzzle {
  size: LightsOutSize;
  board: number;
  /** Fewest presses that clear the starting board. */
  minimum: number;
}

/** Bitmask of the cells a press at `index` toggles. */
export function pressMask(size: number, index: number): number {
  const row = Math.floor(index / size);
  const col = index % size;
  let mask = 1 << index;
  if (row > 0) mask |= 1 << (index - size);
  if (row < size - 1) mask |= 1 << (index + size);
  if (col > 0) mask |= 1 << (index - 1);
  if (col < size - 1) mask |= 1 << (index + 1);
  return mask;
}

/** The board after applying every press in `presses` (order is irrelevant). */
export function applyPresses(size: number, board: number, presses: number): number {
  let next = board;
  for (let i = 0; i < size * size; i += 1) if (presses & (1 << i)) next ^= pressMask(size, i);
  return next;
}

export function popcount(mask: number) {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count += 1;
  return count;
}

/**
 * Every press set that clears `board`, via Gaussian elimination over GF(2).
 * Returns [] when the board is unsolvable. On 5×5 the matrix has a 2-dimensional null
 * space, so a solvable board has exactly 4 solutions; on 3×3 it has exactly 1.
 */
export function allSolutions(size: number, board: number): number[] {
  const cells = size * size;
  // Row i of the augmented matrix: which presses toggle cell i (bits 0..cells-1), plus
  // whether cell i is lit (bit `cells`). The matrix is symmetric, so row i is cell i's press mask.
  const rows = Array.from({ length: cells }, (_, i) => pressMask(size, i) | (((board >> i) & 1) << cells));
  const pivotCols: number[] = [];
  let rank = 0;

  for (let col = 0; col < cells && rank < cells; col += 1) {
    const pivot = rows.findIndex((row, r) => r >= rank && (row >> col) & 1);
    if (pivot === -1) continue;
    [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
    for (let r = 0; r < cells; r += 1) if (r !== rank && (rows[r] >> col) & 1) rows[r] ^= rows[rank];
    pivotCols.push(col);
    rank += 1;
  }

  // A zero row with a 1 on the right-hand side means 0 = 1: no solution.
  if (rows.slice(rank).some((row) => (row >> cells) & 1)) return [];

  const freeCols = Array.from({ length: cells }, (_, c) => c).filter((c) => !pivotCols.includes(c));
  const solutions: number[] = [];
  for (let choice = 0; choice < 1 << freeCols.length; choice += 1) {
    let x = 0;
    freeCols.forEach((col, k) => {
      if ((choice >> k) & 1) x |= 1 << col;
    });
    // Reduced row echelon: each pivot variable = rhs XOR the free variables its row still holds.
    pivotCols.forEach((col, r) => {
      if (((rows[r] >> cells) ^ popcount(rows[r] & x)) & 1) x |= 1 << col;
    });
    solutions.push(x);
  }
  return solutions;
}

/** The fewest-press solution for `board`, or null when it cannot be cleared. */
export function solveLightsOut(size: number, board: number): number | null {
  const solutions = allSolutions(size, board);
  if (solutions.length === 0) return null;
  return solutions.reduce((best, x) => (popcount(x) < popcount(best) ? x : best));
}

/**
 * A random puzzle made by pressing random cells on a dark board, so it is always solvable.
 * Rerolls boards that are too easy to be interesting.
 */
export function generateLightsOut(size: LightsOutSize, random: () => number = Math.random): LightsOutPuzzle {
  const floor = size === 5 ? 7 : 3;
  for (;;) {
    let presses = 0;
    for (let i = 0; i < size * size; i += 1) if (random() < 0.5) presses |= 1 << i;
    const board = applyPresses(size, 0, presses);
    const minimum = popcount(solveLightsOut(size, board) ?? 0);
    if (minimum >= floor) return { size, board, minimum };
  }
}

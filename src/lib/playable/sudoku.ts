/**
 * Sudoku logic: a bitmask backtracking solver that counts solutions, a generator that
 * only ever returns puzzles with exactly one solution, and a singles-only grader.
 * Cells are a flat array of 81 numbers, row by row; 0 means empty.
 */

export type SudokuDifficulty = 'easy' | 'medium' | 'hard';

export interface SudokuPuzzle {
  difficulty: SudokuDifficulty;
  /** Givens; 0 for blanks. */
  puzzle: number[];
  solution: number[];
}

/** How many givens each difficulty aims for. */
export const CLUE_TARGETS: Record<SudokuDifficulty, number> = { easy: 38, medium: 30, hard: 25 };

const ALL = 0x3fe; // bits 1..9

export const rowOf = (index: number) => Math.floor(index / 9);
export const colOf = (index: number) => index % 9;
export const boxOf = (index: number) => Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);

/** The 20 cells that share a row, column or box with each cell. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, index) =>
  Array.from({ length: 81 }, (_, other) => other).filter(
    (other) => other !== index && (rowOf(other) === rowOf(index) || colOf(other) === colOf(index) || boxOf(other) === boxOf(index)),
  ),
);

const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) =>
    Array.from({ length: 9 }, (_, k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)),
  ),
];

function popcount(mask: number) {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count += 1;
  return count;
}

function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

interface SearchState {
  cells: number[];
  rows: number[];
  cols: number[];
  boxes: number[];
  random?: () => number;
  solution?: number[];
}

function prepare(cells: number[], random?: () => number): SearchState | null {
  const state: SearchState = { cells: cells.slice(), rows: Array(9).fill(0), cols: Array(9).fill(0), boxes: Array(9).fill(0), random };
  for (let i = 0; i < 81; i += 1) {
    const digit = cells[i];
    if (!digit) continue;
    const bit = 1 << digit;
    const [r, c, b] = [rowOf(i), colOf(i), boxOf(i)];
    if ((state.rows[r] | state.cols[c] | state.boxes[b]) & bit) return null;
    state.rows[r] |= bit;
    state.cols[c] |= bit;
    state.boxes[b] |= bit;
  }
  return state;
}

/** Depth-first search on the most constrained empty cell; stops once `limit` solutions are found. */
function search(state: SearchState, limit: number): number {
  const { cells, rows, cols, boxes } = state;
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i += 1) {
    if (cells[i]) continue;
    const mask = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
    const count = popcount(mask);
    if (count === 0) return 0;
    if (count < bestCount) {
      best = i;
      bestMask = mask;
      bestCount = count;
      if (count === 1) break;
    }
  }
  if (best === -1) {
    state.solution ??= cells.slice();
    return 1;
  }

  const digits: number[] = [];
  for (let d = 1; d <= 9; d += 1) if (bestMask & (1 << d)) digits.push(d);
  if (state.random) shuffle(digits, state.random);

  const [r, c, b] = [rowOf(best), colOf(best), boxOf(best)];
  let total = 0;
  for (const digit of digits) {
    const bit = 1 << digit;
    cells[best] = digit;
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;
    total += search(state, limit - total);
    cells[best] = 0;
    rows[r] &= ~bit;
    cols[c] &= ~bit;
    boxes[b] &= ~bit;
    if (total >= limit) break;
  }
  return total;
}

/** Number of solutions, counting no further than `limit` (2 is enough to test uniqueness). */
export function countSolutions(cells: number[], limit = 2): number {
  const state = prepare(cells);
  return state ? search(state, limit) : 0;
}

/** The first solution found, or null when the grid is contradictory. */
export function solveSudoku(cells: number[]): number[] | null {
  const state = prepare(cells);
  if (!state) return null;
  search(state, 1);
  return state.solution ?? null;
}

/** Digits still possible in each cell given the filled cells (0 for filled cells). */
export function candidateMasks(cells: number[]): number[] {
  return cells.map((digit, index) => {
    if (digit) return 0;
    let used = 0;
    for (const peer of PEERS[index]) if (cells[peer]) used |= 1 << cells[peer];
    return ALL & ~used;
  });
}

/**
 * The simplest family of techniques that solves the puzzle without guessing:
 * - `singles`: a cell with one candidate left (naked single) or a digit with one home left
 *   in a row, column or box (hidden single).
 * - `pairs`: singles plus locked candidates (pointing / claiming) and naked pairs.
 * - `search`: needs something stronger (or trial and error).
 */
export type SudokuGrade = 'singles' | 'pairs' | 'search';

export function gradeSudoku(puzzle: number[]): SudokuGrade {
  const cells = puzzle.slice();
  const cand = candidateMasks(cells);
  const place = (index: number, digit: number) => {
    cells[index] = digit;
    cand[index] = 0;
    for (const peer of PEERS[index]) cand[peer] &= ~(1 << digit);
  };
  const eliminate = (targets: number[], mask: number) => {
    let changed = false;
    for (const i of targets) {
      if (!cells[i] && cand[i] & mask) {
        cand[i] &= ~mask;
        changed = true;
      }
    }
    return changed;
  };
  let usedPairs = false;

  for (;;) {
    if (cells.some((digit, i) => !digit && !cand[i])) return 'search';
    const naked = cand.findIndex((mask) => popcount(mask) === 1);
    if (naked !== -1) {
      place(naked, Math.log2(cand[naked]));
      continue;
    }
    let placed = false;
    for (const unit of UNITS) {
      for (let d = 1; d <= 9 && !placed; d += 1) {
        const homes = unit.filter((i) => cand[i] & (1 << d));
        if (homes.length === 1) {
          place(homes[0], d);
          placed = true;
        }
      }
      if (placed) break;
    }
    if (placed) continue;
    if (cells.every(Boolean)) return usedPairs ? 'pairs' : 'singles';

    let changed = false;
    for (let u = 0; u < 27 && !changed; u += 1) {
      const unit = UNITS[u];
      for (let d = 1; d <= 9 && !changed; d += 1) {
        const bit = 1 << d;
        const homes = unit.filter((i) => cand[i] & bit);
        if (homes.length < 2) continue;
        // Every home of d in this unit lies in one other unit: d is locked there.
        for (let v = 0; v < 27 && !changed; v += 1) {
          if (v === u || !homes.every((i) => UNITS[v].includes(i))) continue;
          changed = eliminate(UNITS[v].filter((i) => !unit.includes(i)), bit);
        }
      }
      for (const a of unit) {
        if (changed || popcount(cand[a]) !== 2) continue;
        const twin = unit.find((b) => b !== a && cand[b] === cand[a]);
        if (twin !== undefined) changed = eliminate(unit.filter((i) => i !== a && i !== twin), cand[a]);
      }
    }
    if (!changed) return 'search';
    usedPairs = true;
  }
}

function fullGrid(random: () => number): number[] {
  const state = prepare(Array(81).fill(0), random)!;
  search(state, 1);
  return state.solution!;
}

/**
 * Digs a random full grid down towards the difficulty's clue target, removing cells in
 * 180°-symmetric pairs and only keeping a removal when the solution stays unique.
 * Easy and Medium must fall to singles; Hard should need pairs, never a guess.
 * Each attempt takes about a millisecond, so a few dozen retries stay well under budget.
 */
export function generateSudoku(difficulty: SudokuDifficulty, random: () => number = Math.random): SudokuPuzzle {
  const target = CLUE_TARGETS[difficulty];
  const wanted: SudokuGrade = difficulty === 'hard' ? 'pairs' : 'singles';
  let fallback: SudokuPuzzle | null = null;
  let fallbackCost = Infinity;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const solution = fullGrid(random);
    const puzzle = solution.slice();
    let clues = 81;
    const symmetric = attempt < 40;
    const order = shuffle(
      Array.from({ length: symmetric ? 41 : 81 }, (_, i) => i),
      random,
    );

    for (const index of order) {
      if (clues <= target) break;
      const pair = symmetric && index !== 40 ? [index, 80 - index] : [index];
      if (clues - pair.length < target - 1) continue;
      const saved = pair.map((cell) => puzzle[cell]);
      pair.forEach((cell) => (puzzle[cell] = 0));
      if (countSolutions(puzzle, 2) === 1) clues -= pair.length;
      else pair.forEach((cell, k) => (puzzle[cell] = saved[k]));
    }

    const gradeMiss = gradeSudoku(puzzle) === wanted ? 0 : 1;
    if (!gradeMiss && clues <= target) return { difficulty, puzzle, solution };
    // Otherwise remember the closest miss: right technique level first, then fewest extra clues.
    const cost = gradeMiss * 100 + Math.max(0, clues - target);
    if (cost < fallbackCost) {
      fallback = { difficulty, puzzle, solution };
      fallbackCost = cost;
    }
  }

  return fallback!;
}

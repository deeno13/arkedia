export type MinesweeperDifficulty = 'beginner' | 'intermediate';

export interface MinesweeperConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const MINESWEEPER_LEVELS: Record<MinesweeperDifficulty, MinesweeperConfig & { label: string }> = {
  beginner: { label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
};

export type CellState = 'hidden' | 'revealed' | 'flagged';
export type BoardStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface MineCell {
  mine: boolean;
  /** Mines among the up-to-eight touching squares. */
  adjacent: number;
  state: CellState;
}

export interface MinesweeperBoard extends MinesweeperConfig {
  cells: MineCell[];
  /** Mines are laid only after the first reveal, so the first square is always safe. */
  minesPlaced: boolean;
  status: BoardStatus;
  /** The mine that ended the round, when lost. */
  explodedIndex: number | null;
}

export function createBoard(config: MinesweeperConfig): MinesweeperBoard {
  return {
    rows: config.rows,
    cols: config.cols,
    mines: config.mines,
    cells: Array.from({ length: config.rows * config.cols }, () => ({ mine: false, adjacent: 0, state: 'hidden' as CellState })),
    minesPlaced: false,
    status: 'ready',
    explodedIndex: null,
  };
}

export function neighbours(board: Pick<MinesweeperConfig, 'rows' | 'cols'>, index: number): number[] {
  const row = Math.floor(index / board.cols);
  const col = index % board.cols;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) result.push(r * board.cols + c);
    }
  }
  return result;
}

/**
 * Lays the mines anywhere except the first-revealed square and its neighbours, so the
 * opening click always lands on a zero and opens an area. Falls back to protecting only
 * the square itself if the board is too crowded to spare the neighbours.
 */
export function placeMines(board: MinesweeperBoard, safeIndex: number, random: () => number = Math.random): MinesweeperBoard {
  const total = board.rows * board.cols;
  const protectedSet = new Set([safeIndex, ...neighbours(board, safeIndex)]);
  if (total - protectedSet.size < board.mines) protectedSet.clear();
  protectedSet.add(safeIndex);

  const candidates: number[] = [];
  for (let i = 0; i < total; i += 1) if (!protectedSet.has(i)) candidates.push(i);

  // Partial Fisher–Yates: the first `mines` slots end up a uniform random sample.
  for (let i = 0; i < board.mines; i += 1) {
    const j = i + Math.floor(random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const cells = board.cells.map((cell) => ({ ...cell, mine: false, adjacent: 0 }));
  for (const index of candidates.slice(0, board.mines)) cells[index].mine = true;
  cells.forEach((cell, index) => {
    cell.adjacent = neighbours(board, index).filter((n) => cells[n].mine).length;
  });

  return { ...board, cells, minesPlaced: true, status: 'playing' };
}

function withWinCheck(board: MinesweeperBoard): MinesweeperBoard {
  if (board.status !== 'playing') return board;
  const cleared = board.cells.every((cell) => cell.mine || cell.state === 'revealed');
  if (!cleared) return board;
  return {
    ...board,
    status: 'won',
    cells: board.cells.map((cell) => (cell.mine ? { ...cell, state: 'flagged' } : cell)),
  };
}

/** Opens squares in place; zeros spread to their neighbours (flood fill). Returns the index of a mine hit, if any. */
function openCells(board: MinesweeperBoard, cells: MineCell[], start: number[]): number | null {
  const stack = [...start];
  while (stack.length > 0) {
    const index = stack.pop()!;
    const cell = cells[index];
    if (cell.state !== 'hidden') continue;
    if (cell.mine) {
      cells[index] = { ...cell, state: 'revealed' };
      return index;
    }
    cells[index] = { ...cell, state: 'revealed' };
    if (cell.adjacent === 0) stack.push(...neighbours(board, index));
  }
  return null;
}

function explode(board: MinesweeperBoard, cells: MineCell[], index: number): MinesweeperBoard {
  return {
    ...board,
    status: 'lost',
    explodedIndex: index,
    // Show every unflagged mine; flags stay so wrong ones can be marked.
    cells: cells.map((cell) => (cell.mine && cell.state === 'hidden' ? { ...cell, state: 'revealed' } : cell)),
  };
}

/** Reveals one square. The first reveal of a round lays the mines. */
export function reveal(board: MinesweeperBoard, index: number, random: () => number = Math.random): MinesweeperBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const current = board.minesPlaced ? board : placeMines(board, index, random);
  if (current.cells[index].state !== 'hidden') return current;

  const cells = [...current.cells];
  const hit = openCells(current, cells, [index]);
  if (hit !== null) return explode(current, cells, hit);
  return withWinCheck({ ...current, cells });
}

export function toggleFlag(board: MinesweeperBoard, index: number): MinesweeperBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const cell = board.cells[index];
  if (cell.state === 'revealed') return board;
  const cells = [...board.cells];
  cells[index] = { ...cell, state: cell.state === 'flagged' ? 'hidden' : 'flagged' };
  return { ...board, cells };
}

/**
 * Chording: on a revealed number whose flag count matches it, open every other hidden
 * neighbour at once. A misplaced flag makes this lose, exactly as in the classic game.
 */
export function chord(board: MinesweeperBoard, index: number): MinesweeperBoard {
  if (board.status !== 'playing') return board;
  const cell = board.cells[index];
  if (cell.state !== 'revealed' || cell.adjacent === 0) return board;
  const around = neighbours(board, index);
  const flags = around.filter((n) => board.cells[n].state === 'flagged').length;
  if (flags !== cell.adjacent) return board;
  const hidden = around.filter((n) => board.cells[n].state === 'hidden');
  if (hidden.length === 0) return board;

  const cells = [...board.cells];
  // Open each neighbour separately so a zero among them still floods, and any mine is caught.
  let hit: number | null = null;
  for (const n of hidden) {
    const result = openCells(board, cells, [n]);
    if (result !== null && hit === null) hit = result;
  }
  if (hit !== null) return explode(board, cells, hit);
  return withWinCheck({ ...board, cells });
}

/** Whether chording on this square would open anything. */
export function canChord(board: MinesweeperBoard, index: number): boolean {
  return chord(board, index) !== board;
}

export function flagCount(board: MinesweeperBoard): number {
  return board.cells.filter((cell) => cell.state === 'flagged').length;
}

export function revealedCount(board: MinesweeperBoard): number {
  return board.cells.filter((cell) => cell.state === 'revealed' && !cell.mine).length;
}

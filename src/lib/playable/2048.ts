/**
 * 2048: pure, framework-free rules. Tiles keep stable ids so the board can animate
 * slides; randomness (spawn cell and value) is injectable for tests.
 */

export const SIZE = 4;
export const GOAL = 2048;

export type Move = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  /**
   * `new`: spawned after the last move. `merged`: created by the last move.
   * `consumed`: one of the two tiles that merged; kept one move so it can slide into
   * place under the merged tile, then dropped.
   */
  kind: 'static' | 'new' | 'merged' | 'consumed';
}

export interface Board2048 {
  tiles: Tile[];
  score: number;
  nextId: number;
}

export interface MoveResult {
  board: Board2048;
  moved: boolean;
  gained: number;
  /** Values created by merges this move, in board order. */
  merges: number[];
}

/** Fold one line toward its leading edge: equal neighbours merge, each tile at most once per move. */
function collapse<T>(line: T[], valueOf: (item: T) => number) {
  const groups: { value: number; from: T[] }[] = [];
  for (const item of line) {
    const last = groups.at(-1);
    if (last && last.from.length === 1 && last.value === valueOf(item)) {
      last.value *= 2;
      last.from.push(item);
    } else {
      groups.push({ value: valueOf(item), from: [item] });
    }
  }
  return groups;
}

/** One row slid toward index 0, e.g. [2, 2, 2, 2] → [4, 4, 0, 0]. Zeros are empty cells. */
export function slideLine(line: number[]) {
  const groups = collapse(
    line.filter((value) => value !== 0),
    (value) => value,
  );
  return {
    line: [...groups.map((group) => group.value), ...Array<number>(line.length - groups.length).fill(0)],
    gained: groups.reduce((sum, group) => sum + (group.from.length === 2 ? group.value : 0), 0),
  };
}

export function liveTiles(board: Board2048) {
  return board.tiles.filter((tile) => tile.kind !== 'consumed');
}

/** Add a 2 (90%) or a 4 (10%) on a random empty cell. */
export function spawn(board: Board2048, random = Math.random): Board2048 {
  const taken = new Set(liveTiles(board).map((tile) => tile.row * SIZE + tile.col));
  const open: number[] = [];
  for (let index = 0; index < SIZE * SIZE; index += 1) if (!taken.has(index)) open.push(index);
  if (open.length === 0) return board;
  const index = open[Math.floor(random() * open.length)];
  const tile: Tile = { id: board.nextId, value: random() < 0.9 ? 2 : 4, row: Math.floor(index / SIZE), col: index % SIZE, kind: 'new' };
  return { ...board, tiles: [...board.tiles, tile], nextId: board.nextId + 1 };
}

export function createBoard(random = Math.random): Board2048 {
  return spawn(spawn({ tiles: [], score: 0, nextId: 1 }, random), random);
}

/** Board position of the k-th cell of line i, counted from the edge the tiles slide toward. */
function cellOf(move: Move, line: number, k: number) {
  if (move === 'left') return { row: line, col: k };
  if (move === 'right') return { row: line, col: SIZE - 1 - k };
  if (move === 'up') return { row: k, col: line };
  return { row: SIZE - 1 - k, col: line };
}

/** Slide every tile. A move that changes nothing returns `moved: false` and the same board (no spawn). */
export function slide(board: Board2048, move: Move): MoveResult {
  const live = liveTiles(board);
  const at = new Map(live.map((tile) => [tile.row * SIZE + tile.col, tile]));
  const tiles: Tile[] = [];
  const merges: number[] = [];
  let nextId = board.nextId;
  let gained = 0;
  let moved = false;

  for (let line = 0; line < SIZE; line += 1) {
    const inLine: Tile[] = [];
    for (let k = 0; k < SIZE; k += 1) {
      const { row, col } = cellOf(move, line, k);
      const tile = at.get(row * SIZE + col);
      if (tile) inLine.push(tile);
    }

    collapse(inLine, (tile) => tile.value).forEach((group, k) => {
      const { row, col } = cellOf(move, line, k);
      if (group.from.length === 1) {
        const [tile] = group.from;
        if (tile.row !== row || tile.col !== col) moved = true;
        tiles.push({ ...tile, row, col, kind: 'static' });
        return;
      }
      moved = true;
      gained += group.value;
      merges.push(group.value);
      for (const source of group.from) tiles.push({ ...source, row, col, kind: 'consumed' });
      tiles.push({ id: nextId, value: group.value, row, col, kind: 'merged' });
      nextId += 1;
    });
  }

  if (!moved) return { board, moved, gained: 0, merges: [] };
  return { board: { tiles, score: board.score + gained, nextId }, moved, gained, merges };
}

/** Slide, then spawn a new tile only if the slide changed the board. */
export function play(board: Board2048, move: Move, random = Math.random): MoveResult {
  const result = slide(board, move);
  return result.moved ? { ...result, board: spawn(result.board, random) } : result;
}

export function canMove(board: Board2048) {
  const live = liveTiles(board);
  if (live.length < SIZE * SIZE) return true;
  const value = new Map(live.map((tile) => [tile.row * SIZE + tile.col, tile.value]));
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const here = value.get(row * SIZE + col);
      if (col + 1 < SIZE && value.get(row * SIZE + col + 1) === here) return true;
      if (row + 1 < SIZE && value.get((row + 1) * SIZE + col) === here) return true;
    }
  }
  return false;
}

export function topTile(board: Board2048) {
  return liveTiles(board).reduce((top, tile) => Math.max(top, tile.value), 0);
}

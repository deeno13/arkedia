/**
 * Tower of Hanoi on three pegs. Disks are numbered by size (1 = smallest); each peg is
 * listed bottom to top. The goal is the whole tower on the right-hand peg.
 */

export const PEG_COUNT = 3;
export const GOAL_PEG = 2;
export const MIN_DISKS = 3;
export const MAX_DISKS = 8;

export type Pegs = number[][];
export type Move = [from: number, to: number];

export type MoveCheck =
  | { ok: true; disk: number }
  | { ok: false; reason: 'same-peg' | 'empty' | 'larger-on-smaller'; disk?: number; onto?: number };

export function createTower(disks: number): Pegs {
  return [Array.from({ length: disks }, (_, index) => disks - index), [], []];
}

export function topDisk(pegs: Pegs, peg: number): number | undefined {
  return pegs[peg][pegs[peg].length - 1];
}

export function checkMove(pegs: Pegs, from: number, to: number): MoveCheck {
  if (from === to) return { ok: false, reason: 'same-peg' };
  const disk = topDisk(pegs, from);
  if (disk === undefined) return { ok: false, reason: 'empty' };
  const onto = topDisk(pegs, to);
  if (onto !== undefined && onto < disk) return { ok: false, reason: 'larger-on-smaller', disk, onto };
  return { ok: true, disk };
}

/** Returns the new position, or the same object when the move is illegal. */
export function applyMove(pegs: Pegs, from: number, to: number): Pegs {
  if (!checkMove(pegs, from, to).ok) return pegs;
  const next = pegs.map((peg) => peg.slice());
  next[to].push(next[from].pop()!);
  return next;
}

export function isSolved(pegs: Pegs, disks: number, goal = GOAL_PEG) {
  return pegs[goal].length === disks;
}

export function optimalMoveCount(disks: number) {
  return 2 ** disks - 1;
}

/**
 * Shortest move sequence from ANY legal position to the whole tower on `goal`.
 * Work from the largest disk down: if it already sits on its target, ignore it and
 * solve the smaller disks towards the same target. Otherwise the smaller disks must
 * first clear onto the third peg, the big disk moves, and the smaller tower (now
 * perfectly stacked) follows in the classic 2^(k−1) − 1 moves.
 */
export function solveFrom(pegs: Pegs, goal = GOAL_PEG): Move[] {
  const location: number[] = [];
  pegs.forEach((peg, index) => peg.forEach((disk) => (location[disk] = index)));
  const disks = pegs.reduce((sum, peg) => sum + peg.length, 0);
  const moves: Move[] = [];

  function gather(disk: number, target: number) {
    if (disk === 0) return;
    const from = location[disk];
    if (from === target) {
      gather(disk - 1, target);
      return;
    }
    const spare = PEG_COUNT - from - target;
    gather(disk - 1, spare);
    moves.push([from, target]);
    location[disk] = target;
    gather(disk - 1, target);
  }

  gather(disks, goal);
  return moves;
}

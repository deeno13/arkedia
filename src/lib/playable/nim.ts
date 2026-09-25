/**
 * Nim: players alternately remove one or more objects from a single heap.
 * Normal play: whoever takes the last object wins. Misère: whoever takes it loses.
 */

export type NimRule = 'normal' | 'misere';

export interface NimMove {
  heap: number;
  take: number;
}

export const CLASSIC_HEAPS: readonly number[] = [3, 4, 5];
export const MAX_HEAP = 7;
export const HEAP_NAMES = ['A', 'B', 'C', 'D'] as const;

/** 3–4 heaps of 1–7 objects each. */
export function randomHeaps(random: () => number = Math.random): number[] {
  const count = 3 + Math.floor(random() * 2);
  return Array.from({ length: count }, () => 1 + Math.floor(random() * MAX_HEAP));
}

export function nimSum(heaps: readonly number[]): number {
  return heaps.reduce((sum, heap) => sum ^ heap, 0);
}

export function isOver(heaps: readonly number[]): boolean {
  return heaps.every((heap) => heap === 0);
}

export function applyMove(heaps: readonly number[], move: NimMove): number[] {
  return heaps.map((heap, index) => (index === move.heap ? heap - move.take : heap));
}

export function legalMoves(heaps: readonly number[]): NimMove[] {
  return heaps.flatMap((heap, index) => Array.from({ length: heap }, (_, i) => ({ heap: index, take: i + 1 })));
}

/** True when an endgame where every heap holds at most one object has been reached. */
export function isMisereEndgame(heaps: readonly number[]): boolean {
  return heaps.every((heap) => heap <= 1);
}

/**
 * Whether the player about to move can force a win (Bouton's theorem, plus the misère
 * exception: once every heap is 0 or 1, the mover wins exactly when the count of 1s is even).
 * On a finished board this reports the outcome for the player who would move next.
 */
export function moverWins(heaps: readonly number[], rule: NimRule): boolean {
  if (rule === 'misere' && isMisereEndgame(heaps)) {
    return heaps.filter((heap) => heap === 1).length % 2 === 0;
  }
  return nimSum(heaps) !== 0;
}

/** A move that leaves the opponent in a losing position, or null when none exists. */
export function winningMove(heaps: readonly number[], rule: NimRule): NimMove | null {
  if (isOver(heaps) || !moverWins(heaps, rule)) return null;

  if (rule === 'misere') {
    const big = heaps.filter((heap) => heap >= 2).length;
    if (big === 0) return { heap: heaps.findIndex((heap) => heap === 1), take: 1 };
    if (big === 1) {
      // Last big heap: cut it to 0 or 1 so an odd number of single objects remains.
      const index = heaps.findIndex((heap) => heap >= 2);
      const ones = heaps.filter((heap) => heap === 1).length;
      return { heap: index, take: ones % 2 === 1 ? heaps[index] : heaps[index] - 1 };
    }
  }

  const sum = nimSum(heaps);
  const index = heaps.findIndex((heap) => (heap ^ sum) < heap);
  return { heap: index, take: heaps[index] - (heaps[index] ^ sum) };
}

export function randomMove(heaps: readonly number[], random: () => number = Math.random): NimMove {
  const moves = legalMoves(heaps);
  return moves[Math.floor(random() * moves.length)];
}

/**
 * Easy picks any legal move. Hard plays perfectly; from a lost position it takes a single
 * object from the largest heap to keep the game long and give the opponent room to slip.
 */
export function computerMove(
  heaps: readonly number[],
  rule: NimRule,
  level: 'easy' | 'hard',
  random: () => number = Math.random,
): NimMove {
  if (level === 'easy') return randomMove(heaps, random);
  const best = winningMove(heaps, rule);
  if (best) return best;
  const largest = heaps.indexOf(Math.max(...heaps));
  return { heap: largest, take: 1 };
}

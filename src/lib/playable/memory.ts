/** Every face is a distinct geometric symbol with a unique spoken name. */
export const MEMORY_SYMBOLS = [
  'circle',
  'triangle',
  'square',
  'diamond',
  'star',
  'cross',
  'ring',
  'hexagon',
  'arrow',
  'crescent',
  'heart',
  'bolt',
  'hourglass',
  'drop',
  'semicircle',
  'bars',
  'four dots',
  'zigzag',
] as const;

export type MemorySymbol = (typeof MEMORY_SYMBOLS)[number];
export type MemorySize = '4x4' | '6x6';

export const MEMORY_SIZES: Record<MemorySize, { label: string; side: number; pairs: number }> = {
  '4x4': { label: '4×4', side: 4, pairs: 8 },
  '6x6': { label: '6×6', side: 6, pairs: 18 },
};

export interface MemoryState {
  /** Symbol on each card, in table order. */
  cards: MemorySymbol[];
  matched: boolean[];
  /** Face-up cards that are not yet matched: zero, one, or a mismatched pair waiting to turn back. */
  open: number[];
  /** One move = one pair of cards turned over. */
  moves: number;
}

export function createDeck(pairs: number, random: () => number = Math.random): MemoryState {
  const cards = MEMORY_SYMBOLS.slice(0, pairs).flatMap((symbol) => [symbol, symbol]);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, matched: cards.map(() => false), open: [], moves: 0 };
}

/** Whether the two open cards are a mismatch still on show. */
export function hasPendingMismatch(state: MemoryState): boolean {
  return state.open.length === 2;
}

/** Turns a mismatched pair back face down. */
export function hideMismatch(state: MemoryState): MemoryState {
  return hasPendingMismatch(state) ? { ...state, open: [] } : state;
}

/**
 * Turns one card face up. A mismatched pair still showing is turned back first, so the
 * player never has to wait. A second card completes a move and either matches or stays
 * open as a mismatch until hidden.
 */
export function flipCard(state: MemoryState, index: number): MemoryState {
  const base = hideMismatch(state);
  if (base.matched[index] || base.open.includes(index)) return base;
  if (base.open.length === 0) return { ...base, open: [index] };

  const first = base.open[0];
  const moves = base.moves + 1;
  if (base.cards[first] === base.cards[index]) {
    const matched = [...base.matched];
    matched[first] = true;
    matched[index] = true;
    return { ...base, matched, open: [], moves };
  }
  return { ...base, open: [first, index], moves };
}

export function isCleared(state: MemoryState): boolean {
  return state.matched.every(Boolean);
}

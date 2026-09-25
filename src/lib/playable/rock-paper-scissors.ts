export const RPS_MOVES = ['rock', 'paper', 'scissors'] as const;

export type RpsMove = (typeof RPS_MOVES)[number];
export type RpsOutcome = 'win' | 'loss' | 'draw';
export type OpponentStyle = 'random' | 'copycat' | 'counter' | 'pattern';

/** First to this many round wins takes the match. */
export const MATCH_TARGET = 5;

/** The move each move defeats. */
export const BEATS: Record<RpsMove, RpsMove> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

/** The move that defeats each move. */
export const BEATEN_BY: Record<RpsMove, RpsMove> = { rock: 'paper', paper: 'scissors', scissors: 'rock' };

export interface OpponentChoice {
  move: RpsMove;
  /** Plain-language reason, revealed after the match. */
  reason: string;
  /** False when the choice fell back to a coin flip, so nothing in your history predicted it. */
  predictable: boolean;
}

export function roundOutcome(player: RpsMove, opponent: RpsMove): RpsOutcome {
  if (player === opponent) return 'draw';
  return BEATS[player] === opponent ? 'win' : 'loss';
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export type MoveCounts = Record<RpsMove, number>;

export function countMoves(moves: readonly RpsMove[]): MoveCounts {
  const counts: MoveCounts = { rock: 0, paper: 0, scissors: 0 };
  for (const move of moves) counts[move] += 1;
  return counts;
}

/** The most frequent moves in a tally (several when tied); empty when nothing was counted. */
function topMoves(counts: MoveCounts): RpsMove[] {
  const max = Math.max(...RPS_MOVES.map((move) => counts[move]));
  return max === 0 ? [] : RPS_MOVES.filter((move) => counts[move] === max);
}

/**
 * Follow-up tally keyed by context: for each run of `order` consecutive moves, how often
 * each move came next. Keys join moves with a space, e.g. "rock paper".
 */
export function followUpTable(history: readonly RpsMove[], order: number): Map<string, MoveCounts> {
  const table = new Map<string, MoveCounts>();
  for (let i = order; i < history.length; i++) {
    const key = history.slice(i - order, i).join(' ');
    const counts = table.get(key) ?? { rock: 0, paper: 0, scissors: 0 };
    counts[history[i]] += 1;
    table.set(key, counts);
  }
  return table;
}

const name = (move: RpsMove) => move[0].toUpperCase() + move.slice(1);

/**
 * The opponent's next move given the player's moves so far this match (oldest first).
 * Ties and missing data fall back to a uniform random pick.
 */
export function opponentChoice(style: OpponentStyle, history: readonly RpsMove[], random: () => number = Math.random): OpponentChoice {
  const coinFlip = (reason: string): OpponentChoice => ({ move: pick(RPS_MOVES, random), reason, predictable: false });

  if (style === 'random') return coinFlip('Random pick');

  const last = history.at(-1);
  if (style === 'copycat') {
    return last ? { move: last, reason: `Copied your ${name(last)}`, predictable: true } : coinFlip('Random first move');
  }

  if (style === 'counter') {
    const top = topMoves(countMoves(history));
    if (top.length === 0) return coinFlip('Random first move');
    const target = pick(top, random);
    const reason = `Your most played was ${top.map(name).join(' and ')}`;
    return { move: BEATEN_BY[target], reason: top.length > 1 ? `${reason}; beat ${name(target)}` : reason, predictable: top.length === 1 };
  }

  // Pattern hunter: longest context with data wins — last two moves, then last move, then overall.
  for (const order of [2, 1]) {
    if (history.length < order) continue;
    const key = history.slice(-order).join(' ');
    const counts = followUpTable(history, order).get(key);
    const top = counts ? topMoves(counts) : [];
    if (top.length === 0) continue;
    const predicted = pick(top, random);
    const context = history.slice(-order).map(name).join(', ');
    return {
      move: BEATEN_BY[predicted],
      reason: `After ${context} you ${top.length > 1 ? 'split between' : 'usually played'} ${top.map(name).join(' and ')}`,
      predictable: top.length === 1,
    };
  }
  const top = topMoves(countMoves(history));
  if (top.length === 0) return coinFlip('Random first move');
  const predicted = pick(top, random);
  return { move: BEATEN_BY[predicted], reason: `No pattern yet; beat your most played`, predictable: top.length === 1 };
}

export const STYLE_NOTES: Record<OpponentStyle, { name: string; decides: string; beat: string }> = {
  random: {
    name: 'Random',
    decides: 'Every round it picks rock, paper or scissors with equal chance, ignoring everything you have done.',
    beat: 'You can’t. Whatever you play, you win, lose and draw a third of the time each in the long run. That is exactly why random play is the equilibrium.',
  },
  copycat: {
    name: 'Copycat',
    decides: 'It plays whatever you played last round. Only its first move is random.',
    beat: 'Play the move that beats your own previous move. Threw rock last round? It will throw rock, so you throw paper.',
  },
  counter: {
    name: 'Counter',
    decides: 'It tallies your moves and plays whatever beats the one you have played most.',
    beat: 'Find your most-played move and throw the move it beats. Rock-heavy? It expects rock and plays paper, so you play scissors.',
  },
  pattern: {
    name: 'Pattern hunter',
    decides: 'It keeps a table of what you played after each pair of moves, predicts your most common follow-up, and plays what beats it. With no data for a pair it uses your last move, then your overall favourite.',
    beat: 'Break your habits before it learns them, or be genuinely random. A player who repeats a cycle is eaten alive within a few rounds.',
  },
};

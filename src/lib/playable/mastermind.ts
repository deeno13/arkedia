/**
 * Mastermind: a hidden code of 4 pegs drawn from 6 colours, 10 guesses to find it.
 * Colours are indices 0–5 so the logic stays independent of how pegs are drawn.
 */

export const CODE_LENGTH = 4;
export const COLOUR_COUNT = 6;
export const MAX_GUESSES = 10;

export type Code = number[];

export interface Feedback {
  /** Right colour in the right place (black key peg). */
  exact: number;
  /** Right colour in the wrong place (white key peg). */
  misplaced: number;
}

export interface ScoredGuess {
  guess: Code;
  feedback: Feedback;
}

/**
 * Scores a guess against the secret. Duplicates are handled by counting, per colour,
 * the smaller of its occurrences in secret and guess; that total minus the exact hits
 * is the number of misplaced pegs.
 */
export function scoreGuess(secret: Code, guess: Code): Feedback {
  const secretCounts = new Array<number>(COLOUR_COUNT).fill(0);
  const guessCounts = new Array<number>(COLOUR_COUNT).fill(0);
  let exact = 0;
  for (let index = 0; index < secret.length; index += 1) {
    if (secret[index] === guess[index]) exact += 1;
    secretCounts[secret[index]] += 1;
    guessCounts[guess[index]] += 1;
  }
  let shared = 0;
  for (let colour = 0; colour < COLOUR_COUNT; colour += 1) shared += Math.min(secretCounts[colour], guessCounts[colour]);
  return { exact, misplaced: shared - exact };
}

/** Every code the setter could have chosen: 1296 with repeats, 360 without. */
export function allCodes(allowRepeats: boolean): Code[] {
  const codes: Code[] = [];
  const total = COLOUR_COUNT ** CODE_LENGTH;
  for (let value = 0; value < total; value += 1) {
    const code: Code = [];
    let rest = value;
    for (let index = 0; index < CODE_LENGTH; index += 1) {
      code.unshift(rest % COLOUR_COUNT);
      rest = Math.floor(rest / COLOUR_COUNT);
    }
    if (allowRepeats || new Set(code).size === CODE_LENGTH) codes.push(code);
  }
  return codes;
}

/** Codes that would have produced exactly the feedback seen so far. */
export function consistentCodes(candidates: Code[], history: ScoredGuess[]): Code[] {
  return candidates.filter((code) =>
    history.every(({ guess, feedback }) => {
      const result = scoreGuess(code, guess);
      return result.exact === feedback.exact && result.misplaced === feedback.misplaced;
    }),
  );
}

export function randomCode(allowRepeats: boolean, random: () => number = Math.random): Code {
  const code: Code = [];
  while (code.length < CODE_LENGTH) {
    const colour = Math.floor(random() * COLOUR_COUNT);
    if (allowRepeats || !code.includes(colour)) code.push(colour);
  }
  return code;
}

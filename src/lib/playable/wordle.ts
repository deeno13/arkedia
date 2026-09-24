import { ALLOWED_GUESSES, ANSWERS } from './wordle-words';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type LetterStatus = 'correct' | 'present' | 'absent';

export interface EvaluatedLetter {
  letter: string;
  status: LetterStatus;
}

export interface EvaluatedGuess {
  guess: string;
  letters: EvaluatedLetter[];
  isCorrect: boolean;
}

export function getRandomWord(random = Math.random) {
  return ANSWERS[Math.floor(random() * ANSWERS.length)];
}

export function isAllowedWord(value: string) {
  return ALLOWED_GUESSES.has(value.toLowerCase());
}

/**
 * Scores a guess the standard way: exact matches first, then "present" marks are handed
 * out left to right only while unmatched copies of that letter remain in the answer.
 */
export function evaluateGuess(guess: string, answer: string): EvaluatedGuess {
  const normalizedGuess = guess.toLowerCase();
  const normalizedAnswer = answer.toLowerCase();
  const answerLetters = normalizedAnswer.split('');
  const result: EvaluatedLetter[] = normalizedGuess.split('').map((letter) => ({
    letter,
    status: 'absent',
  }));

  for (let index = 0; index < result.length; index += 1) {
    if (normalizedGuess[index] === answerLetters[index]) {
      result[index].status = 'correct';
      answerLetters[index] = '_';
    }
  }

  for (let index = 0; index < result.length; index += 1) {
    if (result[index].status === 'correct') {
      continue;
    }

    const answerIndex = answerLetters.indexOf(normalizedGuess[index]);

    if (answerIndex >= 0) {
      result[index].status = 'present';
      answerLetters[answerIndex] = '_';
    }
  }

  return {
    guess: normalizedGuess,
    letters: result,
    isCorrect: normalizedGuess === normalizedAnswer,
  };
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

/**
 * Hard mode: every green must stay put and every revealed letter must be reused (as many
 * copies as any single earlier guess proved). Returns the first broken rule, or null.
 */
export function hardModeViolation(guess: string, history: EvaluatedGuess[]): string | null {
  const normalized = guess.toLowerCase();

  for (const row of history) {
    for (let index = 0; index < row.letters.length; index += 1) {
      const { letter, status } = row.letters[index];
      if (status === 'correct' && normalized[index] !== letter) {
        return `The ${ORDINALS[index]} letter must be ${letter.toUpperCase()}.`;
      }
    }
  }

  for (const row of history) {
    const required: Record<string, number> = {};
    for (const { letter, status } of row.letters) {
      if (status !== 'absent') required[letter] = (required[letter] ?? 0) + 1;
    }
    for (const [letter, count] of Object.entries(required)) {
      const used = normalized.split('').filter((candidate) => candidate === letter).length;
      if (used < count) {
        return count > 1 ? `Use ${letter.toUpperCase()} at least ${count} times.` : `The guess must contain ${letter.toUpperCase()}.`;
      }
    }
  }

  return null;
}

const STATUS_RANK: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 };

/** Best-known status of each letter across all guesses, for colouring the keyboard. */
export function keyboardStatuses(history: EvaluatedGuess[]): Record<string, LetterStatus> {
  const statuses: Record<string, LetterStatus> = {};
  for (const row of history) {
    for (const { letter, status } of row.letters) {
      const known = statuses[letter];
      if (!known || STATUS_RANK[status] > STATUS_RANK[known]) statuses[letter] = status;
    }
  }
  return statuses;
}

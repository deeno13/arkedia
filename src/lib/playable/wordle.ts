export const WORDLE_WORDS = ['logic', 'sound', 'trace', 'graph', 'prime'] as const;

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
  return WORDLE_WORDS[Math.floor(random() * WORDLE_WORDS.length)];
}

export function isAllowedWord(value: string) {
  return WORDLE_WORDS.includes(value as (typeof WORDLE_WORDS)[number]);
}

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

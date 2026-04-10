import { useMemo, useState } from 'react';
import { evaluateGuess, getRandomWord, isAllowedWord, type EvaluatedGuess } from '../../lib/playable/wordle';

const MAX_GUESSES = 6;

export default function WordleMiniGame() {
  const [answer, setAnswer] = useState(() => getRandomWord());
  const [value, setValue] = useState('');
  const [guesses, setGuesses] = useState<EvaluatedGuess[]>([]);
  const [message, setMessage] = useState('Enter a five-letter word to begin.');

  const hasWon = guesses.some((guess) => guess.isCorrect);
  const hasLost = guesses.length >= MAX_GUESSES && !hasWon;

  const remaining = MAX_GUESSES - guesses.length;

  const keyboardSummary = useMemo(() => {
    const statuses = new Map<string, 'correct' | 'present' | 'absent'>();

    for (const guess of guesses) {
      for (const letter of guess.letters) {
        const current = statuses.get(letter.letter);

        if (current === 'correct') {
          continue;
        }

        if (current === 'present' && letter.status === 'absent') {
          continue;
        }

        statuses.set(letter.letter, letter.status);
      }
    }

    return Array.from(statuses.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [guesses]);

  function reset() {
    setAnswer(getRandomWord());
    setGuesses([]);
    setValue('');
    setMessage('New puzzle loaded. Enter a five-letter word.');
  }

  function submitGuess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const guess = value.trim().toLowerCase();

    if (guess.length !== 5) {
      setMessage('Use exactly five letters.');
      return;
    }

    if (!isAllowedWord(guess)) {
      setMessage('Try one of the included five-letter practice words.');
      return;
    }

    if (hasWon || hasLost) {
      return;
    }

    const evaluated = evaluateGuess(guess, answer);
    const nextGuesses = [...guesses, evaluated];
    setGuesses(nextGuesses);
    setValue('');

    if (evaluated.isCorrect) {
      setMessage(`Solved! The answer was ${answer.toUpperCase()}.`);
      return;
    }

    if (nextGuesses.length >= MAX_GUESSES) {
      setMessage(`No guesses remaining. The answer was ${answer.toUpperCase()}.`);
      return;
    }

    setMessage(`${MAX_GUESSES - nextGuesses.length} guesses left.`);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submitGuess} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-slate-800">
          Guess a five-letter word
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={5}
            value={value}
            disabled={hasWon || hasLost}
            onChange={(event) => setValue(event.target.value.replace(/[^a-z]/gi, '').slice(0, 5))}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base tracking-[0.3em] uppercase text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          />
        </label>
        <button
          type="submit"
          disabled={hasWon || hasLost}
          className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Submit guess
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Start a new puzzle
        </button>
      </form>

      <p className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700" aria-live="polite">
        {message}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.75fr)]">
        <div className="space-y-3">
          {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
            const row = guesses[rowIndex];

            return (
              <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }, (_, letterIndex) => {
                  const letter = row?.letters[letterIndex];
                  const status = letter?.status;

                  return (
                    <div
                      key={`cell-${rowIndex}-${letterIndex}`}
                      className={[
                        'rounded-xl border px-3 py-4 text-center text-sm font-semibold uppercase',
                        status === 'correct'
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                          : status === 'present'
                            ? 'border-amber-300 bg-amber-100 text-amber-900'
                            : status === 'absent'
                              ? 'border-slate-300 bg-slate-200 text-slate-700'
                              : 'border-slate-200 bg-white text-slate-300',
                      ].join(' ')}
                    >
                      <span>{letter?.letter ?? ''}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-950">Legend</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Correct: right letter, right place</li>
              <li>Present: right letter, wrong place</li>
              <li>Absent: not used in the answer</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-950">Letter notes</h3>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
              {keyboardSummary.length > 0 ? (
                keyboardSummary.map(([letter, status]) => (
                  <li
                    key={letter}
                    className={[
                      'rounded-full border px-3 py-1 font-medium uppercase',
                      status === 'correct'
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                        : status === 'present'
                          ? 'border-amber-300 bg-amber-100 text-amber-900'
                          : 'border-slate-300 bg-slate-100 text-slate-700',
                    ].join(' ')}
                  >
                    {letter} · {status}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No letter clues yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            Remaining guesses: <strong>{remaining}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

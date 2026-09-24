import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { recordRound } from '../../lib/progress';
import {
  MAX_GUESSES,
  WORD_LENGTH,
  evaluateGuess,
  getRandomWord,
  hardModeViolation,
  isAllowedWord,
  keyboardStatuses,
  type EvaluatedGuess,
  type LetterStatus,
} from '../../lib/playable/wordle';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';

type Mode = 'normal' | 'hard';

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

const STATUS_WORDS: Record<LetterStatus, string> = {
  correct: 'right spot',
  present: 'in the word, wrong spot',
  absent: 'not in the word',
};

const TILE_CLASSES: Record<LetterStatus, string> = {
  correct: 'border-green bg-green text-white',
  present: 'border-mustard bg-mustard text-ink',
  absent: 'border-ink-muted bg-ink-muted text-white',
};

const KEY_CLASSES: Record<LetterStatus, string> = {
  correct: 'bg-green text-white',
  present: 'bg-mustard text-ink',
  absent: 'bg-ink-muted text-white',
};

/** Non-colour marker: a corner notch for "right spot", a ring for "wrong spot". */
function StatusMark({ status }: { status: LetterStatus }) {
  if (status === 'correct') {
    return (
      <svg aria-hidden="true" viewBox="0 0 10 10" className="absolute right-0 top-0 size-[28%]">
        <path d="M0 0H10V10Z" fill="currentColor" />
      </svg>
    );
  }
  if (status === 'present') {
    return (
      <svg aria-hidden="true" viewBox="0 0 10 10" className="absolute right-[7%] top-[7%] size-[22%]">
        <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }
  return null;
}

const describeGuess = (row: EvaluatedGuess) =>
  row.letters.map(({ letter, status }) => `${letter.toUpperCase()} ${STATUS_WORDS[status]}`).join(', ');

export default function WordleGame({ slug }: { slug: string }) {
  const progress = useProgress(slug);
  const [mode, setMode] = usePref<Mode>(slug, 'mode', 'normal');
  const [distributionPref, setDistributionPref] = usePref(slug, 'distribution', '0,0,0,0,0,0');
  const [answer, setAnswer] = useState(() => getRandomWord());
  const [history, setHistory] = useState<EvaluatedGuess[]>([]);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState(`Guess 1 of ${MAX_GUESSES}. Type a five-letter word and press Enter.`);
  const [result, setResult] = useState<GameResult | null>(null);
  const [lastWinRow, setLastWinRow] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  const over = result !== null;
  const keyStates = keyboardStatuses(history);
  const distribution = distributionPref.split(',').map((value) => Number(value) || 0);
  const maxCount = Math.max(1, ...distribution, progress.losses);
  const bestGuesses = progress.best[mode];

  function shakeRow(index: number) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    rowRefs.current[index]?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 220, easing: 'ease-out' },
    );
  }

  function submit() {
    const row = history.length;
    if (current.length < WORD_LENGTH) {
      setStatus(`Not enough letters: ${current.length} of ${WORD_LENGTH}.`);
      shakeRow(row);
      return;
    }
    if (!isAllowedWord(current)) {
      setStatus(`${current.toUpperCase()} is not in the word list. Try another word.`);
      shakeRow(row);
      return;
    }
    if (mode === 'hard') {
      const violation = hardModeViolation(current, history);
      if (violation) {
        setStatus(`Hard mode: ${violation}`);
        shakeRow(row);
        return;
      }
    }

    const evaluated = evaluateGuess(current, answer);
    const nextHistory = [...history, evaluated];
    const used = nextHistory.length;
    setHistory(nextHistory);
    setCurrent('');

    if (evaluated.isCorrect) {
      const { isNewBest } = recordRound(slug, { outcome: 'win', score: used, scoreOrder: 'lower', bucket: mode });
      const nextDistribution = [...distribution];
      nextDistribution[used - 1] += 1;
      setDistributionPref(nextDistribution.join(','));
      setLastWinRow(used - 1);
      setResult({
        title: `Solved in ${used}`,
        detail: `${answer.toUpperCase()}${isNewBest ? ` — a new best for ${mode === 'hard' ? 'Hard' : 'Normal'} mode.` : '.'}`,
        tone: 'win',
      });
      return;
    }

    if (used >= MAX_GUESSES) {
      recordRound(slug, { outcome: 'loss', bucket: mode });
      setLastWinRow(null);
      setResult({ title: `The word was ${answer.toUpperCase()}`, detail: 'Out of guesses. Your streak resets.', tone: 'loss' });
      return;
    }

    setStatus(`${evaluated.guess.toUpperCase()}: ${describeGuess(evaluated)}. Guess ${used + 1} of ${MAX_GUESSES}.`);
  }

  function press(key: string) {
    if (over) return;
    if (key === 'enter') {
      submit();
    } else if (key === 'backspace') {
      setCurrent((value) => value.slice(0, -1));
    } else if (/^[a-z]$/.test(key) && current.length < WORD_LENGTH) {
      setCurrent((value) => (value.length < WORD_LENGTH ? value + key : value));
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement;
    // Let focused buttons (on-screen keys, options) activate themselves with Enter/Space.
    if (target.tagName === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) return;
    const key = event.key.toLowerCase();
    if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
      event.preventDefault();
      press(key);
    }
  }

  function handleKeyClick(event: MouseEvent<HTMLButtonElement>, key: string) {
    press(key);
    // A pointer tap hands focus to the board so a physical keyboard keeps working.
    if (event.detail > 0) boardRef.current?.focus({ preventScroll: true });
  }

  function newGame() {
    const next = getRandomWord();
    setAnswer(next === answer ? getRandomWord() : next);
    setHistory([]);
    setCurrent('');
    setResult(null);
    setLastWinRow(null);
    setStatus(`New word. Guess 1 of ${MAX_GUESSES}.`);
  }

  function rowLabel(index: number) {
    const row = history[index];
    if (row) return `Guess ${index + 1}: ${describeGuess(row)}`;
    if (index === history.length && !over) {
      return current ? `Guess ${index + 1}, typing: ${current.toUpperCase().split('').join(' ')}` : `Guess ${index + 1}, empty`;
    }
    return `Guess ${index + 1}, unused`;
  }

  return (
    <GameFrame
      label="Five-Letter Word Guess"
      options={
        <Segmented<Mode>
          label="Mode"
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' },
          ]}
          value={mode}
          onChange={setMode}
          disabled={history.length > 0 && !over}
        />
      }
      stats={[
        { label: 'Wins', value: progress.wins },
        { label: 'Streak', value: progress.streak },
        { label: 'Best streak', value: progress.bestStreak },
        { label: 'Best', value: bestGuesses === undefined ? '—' : `${bestGuesses}/${MAX_GUESSES}` },
      ]}
      onNewGame={newGame}
      newGameLabel="New word"
      status={status}
      result={result}
    >
      <div onKeyDown={handleKeyDown} className="mx-auto flex max-w-[22rem] flex-col gap-5">
        <div
          ref={boardRef}
          tabIndex={0}
          aria-label="Word board. Type letters, press Enter to guess, Backspace to delete."
          aria-describedby={`${slug}-mode-note`}
          className="mx-auto w-full max-w-[17.5rem] rounded-die outline-offset-4"
        >
          <ol className="grid gap-1.5">
            {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
              const row = history[rowIndex];
              const typing = rowIndex === history.length && !over ? current : '';
              return (
                <li
                  key={rowIndex}
                  ref={(node) => {
                    rowRefs.current[rowIndex] = node;
                  }}
                  aria-label={rowLabel(rowIndex)}
                  className="grid grid-cols-5 gap-1.5"
                >
                  {Array.from({ length: WORD_LENGTH }, (_, colIndex) => {
                    const cell = row?.letters[colIndex];
                    const letter = cell?.letter ?? typing[colIndex] ?? '';
                    return (
                      <span
                        key={colIndex}
                        aria-hidden="true"
                        className={[
                          'relative flex aspect-square items-center justify-center overflow-hidden rounded-[4px] border-2 text-[clamp(1.25rem,6vw,1.75rem)] font-black uppercase font-stretch-semi-expanded transition-colors duration-200 ease-out',
                          cell ? TILE_CLASSES[cell.status] : letter ? 'border-ink bg-card text-ink' : 'border-rule bg-card text-ink',
                        ].join(' ')}
                      >
                        {letter}
                        {cell && <StatusMark status={cell.status} />}
                      </span>
                    );
                  })}
                </li>
              );
            })}
          </ol>
        </div>
        <p id={`${slug}-mode-note`} className="sr-only">
          {mode === 'hard' ? 'Hard mode: every revealed hint must be used in later guesses.' : 'Normal mode.'}
        </p>

        <div aria-label="On-screen keyboard" role="group" className="flex flex-col gap-1.5">
          {KEY_ROWS.map((keys, rowIndex) => (
            <div key={keys} className="flex justify-center gap-1">
              {rowIndex === 2 && (
                <button
                  type="button"
                  onClick={(event) => handleKeyClick(event, 'enter')}
                  disabled={over}
                  className="h-12 min-w-0 flex-[1.6] rounded-[4px] border-2 border-ink bg-ink px-1 text-xs font-bold uppercase text-paper transition-colors duration-150 hover:bg-game hover:text-on-game disabled:opacity-45"
                >
                  Enter
                </button>
              )}
              {keys.split('').map((key) => {
                const keyStatus = keyStates[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(event) => handleKeyClick(event, key)}
                    disabled={over}
                    aria-label={keyStatus ? `${key.toUpperCase()}, ${STATUS_WORDS[keyStatus]}` : key.toUpperCase()}
                    className={[
                      'relative h-12 min-w-0 flex-1 overflow-hidden rounded-[4px] text-base font-bold uppercase transition-colors duration-150 disabled:cursor-default',
                      keyStatus ? KEY_CLASSES[keyStatus] : 'bg-paper-deep text-ink enabled:hover:bg-rule',
                    ].join(' ')}
                  >
                    {key}
                    {keyStatus && <StatusMark status={keyStatus} />}
                  </button>
                );
              })}
              {rowIndex === 2 && (
                <button
                  type="button"
                  onClick={(event) => handleKeyClick(event, 'backspace')}
                  disabled={over}
                  aria-label="Backspace"
                  className="flex h-12 min-w-0 flex-[1.6] items-center justify-center rounded-[4px] border-2 border-ink text-ink transition-colors duration-150 hover:bg-paper-deep disabled:opacity-45"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M8 5h12v14H8l-6-7z" />
                    <path d="M11 9l6 6M17 9l-6 6" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <figure className="border-t-2 border-ink pt-3">
          <figcaption className="text-sm font-semibold text-ink-soft">Guess distribution</figcaption>
          <ol className="mt-2 grid grid-cols-7 items-end gap-1.5 text-center text-xs tabular-nums">
            {[...distribution, progress.losses].map((count, index) => {
              const lost = index === MAX_GUESSES;
              return (
                <li key={index} aria-label={lost ? `Lost: ${count}` : `Won in ${index + 1}: ${count}`} className="flex flex-col items-stretch gap-1">
                  <span aria-hidden="true" className="font-bold">
                    {count}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      'block rounded-[3px] transition-[height] duration-200 ease-out',
                      lost ? 'bg-ink-muted' : lastWinRow === index ? 'bg-game' : 'bg-ink',
                    ].join(' ')}
                    style={{ height: `${0.25 + (count / maxCount) * 2.25}rem` }}
                  />
                  <span aria-hidden="true" className="font-semibold text-ink-soft">
                    {lost ? 'Lost' : index + 1}
                  </span>
                </li>
              );
            })}
          </ol>
        </figure>
      </div>
    </GameFrame>
  );
}

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { recordRound } from '../../lib/progress';
import { PEERS, boxOf, colOf, generateSudoku, rowOf, type SudokuDifficulty, type SudokuPuzzle } from '../../lib/playable/sudoku';
import { Button } from './kit/Button';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';

interface Snapshot {
  values: number[];
  notes: number[];
}

interface Game extends Snapshot {
  puzzle: SudokuPuzzle;
  history: Snapshot[];
  hints: number;
}

const DIFFICULTIES: { value: SudokuDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function newGame(difficulty: SudokuDifficulty): Game {
  const puzzle = generateSudoku(difficulty);
  return { puzzle, values: puzzle.puzzle.slice(), notes: Array(81).fill(0), history: [], hints: 0 };
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const where = (index: number) => `Row ${rowOf(index) + 1}, column ${colOf(index) + 1}`;

/** Places a digit and wipes it from the pencil marks of every cell that can now no longer hold it. */
function place(values: number[], notes: number[], index: number, digit: number): Snapshot {
  const nextValues = values.slice();
  const nextNotes = notes.slice();
  nextValues[index] = digit;
  nextNotes[index] = 0;
  for (const peer of PEERS[index]) nextNotes[peer] &= ~(1 << digit);
  return { values: nextValues, notes: nextNotes };
}

export default function SudokuGame({ slug }: { slug: string }) {
  const progress = useProgress(slug);
  const [difficulty, setDifficulty] = usePref<SudokuDifficulty>(slug, 'difficulty', 'easy');
  const [game, setGame] = useState(() => newGame(difficulty));
  const [selected, setSelected] = useState(() => game.values.indexOf(0));
  const [notesMode, setNotesMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('Pick an empty square, then type or tap a digit.');
  const [result, setResult] = useState<GameResult | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { puzzle, values, notes } = game;
  const solved = result !== null;
  const best = progress.best[difficulty];

  useEffect(() => {
    if (solved) return undefined;
    // The clock only runs while the page is actually visible.
    const timer = window.setInterval(() => {
      if (!document.hidden) setSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [solved, game.puzzle]);

  const conflicts = useMemo(
    () => new Set(values.flatMap((digit, index) => (digit && PEERS[index].some((peer) => values[peer] === digit) ? [index] : []))),
    [values],
  );

  const placedCounts = useMemo(() => DIGITS.map((digit) => values.filter((value) => value === digit).length), [values]);

  function start(level: SudokuDifficulty) {
    const next = newGame(level);
    setGame(next);
    setSelected(next.values.indexOf(0));
    setSeconds(0);
    setResult(null);
    setNotesMode(false);
    setStatus(`New ${level} puzzle: ${next.values.filter(Boolean).length} givens. Pick an empty square.`);
  }

  function changeDifficulty(level: SudokuDifficulty) {
    setDifficulty(level);
    start(level);
  }

  function finish(next: Game) {
    const hinted = next.hints > 0;
    const { isNewBest, previousBest } = recordRound(slug, {
      outcome: 'win',
      ...(hinted ? {} : { score: seconds, scoreOrder: 'lower' as const }),
      bucket: difficulty,
    });
    const level = DIFFICULTIES.find((option) => option.value === difficulty)!.label;
    const detail = hinted
      ? `${formatTime(seconds)} on ${level} with ${next.hints} ${next.hints === 1 ? 'hint' : 'hints'}. Hinted rounds don't set a best.`
      : isNewBest
        ? `${formatTime(seconds)} on ${level}: ${previousBest === undefined ? 'your first' : 'a new'} best.`
        : `${formatTime(seconds)} on ${level}. Your best is ${formatTime(previousBest!)}.`;
    setResult({ title: 'Solved', detail, tone: 'win' });
  }

  /** Commits a move: saves the undo snapshot, then checks for a finished grid. */
  function commit(snapshot: Snapshot, message: string, hints = game.hints) {
    const next: Game = { ...game, ...snapshot, hints, history: [...game.history, { values, notes }] };
    setGame(next);
    setStatus(message);
    if (next.values.every((digit, index) => digit === puzzle.solution[index])) finish(next);
  }

  function enter(digit: number, asNote = notesMode) {
    if (solved || selected < 0) return;
    if (puzzle.puzzle[selected]) {
      setStatus(`${where(selected)} is a given ${puzzle.puzzle[selected]}; it can't change.`);
      return;
    }
    if (asNote) {
      if (values[selected]) {
        setStatus(`${where(selected)} already holds ${values[selected]}. Erase it before adding notes.`);
        return;
      }
      const nextNotes = notes.slice();
      nextNotes[selected] ^= 1 << digit;
      const on = Boolean(nextNotes[selected] & (1 << digit));
      commit({ values, notes: nextNotes }, `${where(selected)}: note ${digit} ${on ? 'added' : 'removed'}.`);
      return;
    }
    if (values[selected] === digit) return;
    const snapshot = place(values, notes, selected, digit);
    const clash = PEERS[selected].find((peer) => snapshot.values[peer] === digit);
    const unit =
      clash === undefined
        ? ''
        : rowOf(clash) === rowOf(selected)
          ? `row ${rowOf(selected) + 1}`
          : colOf(clash) === colOf(selected)
            ? `column ${colOf(selected) + 1}`
            : 'this box';
    const clashWith = unit ? ` Clash: ${unit} already has ${digit === 8 ? 'an' : 'a'} ${digit}.` : '';
    commit(snapshot, `${where(selected)}: ${digit}.${clashWith}`);
  }

  function erase() {
    if (solved || selected < 0) return;
    if (puzzle.puzzle[selected]) {
      setStatus(`${where(selected)} is a given; there is nothing to erase.`);
      return;
    }
    if (!values[selected] && !notes[selected]) return;
    const nextValues = values.slice();
    const nextNotes = notes.slice();
    nextValues[selected] = 0;
    nextNotes[selected] = 0;
    commit({ values: nextValues, notes: nextNotes }, `${where(selected)} cleared.`);
  }

  function undo() {
    const last = game.history.at(-1);
    if (!last || solved) return;
    setGame({ ...game, ...last, history: game.history.slice(0, -1) });
    setStatus('Undid the last change.');
  }

  function hint() {
    if (solved) return;
    const open = (index: number) => values[index] !== puzzle.solution[index];
    let target = selected >= 0 && open(selected) ? selected : -1;
    if (target === -1) {
      // Reveal the most constrained open square: the one a solver would look at next.
      let fewest = 10;
      values.forEach((_, index) => {
        if (!open(index)) return;
        const used = new Set(PEERS[index].map((peer) => (values[peer] === puzzle.solution[peer] ? values[peer] : 0)));
        const count = DIGITS.filter((digit) => !used.has(digit)).length;
        if (count < fewest) {
          fewest = count;
          target = index;
        }
      });
    }
    if (target === -1) return;
    const digit = puzzle.solution[target];
    setSelected(target);
    commit(place(values, notes, target, digit), `Hint: ${where(target).toLowerCase()} is ${digit}.`, game.hints + 1);
  }

  function move(index: number) {
    setSelected(index);
    cellRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey) return;
    const index = Math.max(selected, 0);
    const [row, col] = [rowOf(index), colOf(index)];
    const arrows: Record<string, number> = {
      ArrowUp: Math.max(row - 1, 0) * 9 + col,
      ArrowDown: Math.min(row + 1, 8) * 9 + col,
      ArrowLeft: row * 9 + Math.max(col - 1, 0),
      ArrowRight: row * 9 + Math.min(col + 1, 8),
      Home: row * 9,
      End: row * 9 + 8,
    };
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1] ?? (/^[1-9]$/.test(event.key) ? event.key : null);

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') undo();
    else if (event.metaKey || event.ctrlKey) return;
    else if (event.key in arrows) move(arrows[event.key]);
    else if (digit) enter(Number(digit), notesMode || event.shiftKey);
    else if (['Backspace', 'Delete', '0'].includes(event.key)) erase();
    else if (event.key.toLowerCase() === 'n') {
      setNotesMode(!notesMode);
      setStatus(`Notes ${notesMode ? 'off: digits are answers' : 'on: digits are pencil marks'}.`);
    } else return;
    event.preventDefault();
  }

  const selectedDigit = selected >= 0 ? values[selected] : 0;

  return (
    <GameFrame
      label="Sudoku board"
      options={<Segmented label="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={changeDifficulty} />}
      stats={[
        { label: 'Time', value: formatTime(seconds) },
        { label: 'Best', value: best === undefined ? '—' : formatTime(best) },
        { label: 'Hints', value: game.hints },
      ]}
      onNewGame={() => start(difficulty)}
      actions={
        !solved && (
          <>
            <Button size="sm" onClick={undo} disabled={game.history.length === 0}>
              Undo
            </Button>
            <Button size="sm" onClick={hint}>
              Hint
            </Button>
          </>
        )
      }
      status={status}
      result={result}
    >
      <div className="@container">
        <div className="mx-auto flex max-w-[27rem] flex-col gap-4 @[36rem]:max-w-none @[36rem]:flex-row @[36rem]:items-start @[36rem]:justify-center">
          <div
            role="grid"
            aria-label={`Sudoku, ${DIFFICULTIES.find((option) => option.value === difficulty)!.label}`}
            aria-describedby="sudoku-keys"
            onKeyDown={handleKeyDown}
            className="@container grid aspect-square w-full shrink-0 grid-cols-9 grid-rows-9 overflow-hidden rounded-die border-2 border-ink bg-card @[36rem]:w-[25rem]"
          >
            {DIGITS.map((_, row) => (
              <div role="row" key={row} className="contents">
                {DIGITS.map((_, col) => {
                  const index = row * 9 + col;
                  const value = values[index];
                  const given = puzzle.puzzle[index] !== 0;
                  const isSelected = index === selected;
                  const peer = selected >= 0 && (rowOf(selected) === row || colOf(selected) === col || boxOf(selected) === boxOf(index));
                  const sameDigit = selectedDigit !== 0 && value === selectedDigit;
                  const conflict = conflicts.has(index);
                  const noteDigits = DIGITS.filter((digit) => notes[index] & (1 << digit));
                  const label = [
                    where(index),
                    given ? `given ${value}` : value ? String(value) : 'empty',
                    !value && noteDigits.length ? `notes ${noteDigits.join(' ')}` : '',
                    conflict ? 'conflict' : '',
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <div
                      role="gridcell"
                      key={col}
                      ref={(node) => {
                        cellRefs.current[index] = node;
                      }}
                      tabIndex={isSelected || (selected < 0 && index === 0) ? 0 : -1}
                      aria-label={label}
                      aria-selected={isSelected}
                      aria-readonly={given}
                      onClick={() => move(index)}
                      className={[
                        'relative flex cursor-pointer select-none items-center justify-center tabular-nums transition-colors duration-150',
                        'focus-visible:z-10 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ink',
                        col === 8 ? '' : col % 3 === 2 ? 'border-r-2 border-r-ink' : 'border-r border-r-rule',
                        row === 8 ? '' : row % 3 === 2 ? 'border-b-2 border-b-ink' : 'border-b border-b-rule',
                        isSelected
                          ? 'bg-game text-on-game'
                          : sameDigit
                            ? 'bg-paper-deep'
                            : peer
                              ? 'bg-paper'
                              : 'hover:bg-paper',
                        given ? 'font-black' : isSelected ? 'font-semibold' : 'font-semibold text-game',
                      ].join(' ')}
                    >
                      {value ? (
                        <span
                          className={[
                            'text-[6.4cqi] leading-none',
                            conflict ? 'underline decoration-wavy decoration-2 underline-offset-[0.18em]' : '',
                          ].join(' ')}
                        >
                          {value}
                        </span>
                      ) : (
                        noteDigits.length > 0 && (
                          <span aria-hidden="true" className="grid h-full w-full grid-cols-3 grid-rows-3 p-[0.3cqi] text-[2.6cqi] font-semibold leading-none">
                            {DIGITS.map((digit) => (
                              <span key={digit} className="flex items-center justify-center">
                                {notes[index] & (1 << digit) ? digit : ''}
                              </span>
                            ))}
                          </span>
                        )
                      )}
                      {conflict && (
                        <svg aria-hidden="true" viewBox="0 0 10 10" className="absolute right-[0.6cqi] top-[0.6cqi] size-[2.2cqi]">
                          <path d="M0 0H10L10 10Z" fill="currentColor" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex w-full flex-col gap-2 @[36rem]:w-44">
            <div className="grid grid-cols-5 gap-2 @[36rem]:grid-cols-3">
              {DIGITS.map((digit) => {
                const left = 9 - placedCounts[digit - 1];
                return (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => enter(digit)}
                    disabled={solved}
                    aria-label={notesMode ? `Note ${digit}` : `${digit}, ${left > 0 ? `${left} left` : 'all placed'}`}
                    className={[
                      'flex min-h-12 flex-col items-center justify-center rounded-die border-2 border-ink font-stretch-semi-expanded transition-colors duration-150',
                      'hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-45',
                      left > 0 ? 'bg-card' : 'bg-paper text-ink-muted',
                    ].join(' ')}
                  >
                    <span className={notesMode ? 'text-base font-semibold' : 'text-xl font-bold leading-6'}>{digit}</span>
                    {!notesMode && <span className="text-[0.65rem] font-semibold leading-3 text-ink-muted">{left > 0 ? `${left} left` : 'done'}</span>}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={erase}
                disabled={solved}
                aria-label="Erase square"
                className="flex min-h-12 items-center justify-center gap-2 rounded-die border-2 border-ink bg-card text-sm font-semibold font-stretch-semi-expanded transition-colors duration-150 hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-45 @[36rem]:col-span-3"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                  <path d="M9 5h11v14H9l-6-7z" />
                  <path d="M12 9l5 6M17 9l-5 6" strokeLinecap="round" />
                </svg>
                <span aria-hidden="true" className="hidden @[36rem]:inline">
                  Erase
                </span>
              </button>
            </div>
            <button
              type="button"
              aria-pressed={notesMode}
              onClick={() => setNotesMode(!notesMode)}
              disabled={solved}
              className={[
                'flex min-h-11 items-center justify-center gap-2 rounded-die border-2 border-ink text-sm font-semibold font-stretch-semi-expanded transition-colors duration-150',
                'disabled:cursor-not-allowed disabled:opacity-45',
                notesMode ? 'bg-ink text-paper' : 'bg-card hover:bg-paper-deep',
              ].join(' ')}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M4 20l1-5L16 4l4 4L9 19z" />
                <path d="M13 7l4 4" />
              </svg>
              Notes {notesMode ? 'on' : 'off'}
            </button>
            <p id="sudoku-keys" className="text-xs leading-5 text-ink-muted">
              Keys: arrows move, 1–9 fill, Shift+digit or N for notes, Backspace clears, Ctrl+Z undoes.
            </p>
          </div>
        </div>
      </div>
    </GameFrame>
  );
}

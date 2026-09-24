import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { recordRound } from '../../lib/progress';
import { PUZZLES, buildPuzzle, entryAt, type BuiltPuzzle, type CrosswordEntry, type Direction } from '../../lib/playable/crossword';
import { Button } from './kit/Button';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { usePref, useProgress } from './kit/useProgress';

type Mark = 'wrong' | 'revealed' | null;

const DIRECTION_LABEL: Record<Direction, string> = { across: 'Across', down: 'Down' };
const START_STATUS = 'Type to fill the highlighted squares. Tab jumps to the next clue.';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const firstOpenCell = (entry: CrosswordEntry, letters: string[]) => entry.cells.find((cell) => !letters[cell]) ?? entry.cells[0];
const loadPuzzle = (id: string) => buildPuzzle(PUZZLES.find((puzzle) => puzzle.id === id) ?? PUZZLES[0]);

function Chevron({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={['size-5', flip ? 'rotate-180' : ''].join(' ')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

interface PickerProps {
  value: string;
  solved: Record<string, string>;
  onChange: (id: string) => void;
}

/** Puzzle 1–8 as a radiogroup; solved puzzles carry a corner stamp (solid = clean, outline = with reveals). */
function PuzzlePicker({ value, solved, onChange }: PickerProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(0, PUZZLES.findIndex((puzzle) => puzzle.id === value));

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (selected + step + PUZZLES.length) % PUZZLES.length;
    onChange(PUZZLES[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-sm font-semibold text-ink-soft">Puzzle</span>
      <div role="radiogroup" aria-label="Puzzle" onKeyDown={handleKeyDown} className="inline-flex rounded-die border-2 border-ink p-0.5">
        {PUZZLES.map((puzzle, index) => {
          const checked = index === selected;
          const state = solved[puzzle.id];
          return (
            <button
              key={puzzle.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`Puzzle ${puzzle.id}${state === 'c' ? ', solved' : state === 'a' ? ', solved with reveals' : ''}`}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(puzzle.id)}
              className={[
                'relative size-9 overflow-hidden rounded-[3px] text-sm font-semibold tabular-nums transition-colors duration-150',
                checked ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-deep',
              ].join(' ')}
            >
              {puzzle.id}
              {state && (
                <svg aria-hidden="true" viewBox="0 0 10 10" className="absolute right-0 top-0 size-3">
                  <path d="M1 0.8H9.2V9Z" fill={state === 'c' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function freshState(puzzle: BuiltPuzzle) {
  return {
    letters: puzzle.solution.map(() => ''),
    marks: puzzle.solution.map((): Mark => null),
    cursor: puzzle.entries[0].cells[0],
  };
}

export default function CrosswordGame({ slug }: { slug: string }) {
  const progress = useProgress(slug);
  const [puzzleId, setPuzzleId] = usePref(slug, 'puzzle', '1');
  const [solvedPref, setSolvedPref] = usePref(slug, 'solved', '');
  const puzzle = useMemo(() => loadPuzzle(puzzleId), [puzzleId]);
  const [letters, setLetters] = useState(() => freshState(puzzle).letters);
  const [marks, setMarks] = useState(() => freshState(puzzle).marks);
  const [cursor, setCursor] = useState(() => freshState(puzzle).cursor);
  const [direction, setDirection] = useState<Direction>('across');
  const [assisted, setAssisted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [status, setStatus] = useState(START_STATUS);
  const [result, setResult] = useState<GameResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedAt === null || result) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, result]);

  const solved: Record<string, string> = Object.fromEntries(
    solvedPref
      .split(',')
      .filter(Boolean)
      .map((item) => item.split(':')),
  );
  const other: Direction = direction === 'across' ? 'down' : 'across';
  const activeEntry = entryAt(puzzle, cursor, direction) ?? entryAt(puzzle, cursor, other) ?? puzzle.entries[0];
  const crossEntry = entryAt(puzzle, cursor, activeEntry.direction === 'across' ? 'down' : 'across');
  const elapsed = result ? finalSeconds : startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const best = progress.best[puzzle.id];
  const size = puzzle.size;

  function startOver(id: string) {
    const next = loadPuzzle(id);
    const fresh = freshState(next);
    setLetters(fresh.letters);
    setMarks(fresh.marks);
    setCursor(fresh.cursor);
    setDirection(next.entries[0].direction);
    setAssisted(false);
    setStartedAt(null);
    setResult(null);
    setStatus(START_STATUS);
  }

  function choosePuzzle(id: string) {
    setPuzzleId(id);
    startOver(id);
  }

  function focusBoard() {
    inputRef.current?.focus({ preventScroll: true });
  }

  function goToEntry(entry: CrosswordEntry, snapshot = letters) {
    setCursor(firstOpenCell(entry, snapshot));
    setDirection(entry.direction);
  }

  /** Neighbouring clue in list order, or undefined past either end. */
  function neighbourEntry(step: 1 | -1, wrap: boolean) {
    const index = puzzle.entries.indexOf(activeEntry) + step;
    if (!wrap && (index < 0 || index >= puzzle.entries.length)) return undefined;
    return puzzle.entries[(index + puzzle.entries.length) % puzzle.entries.length];
  }

  /** Stores the grid and finishes the round when it matches the solution. Returns true when solved. */
  function commit(nextLetters: string[], nextMarks: Mark[], usedReveal: boolean) {
    setLetters(nextLetters);
    setMarks(nextMarks);
    const complete = puzzle.solution.every((answer, cell) => answer === null || nextLetters[cell] === answer);
    if (complete) {
      const seconds = Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 1000));
      setFinalSeconds(seconds);
      const { isNewBest } = usedReveal
        ? recordRound(slug, { outcome: 'complete', bucket: puzzle.id })
        : recordRound(slug, { outcome: 'win', score: seconds, scoreOrder: 'lower', bucket: puzzle.id });
      const mark = usedReveal && solved[puzzle.id] !== 'c' ? 'a' : 'c';
      setSolvedPref(Object.entries({ ...solved, [puzzle.id]: mark }).map(([id, value]) => `${id}:${value}`).join(','));
      setResult({
        title: 'Solved',
        detail: usedReveal
          ? `Puzzle ${puzzle.id} in ${formatTime(seconds)}, with reveals. Best times count clean solves only.`
          : `Puzzle ${puzzle.id} in ${formatTime(seconds)}${isNewBest ? ' — a new best.' : '.'}`,
        tone: 'win',
      });
      return true;
    }
    if (puzzle.solution.every((answer, cell) => answer === null || nextLetters[cell])) {
      setStatus('Every square is filled, but something is off. Try Check puzzle.');
    }
    return false;
  }

  function typeLetter(letter: string) {
    if (result) return;
    if (startedAt === null) {
      setStartedAt(Date.now());
      setNow(Date.now());
    }
    const nextLetters = [...letters];
    const nextMarks = [...marks];
    if (marks[cursor] !== 'revealed') {
      nextLetters[cursor] = letter.toUpperCase();
      if (nextMarks[cursor] === 'wrong') nextMarks[cursor] = null;
    }
    if (commit(nextLetters, nextMarks, assisted)) return;
    const position = activeEntry.cells.indexOf(cursor);
    if (position < activeEntry.cells.length - 1) {
      setCursor(activeEntry.cells[position + 1]);
      setDirection(activeEntry.direction);
    } else {
      const next = neighbourEntry(1, true);
      if (next) goToEntry(next, nextLetters);
    }
  }

  function erase() {
    if (result) return;
    const nextLetters = [...letters];
    const nextMarks = [...marks];
    let target = cursor;
    if (!letters[cursor] || marks[cursor] === 'revealed') {
      const position = activeEntry.cells.indexOf(cursor);
      if (position > 0) {
        target = activeEntry.cells[position - 1];
      } else {
        const previous = neighbourEntry(-1, true);
        if (!previous) return;
        target = previous.cells[previous.cells.length - 1];
        setDirection(previous.direction);
      }
      setCursor(target);
    }
    if (marks[target] !== 'revealed') {
      nextLetters[target] = '';
      nextMarks[target] = null;
    }
    setLetters(nextLetters);
    setMarks(nextMarks);
  }

  function select(cell: number, preferred: Direction) {
    setCursor(cell);
    setDirection(entryAt(puzzle, cell, preferred) ? preferred : preferred === 'across' ? 'down' : 'across');
  }

  function move(rowStep: number, colStep: number) {
    const axis: Direction = colStep !== 0 ? 'across' : 'down';
    if (activeEntry.direction !== axis && entryAt(puzzle, cursor, axis)) {
      setDirection(axis);
      return;
    }
    let row = Math.floor(cursor / size) + rowStep;
    let col = (cursor % size) + colStep;
    while (row >= 0 && col >= 0 && row < size && col < size) {
      if (puzzle.solution[row * size + col] !== null) {
        select(row * size + col, axis);
        return;
      }
      row += rowStep;
      col += colStep;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key;
    if (/^[a-zA-Z]$/.test(key)) {
      event.preventDefault();
      typeLetter(key);
    } else if (key === 'Backspace') {
      event.preventDefault();
      erase();
    } else if (key === 'Delete') {
      event.preventDefault();
      if (result || marks[cursor] === 'revealed') return;
      setLetters(letters.map((letter, cell) => (cell === cursor ? '' : letter)));
      setMarks(marks.map((mark, cell) => (cell === cursor ? null : mark)));
    } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      move(key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0, key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0);
    } else if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      if (crossEntry) setDirection(crossEntry.direction);
    } else if (key === 'Tab') {
      // Past the first or last clue, Tab leaves the grid as usual.
      const next = neighbourEntry(event.shiftKey ? -1 : 1, false);
      if (!next) return;
      event.preventDefault();
      goToEntry(next);
    }
  }

  // Phone keyboards often send "Unidentified" keydowns, so letters and deletes also arrive here.
  // The input holds one space so a delete on an otherwise empty field still fires.
  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (value.length === 0) {
      erase();
      return;
    }
    const typed = value.replace(/[^a-zA-Z]/g, '');
    if (typed) typeLetter(typed[typed.length - 1]);
  }

  function handleCellClick(cell: number) {
    if (puzzle.solution[cell] === null) return;
    if (cell === cursor && crossEntry) {
      setDirection(crossEntry.direction);
    } else {
      select(cell, activeEntry.direction);
    }
    focusBoard();
  }

  function check(cells: number[], scope: string) {
    const wrong = cells.filter((cell) => letters[cell] && letters[cell] !== puzzle.solution[cell]);
    const empty = cells.filter((cell) => !letters[cell]).length;
    setMarks(marks.map((mark, cell) => (wrong.includes(cell) ? 'wrong' : mark)));
    if (wrong.length > 0) {
      setStatus(`${wrong.length} wrong ${wrong.length === 1 ? 'letter' : 'letters'} in ${scope}, struck through.`);
    } else if (empty === cells.length) {
      setStatus(`Nothing to check in ${scope} yet.`);
    } else {
      setStatus(`Everything filled in ${scope} is right${empty > 0 ? `; ${empty} empty` : ''}.`);
    }
  }

  function reveal(cells: number[], scope: string) {
    if (result) return;
    const changed = cells.filter((cell) => letters[cell] !== puzzle.solution[cell]);
    if (changed.length === 0) {
      setStatus(`${scope} is already right.`);
      return;
    }
    if (startedAt === null) setStartedAt(Date.now());
    setAssisted(true);
    setStatus(`Revealed ${scope}.`);
    commit(
      letters.map((letter, cell) => (changed.includes(cell) ? (puzzle.solution[cell] ?? '') : letter)),
      marks.map((mark, cell) => (changed.includes(cell) ? 'revealed' : mark)),
      true,
    );
  }

  const entryName = (entry: CrosswordEntry) => `${entry.number} ${DIRECTION_LABEL[entry.direction]}`;
  const position = activeEntry.cells.indexOf(cursor);
  const markWords = (mark: Mark) => (mark === 'wrong' ? ', marked wrong' : mark === 'revealed' ? ', revealed' : '');
  const inputLabel = `${entryName(activeEntry)}: ${activeEntry.clue}. ${activeEntry.cells.length} letters, square ${position + 1}${
    letters[cursor] ? `, ${letters[cursor]}` : ', empty'
  }${markWords(marks[cursor])}.`;

  return (
    <GameFrame
      label="Mini Crossword"
      options={<PuzzlePicker value={puzzle.id} solved={solved} onChange={choosePuzzle} />}
      stats={[
        { label: 'Time', value: formatTime(elapsed) },
        { label: 'Best', value: best === undefined ? '—' : formatTime(best) },
        { label: 'Solved', value: `${Object.keys(solved).length}/${PUZZLES.length}` },
      ]}
      onNewGame={() => startOver(puzzle.id)}
      newGameLabel="Start over"
      actions={
        result && (
          <Button variant="paper" size="sm" onClick={() => choosePuzzle(PUZZLES[(PUZZLES.findIndex((item) => item.id === puzzle.id) + 1) % PUZZLES.length].id)}>
            Next puzzle
          </Button>
        )
      }
      status={status}
      result={result}
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-7">
        <div className="mx-auto w-full max-w-[20rem]">
          {/* Pointer shortcuts; keyboard players use Tab / Shift+Tab inside the grid. */}
          <div className="mb-3 flex min-h-14 items-stretch rounded-die bg-paper-deep">
            <button
              type="button"
              aria-label="Previous clue"
              tabIndex={-1}
              onClick={() => goToEntry(neighbourEntry(-1, true) ?? activeEntry)}
              className="flex w-10 shrink-0 items-center justify-center rounded-die text-ink hover:bg-rule"
            >
              <Chevron />
            </button>
            <p className="flex-1 self-center px-1 py-2 text-sm leading-5">
              <strong className="mr-1.5 font-extrabold font-stretch-semi-expanded">
                {activeEntry.number}
                {activeEntry.direction === 'across' ? 'A' : 'D'}
              </strong>
              {activeEntry.clue}
            </p>
            <button
              type="button"
              aria-label="Next clue"
              tabIndex={-1}
              onClick={() => goToEntry(neighbourEntry(1, true) ?? activeEntry)}
              className="flex w-10 shrink-0 items-center justify-center rounded-die text-ink hover:bg-rule"
            >
              <Chevron flip />
            </button>
          </div>

          <div className="relative rounded-[3px] outline-offset-4 outline-ink has-[input:focus-visible]:outline-3">
            <div role="grid" aria-label={`Puzzle ${puzzle.id} grid`} className="grid grid-cols-5 gap-[2px] border-2 border-ink bg-ink">
              {Array.from({ length: size }, (_, row) => (
                <div role="row" key={row} className="contents">
                  {Array.from({ length: size }, (_, col) => {
                    const cell = row * size + col;
                    const black = puzzle.solution[cell] === null;
                    const active = !result && cell === cursor;
                    const inWord = !result && activeEntry.cells.includes(cell);
                    const number = puzzle.numbers[cell];
                    return (
                      <div
                        role="gridcell"
                        key={cell}
                        aria-selected={active}
                        aria-label={
                          black
                            ? 'Black square'
                            : `Row ${row + 1}, column ${col + 1}${number ? `, number ${number}` : ''}: ${letters[cell] || 'empty'}${markWords(marks[cell])}`
                        }
                        onClick={() => handleCellClick(cell)}
                        className={[
                          'relative flex aspect-square select-none items-center justify-center text-[clamp(1.35rem,7.5vw,1.9rem)] font-bold uppercase leading-none transition-colors duration-150',
                          black
                            ? 'bg-ink'
                            : active
                              ? 'cursor-pointer bg-game text-on-game'
                              : inWord
                                ? 'cursor-pointer bg-[color-mix(in_srgb,var(--game-ink,#1d1c1a)_20%,#fbf9f4)] text-ink'
                                : 'cursor-pointer bg-card text-ink hover:bg-paper-deep',
                        ].join(' ')}
                      >
                        {number && <span className="absolute left-1 top-0.5 text-[0.6875rem] font-semibold leading-none">{number}</span>}
                        {letters[cell]}
                        {marks[cell] === 'wrong' && (
                          <svg aria-hidden="true" viewBox="0 0 10 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-[12%]">
                            <path d="M1 9 9 1" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
                          </svg>
                        )}
                        {marks[cell] === 'revealed' && (
                          <svg aria-hidden="true" viewBox="0 0 10 10" className="absolute bottom-0 right-0 size-[26%]">
                            <path d="M10 0V10H0Z" fill="currentColor" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <input
              ref={inputRef}
              value=" "
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onSelect={(event) => event.currentTarget.setSelectionRange(1, 1)}
              aria-label={inputLabel}
              aria-describedby={`${slug}-keys`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="next"
              disabled={Boolean(result)}
              className="pointer-events-none absolute inset-0 h-full w-full caret-transparent opacity-0 text-base"
            />
            <p id={`${slug}-keys`} className="sr-only">
              Type letters to fill. Arrows move, Space switches between Across and Down, Tab goes to the next clue.
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <div role="group" aria-label="Check" className="flex flex-wrap items-center gap-1.5">
              <span className="w-14 text-sm font-semibold text-ink-soft">Check</span>
              <Button disabled={Boolean(result)} onClick={() => check([cursor], 'this square')} className="px-3 text-sm">
                Letter
              </Button>
              <Button disabled={Boolean(result)} onClick={() => check(activeEntry.cells, entryName(activeEntry))} className="px-3 text-sm">
                Word
              </Button>
              <Button
                disabled={Boolean(result)}
                onClick={() => check(puzzle.solution.flatMap((answer, cell) => (answer === null ? [] : [cell])), 'the puzzle')}
                className="px-3 text-sm"
              >
                Puzzle
              </Button>
            </div>
            <div role="group" aria-label="Reveal" className="flex flex-wrap items-center gap-1.5">
              <span className="w-14 text-sm font-semibold text-ink-soft">Reveal</span>
              <Button disabled={Boolean(result)} onClick={() => reveal([cursor], 'this square')} className="px-3 text-sm">
                Letter
              </Button>
              <Button disabled={Boolean(result)} onClick={() => reveal(activeEntry.cells, entryName(activeEntry))} className="px-3 text-sm">
                Word
              </Button>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {(['across', 'down'] as const).map((dir) => (
            <section key={dir} aria-label={`${DIRECTION_LABEL[dir]} clues`}>
              <h3 className="border-b-2 border-ink pb-1 text-sm font-extrabold uppercase tracking-wide font-stretch-semi-expanded">{DIRECTION_LABEL[dir]}</h3>
              <ol className="mt-1.5 grid gap-0.5">
                {puzzle.entries
                  .filter((entry) => entry.direction === dir)
                  .map((entry) => {
                    const isActive = entry === activeEntry;
                    const isCross = entry === crossEntry;
                    const filled = entry.cells.every((cell) => letters[cell]);
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => {
                            goToEntry(entry);
                            focusBoard();
                          }}
                          className={[
                            'flex min-h-10 w-full gap-2 rounded-[4px] px-2 py-1.5 text-left text-sm leading-5 transition-colors duration-150',
                            isActive ? 'bg-[color-mix(in_srgb,var(--game-ink,#1d1c1a)_20%,#fbf9f4)] text-ink' : isCross ? 'bg-paper-deep text-ink' : filled ? 'text-ink-muted hover:bg-paper-deep' : 'text-ink hover:bg-paper-deep',
                          ].join(' ')}
                        >
                          <span className="w-5 shrink-0 font-extrabold tabular-nums">{entry.number}</span>
                          <span>
                            {entry.clue}
                            {filled && <span className="sr-only"> (filled)</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </GameFrame>
  );
}

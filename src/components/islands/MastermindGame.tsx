import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from './kit/Button';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { recordRound } from '../../lib/progress';
import {
  CODE_LENGTH,
  MAX_GUESSES,
  allCodes,
  consistentCodes,
  randomCode,
  scoreGuess,
  type Code,
  type Feedback,
  type ScoredGuess,
} from '../../lib/playable/mastermind';

/** Six peg colours from the ink palette, each with its own printed mark so colour is never the only cue. */
const PEGS = [
  { name: 'Red', mark: 'dot', fill: 'var(--color-vermilion)', on: '#ffffff' },
  { name: 'Yellow', mark: 'triangle', fill: 'var(--color-mustard)', on: 'var(--color-ink)' },
  { name: 'Green', mark: 'square', fill: 'var(--color-green)', on: '#ffffff' },
  { name: 'Blue', mark: 'diamond', fill: 'var(--color-sky)', on: 'var(--color-ink)' },
  { name: 'Purple', mark: 'cross', fill: 'var(--color-violet)', on: '#ffffff' },
  { name: 'Pink', mark: 'bar', fill: 'var(--color-pink)', on: '#ffffff' },
] as const;

type Draft = (number | null)[];

interface Round {
  secret: Code;
  history: ScoredGuess[];
  draft: Draft;
  active: number;
  repeats: boolean;
  result: GameResult | null;
}

const emptyDraft = (): Draft => Array.from({ length: CODE_LENGTH }, () => null);

const newRound = (repeats: boolean): Round => ({
  secret: randomCode(repeats),
  history: [],
  draft: emptyDraft(),
  active: 0,
  repeats,
  result: null,
});

const describeCode = (code: Code) => code.map((colour) => PEGS[colour].name).join(', ');

const describeFeedback = ({ exact, misplaced }: Feedback) => `${exact} exact, ${misplaced} misplaced`;

function Mark({ colour }: { colour: number }) {
  const peg = PEGS[colour];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[46%] w-[46%]" fill={peg.on}>
      {peg.mark === 'dot' && <circle cx="12" cy="12" r="7" />}
      {peg.mark === 'triangle' && <path d="M12 3.5 21 19.5H3Z" />}
      {peg.mark === 'square' && <rect x="5" y="5" width="14" height="14" />}
      {peg.mark === 'diamond' && <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />}
      {peg.mark === 'cross' && <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" />}
      {peg.mark === 'bar' && <rect x="2.5" y="8.5" width="19" height="7" />}
    </svg>
  );
}

/** A code peg: solid colour disc with its mark. `null` draws an empty hole. */
function Peg({ colour, className = '' }: { colour: number | null; className?: string }) {
  if (colour === null) {
    return <span aria-hidden="true" className={`block rounded-full border-2 border-dashed border-ink-muted/60 ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full border-2 border-ink ${className}`}
      style={{ background: PEGS[colour].fill }}
    >
      <Mark colour={colour} />
    </span>
  );
}

/** Key pegs in a 2×2 block: solid (black) = exact, white = misplaced, faint ring = nothing. Drawn in the row's text colour. */
function KeyPegs({ feedback }: { feedback: Feedback | null }) {
  const keys = feedback
    ? [...Array<string>(feedback.exact).fill('exact'), ...Array<string>(feedback.misplaced).fill('misplaced')]
    : [];
  return (
    <span aria-hidden="true" className="grid shrink-0 grid-cols-2 gap-1">
      {Array.from({ length: CODE_LENGTH }, (_, index) => (
        <span
          key={index}
          className={[
            'block size-2.5 rounded-full',
            keys[index] === 'exact'
              ? 'bg-current'
              : keys[index] === 'misplaced'
                ? 'border-2 border-current bg-card'
                : 'border border-current opacity-30',
          ].join(' ')}
        />
      ))}
    </span>
  );
}

export default function MastermindGame({ slug }: { slug: string }) {
  const [repeatsPref, setRepeatsPref] = usePref(slug, 'repeats', true);
  const [showCount, setShowCount] = usePref(slug, 'showCount', false);
  const [round, setRound] = useState(() => newRound(repeatsPref));
  const [status, setStatus] = useState('Pick four pegs for guess 1, then submit. Keys 1 to 6 place a peg, Enter submits.');
  const progress = useProgress(slug);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);

  const { secret, history, draft, active, repeats, result } = round;
  const bucket = repeats ? 'repeats' : 'no-repeats';
  const best = progress.best[bucket];
  const over = result !== null;
  const draftFull = draft.every((colour) => colour !== null);
  const space = useMemo(() => allCodes(repeats), [repeats]);
  const possible = useMemo(() => consistentCodes(space, history).length, [space, history]);

  // Submitting from a slot unmounts it: carry keyboard focus to the next row, or the board when the round ends.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    (result ? boardRef.current : slotRefs.current[0])?.focus();
  }, [history.length, result]);

  function startNew(nextRepeats = repeats) {
    setRound(newRound(nextRepeats));
    setStatus(`New code set${nextRepeats ? ', repeats allowed' : ', no repeated colours'}. Pick four pegs for guess 1.`);
  }

  function place(colour: number) {
    if (over) return;
    const next = draft.slice();
    next[active] = colour;
    const nextEmpty = [1, 2, 3].map((step) => (active + step) % CODE_LENGTH).find((index) => next[index] === null);
    setRound({ ...round, draft: next, active: nextEmpty ?? active });
    setStatus(`Slot ${active + 1}: ${PEGS[colour].name}.${next.every((value) => value !== null) ? ' Guess ready, press Enter or Submit.' : ''}`);
  }

  function clearSlot(index: number) {
    const next = draft.slice();
    next[index] = null;
    setRound({ ...round, draft: next, active: index });
    setStatus(`Slot ${index + 1} cleared.`);
  }

  function selectSlot(index: number) {
    if (over) return;
    if (draft[index] !== null) {
      clearSlot(index);
      return;
    }
    setRound({ ...round, active: index });
    setStatus(`Slot ${index + 1} selected. Choose a colour.`);
  }

  function backspace() {
    if (over) return;
    const index = draft[active] !== null ? active : Math.max(0, active - 1);
    clearSlot(index);
    slotRefs.current[index]?.focus({ preventScroll: true });
  }

  function submit() {
    if (over) return;
    if (!draftFull) {
      const missing = draft.filter((colour) => colour === null).length;
      setStatus(`Fill every slot first: ${missing} still empty.`);
      return;
    }
    const guess = draft as Code;
    const feedback = scoreGuess(secret, guess);
    const nextHistory = [...history, { guess, feedback }];
    const used = nextHistory.length;
    let nextResult: GameResult | null = null;
    if (feedback.exact === CODE_LENGTH) {
      const { isNewBest, previousBest } = recordRound(slug, { outcome: 'win', score: used, scoreOrder: 'lower', bucket });
      const label = repeats ? 'with repeats' : 'without repeats';
      nextResult = {
        title: 'Cracked it',
        detail: `${describeCode(secret)} in ${used} ${used === 1 ? 'guess' : 'guesses'}${
          isNewBest && previousBest !== undefined ? ` — a new best ${label}.` : isNewBest ? ` — your first solve ${label}.` : '.'
        }`,
        tone: 'win',
      };
    } else if (used === MAX_GUESSES) {
      recordRound(slug, { outcome: 'loss', bucket });
      nextResult = { title: 'Out of guesses', detail: `The code was ${describeCode(secret)}.`, tone: 'loss' };
    }
    const left = MAX_GUESSES - used;
    const remaining = consistentCodes(space, nextHistory).length;
    setStatus(
      `Guess ${used}: ${describeCode(guess)}. ${describeFeedback(feedback)}.` +
        (nextResult ? '' : ` ${left} ${left === 1 ? 'guess' : 'guesses'} left.`) +
        (showCount && !nextResult ? ` ${remaining} possible ${remaining === 1 ? 'code' : 'codes'} remain.` : ''),
    );
    refocus.current = Boolean(boardRef.current?.contains(document.activeElement));
    setRound({ ...round, history: nextHistory, draft: emptyDraft(), active: 0, result: nextResult });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || over) return;
    const onSlot = slotRefs.current.some((slot) => slot === event.target);
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= PEGS.length) {
      event.preventDefault();
      place(digit - 1);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      backspace();
    } else if (event.key === 'Enter' && onSlot) {
      event.preventDefault();
      submit();
    } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && onSlot) {
      event.preventDefault();
      const index = (active + (event.key === 'ArrowRight' ? 1 : CODE_LENGTH - 1)) % CODE_LENGTH;
      setRound({ ...round, active: index });
      slotRefs.current[index]?.focus();
    }
  }

  const currentRow = over ? -1 : history.length;

  return (
    <GameFrame
      label="Mastermind board"
      options={
        <Segmented
          label="Repeated colours"
          options={[
            { value: 'yes', label: 'Allowed' },
            { value: 'no', label: 'None' },
          ]}
          value={repeats ? 'yes' : 'no'}
          disabled={history.length > 0 && !over}
          onChange={(value) => {
            setRepeatsPref(value === 'yes');
            startNew(value === 'yes');
          }}
        />
      }
      stats={[
        { label: 'Guess', value: `${Math.min(history.length + (over ? 0 : 1), MAX_GUESSES)}/${MAX_GUESSES}` },
        { label: 'Best', value: best === undefined ? '—' : best },
      ]}
      onNewGame={() => startNew()}
      status={status}
      result={result}
    >
      <div ref={boardRef} tabIndex={-1} className="@container" onKeyDown={handleKeyDown}>
        <div className="grid gap-5 @lg:grid-cols-[auto_minmax(0,1fr)] @lg:items-start @lg:gap-8">
          <div>
            <div className="mb-3 flex items-center gap-3 rounded-die bg-ink px-3 py-2 text-paper">
              <span className="text-xs font-semibold uppercase tracking-wide">Code</span>
              <span className="flex gap-1.5" role="img" aria-label={over ? `Secret code: ${describeCode(secret)}` : 'Secret code, hidden'}>
                {secret.map((colour, index) =>
                  over ? (
                    <Peg key={index} colour={colour} className="size-8 border-paper" />
                  ) : (
                    <span key={index} aria-hidden="true" className="flex size-8 items-center justify-center rounded-full border-2 border-paper/60">
                      <span className="block size-2 rounded-full bg-paper/60" />
                    </span>
                  ),
                )}
              </span>
            </div>

            <ol aria-label="Guesses" className="grid gap-1">
              {Array.from({ length: MAX_GUESSES }, (_, row) => {
                const entry = history[row];
                const isCurrent = row === currentRow;
                const label = entry
                  ? `Guess ${row + 1}: ${describeCode(entry.guess)}. ${describeFeedback(entry.feedback)}.`
                  : isCurrent
                    ? `Guess ${row + 1}, in progress`
                    : `Guess ${row + 1}, not played`;
                return (
                  <li
                    key={row}
                    aria-label={isCurrent ? undefined : label}
                    className={[
                      'flex min-h-11 items-center gap-2 rounded-die border-2 px-2 py-1 @sm:gap-3',
                      isCurrent ? 'border-ink bg-paper' : 'border-transparent',
                      entry && entry.feedback.exact === CODE_LENGTH ? 'bg-game text-on-game' : '',
                    ].join(' ')}
                  >
                    <span aria-hidden="true" className="hidden w-5 text-right text-xs font-semibold tabular-nums opacity-70 @sm:block">
                      {row + 1}
                    </span>
                    {isCurrent ? (
                      <span role="group" aria-label={`Guess ${row + 1}, slots`} className="flex gap-1.5">
                        {draft.map((colour, index) => (
                          <button
                            key={index}
                            ref={(node) => {
                              slotRefs.current[index] = node;
                            }}
                            type="button"
                            tabIndex={index === active ? 0 : -1}
                            aria-label={`Slot ${index + 1}: ${colour === null ? 'empty' : PEGS[colour].name}${index === active ? ', selected' : ''}`}
                            onClick={() => selectSlot(index)}
                            className={[
                              'flex size-10 items-center justify-center rounded-full outline-offset-2 transition-transform duration-150 ease-out',
                              index === active ? 'ring-2 ring-game ring-offset-2 ring-offset-paper' : '',
                            ].join(' ')}
                          >
                            <Peg colour={colour} className="size-10" />
                          </button>
                        ))}
                      </span>
                    ) : (
                      <span aria-hidden="true" className="flex gap-1.5">
                        {(entry?.guess ?? emptyDraft()).map((colour, index) => (
                          <span key={index} className="flex size-10 items-center justify-center">
                            <Peg colour={colour} className={`size-8 ${entry ? '' : 'opacity-40'}`} />
                          </span>
                        ))}
                      </span>
                    )}
                    {entry && (
                      <>
                        <KeyPegs feedback={entry.feedback} />
                        <span aria-hidden="true" className="text-xs leading-tight font-stretch-semi-condensed">
                          <span className="block">
                            <b className="font-bold tabular-nums">{entry.feedback.exact}</b> exact
                          </span>
                          <span className="block">
                            <b className="font-bold tabular-nums">{entry.feedback.misplaced}</b> misplaced
                          </span>
                        </span>
                      </>
                    )}
                    {!entry && !isCurrent && <KeyPegs feedback={null} />}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid gap-4 @lg:sticky @lg:top-4">
            <div role="group" aria-label="Peg colours" className="grid grid-cols-6 gap-1.5 @lg:grid-cols-3 @lg:gap-2">
              {PEGS.map((peg, colour) => (
                <button
                  key={peg.name}
                  type="button"
                  disabled={over}
                  aria-label={`${peg.name} (key ${colour + 1})`}
                  onClick={() => place(colour)}
                  className="group flex flex-col items-center gap-1 rounded-die border-2 border-transparent py-1 transition-colors duration-150 hover:border-ink disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Peg colour={colour} className="size-10 transition-transform duration-150 ease-out group-active:scale-90" />
                  <span aria-hidden="true" className="text-xs font-bold tabular-nums">
                    {colour + 1}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={submit}
                disabled={over || !draftFull}
                className="flex-1 enabled:border-ink enabled:bg-game enabled:text-on-game enabled:hover:bg-ink enabled:hover:text-paper"
              >
                Submit guess
              </Button>
              <Button variant="secondary" onClick={backspace} disabled={over || draft.every((colour) => colour === null)} aria-label="Clear a peg">
                Clear
              </Button>
            </div>

            <div className="border-t-2 border-ink pt-3 text-sm">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={showCount}
                  onChange={(event) => setShowCount(event.target.checked)}
                  className="size-5 accent-ink"
                />
                Count codes still possible
              </label>
              {showCount && (
                <p className="mt-2 leading-snug text-ink-soft">
                  <b className="block text-2xl font-extrabold tabular-nums text-ink font-stretch-expanded">{possible}</b>
                  {possible === 1
                    ? over
                      ? 'code fitted every clue.'
                      : 'code fits every clue so far. You know the answer.'
                    : `of ${space.length} codes fit every clue so far.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameFrame>
  );
}

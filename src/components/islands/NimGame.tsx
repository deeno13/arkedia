import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { recordRound } from '../../lib/progress';
import {
  CLASSIC_HEAPS,
  HEAP_NAMES,
  applyMove,
  computerMove,
  isMisereEndgame,
  isOver,
  moverWins,
  nimSum,
  randomHeaps,
  type NimMove,
  type NimRule,
} from '../../lib/playable/nim';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Button } from './kit/Button';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';

type Preset = 'classic' | 'random';
type Opponent = 'easy' | 'hard' | 'two';
type First = 'you' | 'computer';
type Seat = 0 | 1;

interface PlayedMove extends NimMove {
  seat: Seat;
}

interface NimState {
  start: number[];
  heaps: number[];
  turn: Seat;
  last: PlayedMove | null;
  result: GameResult | null;
}

const BITS = [4, 2, 1];

function freshGame(preset: Preset, opponent: Opponent, first: First): NimState {
  const heaps = preset === 'classic' ? [...CLASSIC_HEAPS] : randomHeaps();
  return { start: heaps, heaps, turn: opponent !== 'two' && first === 'computer' ? 1 : 0, last: null, result: null };
}

/** One matchstick: card body, ink head. Marked sticks (about to be taken) fill with the mover's ink and lift. */
function Stick({ state }: { state: 'idle' | 'mine' | 'theirs' | 'gone' | 'just-gone' }) {
  if (state === 'gone' || state === 'just-gone') {
    return (
      <svg viewBox="0 0 24 64" className="h-16 w-6" aria-hidden="true">
        <g
          fill="none"
          strokeWidth="2"
          strokeDasharray="4 3"
          className={state === 'just-gone' ? 'stroke-ink' : 'stroke-rule'}
        >
          <rect x="9" y="17" width="6" height="44" rx="1.5" />
          <ellipse cx="12" cy="11" rx="6" ry="8" />
        </g>
      </svg>
    );
  }
  const lifted = state !== 'idle';
  const fill = state === 'mine' ? 'fill-game' : state === 'theirs' ? 'fill-ink' : '';
  return (
    <svg
      viewBox="0 0 24 64"
      className={['h-16 w-6 transition-transform duration-150 ease-out', lifted ? '-translate-y-1.5' : ''].join(' ')}
      aria-hidden="true"
    >
      <rect x="9" y="17" width="6" height="44" rx="1.5" strokeWidth="2" className={['stroke-ink', fill || 'fill-card'].join(' ')} />
      <ellipse cx="12" cy="11" rx="6" ry="8" strokeWidth="2" className={['stroke-ink', fill || 'fill-ink'].join(' ')} />
    </svg>
  );
}

export default function NimGame({ slug }: { slug: string }) {
  const progress = useProgress(slug);
  const [preset, setPreset] = usePref<Preset>(slug, 'heaps', 'classic');
  const [rule, setRule] = usePref<NimRule>(slug, 'rule', 'normal');
  const [opponent, setOpponent] = usePref<Opponent>(slug, 'opponent', 'hard');
  const [first, setFirst] = usePref<First>(slug, 'first', 'you');
  const [showBinary, setShowBinary] = usePref(slug, 'binary', false);
  const [game, setGame] = useState(() => freshGame(preset, opponent, first));
  const [selected, setSelected] = useState<NimMove | null>(null);
  const [hovered, setHovered] = useState<NimMove | null>(null);
  const [computerPreview, setComputerPreview] = useState<NimMove | null>(null);
  const stickRefs = useRef(new Map<string, HTMLButtonElement>());
  const boardRef = useRef<HTMLDivElement>(null);
  const keepFocus = useRef(false);

  const vsComputer = opponent !== 'two';
  const seatName = (seat: Seat) => (vsComputer ? (seat === 0 ? 'You' : 'Computer') : `Player ${seat + 1}`);
  const heapName = (index: number) => `heap ${HEAP_NAMES[index]}`;
  const playerCanMove = !game.result && !(vsComputer && game.turn === 1);
  const remaining = game.heaps.reduce((sum, heap) => sum + heap, 0);

  function restart(next: { preset?: Preset; opponent?: Opponent; first?: First } = {}) {
    setGame(freshGame(next.preset ?? preset, next.opponent ?? opponent, next.first ?? first));
    setSelected(null);
    setHovered(null);
    setComputerPreview(null);
  }

  function play(move: NimMove, state: NimState = game) {
    const heaps = applyMove(state.heaps, move);
    const mover = state.turn;
    const other: Seat = mover === 0 ? 1 : 0;
    let result: GameResult | null = null;

    if (isOver(heaps)) {
      const winner = rule === 'normal' ? mover : other;
      const how = rule === 'normal' ? `${seatName(winner)} took the last object.` : `${seatName(mover)} had to take the last object.`;
      if (vsComputer) {
        const { record } = recordRound(slug, { outcome: winner === 0 ? 'win' : 'loss', bucket: `${rule}-${opponent}` });
        result =
          winner === 0
            ? { title: 'You win', detail: `${how} ${record.streak > 1 ? `${record.streak} wins in a row.` : ''}`.trim(), tone: 'win' }
            : { title: 'Computer wins', detail: how, tone: 'loss' };
      } else {
        result = { title: `${seatName(winner)} wins`, detail: how, tone: 'win' };
      }
    }

    setGame({ ...state, heaps, turn: other, last: { ...move, seat: mover }, result });
    setSelected(null);
    setHovered(null);
    setComputerPreview(null);
  }

  // Computer turn: show which objects it reaches for, then take them.
  useEffect(() => {
    if (!vsComputer || game.turn !== 1 || game.result) return;
    const move = computerMove(game.heaps, rule, opponent === 'hard' ? 'hard' : 'easy');
    const reach = window.setTimeout(() => setComputerPreview(move), 450);
    const take = window.setTimeout(() => play(move, game), 1000);
    return () => {
      window.clearTimeout(reach);
      window.clearTimeout(take);
    };
    // play() reads only values captured with this game state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, vsComputer, rule, opponent]);

  // Roving focus target: the selection if it is still legal, else "take 1" from the first non-empty heap.
  const firstHeap = game.heaps.findIndex((heap) => heap > 0);
  const focusTarget: NimMove | null =
    selected && selected.take <= game.heaps[selected.heap] ? selected : firstHeap >= 0 ? { heap: firstHeap, take: 1 } : null;
  const keyOf = (move: NimMove) => `${move.heap}-${game.heaps[move.heap] - move.take}`;

  // A move can remove the focused stick; put focus back on the board instead of dropping it to <body>.
  useLayoutEffect(() => {
    if (!keepFocus.current || boardRef.current?.contains(document.activeElement)) return;
    const target = focusTarget ? stickRefs.current.get(keyOf(focusTarget)) : null;
    (target ?? boardRef.current)?.focus({ preventScroll: true });
  });

  function focusMove(move: NimMove) {
    setSelected(move);
    stickRefs.current.get(keyOf(move))?.focus();
  }

  function handleStickKey(event: KeyboardEvent<HTMLButtonElement>, move: NimMove) {
    const { heaps } = game;
    let next: NimMove | null = null;
    if (event.key === 'ArrowLeft') next = { heap: move.heap, take: Math.min(heaps[move.heap], move.take + 1) };
    else if (event.key === 'ArrowRight') next = { heap: move.heap, take: Math.max(1, move.take - 1) };
    else if (event.key === 'Home') next = { heap: move.heap, take: heaps[move.heap] };
    else if (event.key === 'End') next = { heap: move.heap, take: 1 };
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const step = event.key === 'ArrowDown' ? 1 : -1;
      for (let i = 1; i < heaps.length; i++) {
        const heap = (move.heap + step * i + heaps.length) % heaps.length;
        if (heaps[heap] > 0) {
          next = { heap, take: Math.min(move.take, heaps[heap]) };
          break;
        }
      }
      next ??= move;
    }
    if (!next) return;
    event.preventDefault();
    focusMove(next);
  }

  function handleStickClick(event: MouseEvent<HTMLButtonElement>, move: NimMove) {
    if (!playerCanMove) return;
    // Keyboard activation (Enter/Space) takes straight away; a pointer selects first, then confirms.
    const confirmed = event.detail === 0 || (selected?.heap === move.heap && selected.take === move.take);
    if (confirmed) play(move);
    else setSelected(move);
  }

  const preview = computerPreview ?? hovered ?? selected;
  const previewSeat: Seat = computerPreview ? 1 : game.turn;

  // Binary panel numbers.
  const sum = nimSum(game.heaps);
  const moverName = seatName(game.turn);
  const moverIsYou = vsComputer && game.turn === 0;
  const canWin = moverWins(game.heaps, rule);
  const ones = game.heaps.filter((heap) => heap === 1).length;
  const bigHeaps = game.heaps.flatMap((heap, index) => (heap >= 2 ? [index] : []));
  const subject = moverIsYou ? 'you' : moverName;
  let verdict: string;
  if (rule === 'misere' && isMisereEndgame(game.heaps)) {
    verdict = `Misère endgame: every heap holds 0 or 1, so the nim-sum no longer decides. There ${ones === 1 ? 'is 1 single object' : `are ${ones} single objects`}, ${ones % 2 === 0 ? 'an even number, so' : 'an odd number, so'} ${subject} ${canWin ? 'can win' : 'will be left with the last one'}.`;
  } else if (rule === 'misere' && bigHeaps.length === 1) {
    verdict = `Misère switch point: only ${heapName(bigHeaps[0])} holds more than one. ${moverIsYou ? 'You win' : `${moverName} wins`} by cutting it to 0 or 1 so an odd number of single objects is left.`;
  } else if (sum !== 0) {
    verdict = `Nim-sum ${sum} is not zero, so ${subject} can win: find the move that makes every column even.${rule === 'misere' ? ' (Misère plays like normal Nim until only one heap is bigger than 1.)' : ''}`;
  } else {
    verdict = `Nim-sum is zero: every column is even, so ${subject} ${moverIsYou ? 'are' : 'is'} in a losing position. Any move makes a column odd, and a careful opponent evens it again.`;
  }

  const lastLine = game.last
    ? `${seatName(game.last.seat)} took ${game.last.take} from ${heapName(game.last.heap)}. `
    : '';
  const status = !playerCanMove
    ? `${lastLine}Computer is thinking…`
    : `${lastLine}${vsComputer ? 'Your move' : `${seatName(game.turn)} to move`}: choose a heap and how many to take.`;

  const stats = vsComputer
    ? [
        { label: 'Left', value: remaining },
        { label: 'Wins', value: progress.wins },
        { label: 'Best streak', value: progress.bestStreak },
      ]
    : [{ label: 'Left', value: remaining }];

  return (
    <GameFrame
      label="Nim board"
      options={
        <>
          <Segmented
            label="Heaps"
            options={[
              { value: 'classic', label: '3-4-5' },
              { value: 'random', label: 'Random' },
            ]}
            value={preset}
            onChange={(value) => {
              setPreset(value);
              restart({ preset: value });
            }}
          />
          <Segmented
            label="Rule"
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'misere', label: 'Misère' },
            ]}
            value={rule}
            onChange={(value) => {
              setRule(value);
              restart();
            }}
          />
          <Segmented
            label="Opponent"
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'hard', label: 'Hard' },
              { value: 'two', label: '2 players' },
            ]}
            value={opponent}
            onChange={(value) => {
              setOpponent(value);
              restart({ opponent: value });
            }}
          />
          {vsComputer && (
            <Segmented
              label="First"
              options={[
                { value: 'you', label: 'You' },
                { value: 'computer', label: 'Computer' },
              ]}
              value={first}
              onChange={(value) => {
                setFirst(value);
                restart({ first: value });
              }}
            />
          )}
          <Button size="sm" variant={showBinary ? 'primary' : 'secondary'} aria-pressed={showBinary} onClick={() => setShowBinary(!showBinary)}>
            Show the binary
          </Button>
        </>
      }
      stats={stats}
      onNewGame={() => restart()}
      status={status}
      result={game.result}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold" aria-hidden="true">
          {([0, 1] as Seat[]).map((seat) => {
            const active = !game.result && game.turn === seat;
            return (
              <span
                key={seat}
                className={[
                  'rounded-die border-2 border-ink px-2.5 py-1 font-stretch-semi-expanded',
                  active ? (seat === 0 ? 'bg-game text-on-game' : 'bg-ink text-paper') : 'text-ink-soft',
                ].join(' ')}
              >
                {seatName(seat)}
                {active ? ' to move' : ''}
              </span>
            );
          })}
          <span className="ml-auto text-ink-muted">{rule === 'normal' ? 'Last object wins' : 'Last object loses'}</span>
        </div>

        <div
          ref={boardRef}
          tabIndex={-1}
          role="group"
          aria-label={`Heaps. ${rule === 'normal' ? 'Take the last object to win.' : 'Whoever takes the last object loses.'}`}
          onFocus={() => {
            keepFocus.current = true;
          }}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (next ? !boardRef.current?.contains(next) : event.target.isConnected) keepFocus.current = false;
          }}
          className="flex flex-col divide-y-2 divide-rule rounded-die border-2 border-ink bg-paper outline-offset-4"
        >
          {game.start.map((size, heap) => {
            const count = game.heaps[heap];
            return (
              <div
                key={heap}
                role="group"
                aria-label={`Heap ${HEAP_NAMES[heap]}, ${count} ${count === 1 ? 'object' : 'objects'}`}
                className="flex items-center gap-0.5 px-1 sm:gap-2 sm:px-3"
                onPointerLeave={() => setHovered(null)}
              >
                <div className="w-7 shrink-0 text-center sm:w-12" aria-hidden="true">
                  <div className="font-display text-xl font-black leading-none font-stretch-expanded">{HEAP_NAMES[heap]}</div>
                  <div className="mt-1 text-xs font-semibold tabular-nums text-ink-soft">{count}</div>
                </div>
                <div className="flex min-w-0 flex-1 items-end">
                  {Array.from({ length: size }, (_, index) => {
                    if (index >= count) {
                      const justGone = game.last?.heap === heap && index < count + game.last.take;
                      return (
                        <div key={index} className="grid h-20 max-w-14 flex-1 place-items-center" aria-hidden="true">
                          <Stick state={justGone ? 'just-gone' : 'gone'} />
                        </div>
                      );
                    }
                    const move = { heap, take: count - index };
                    const marked = preview?.heap === heap && index >= count - preview.take;
                    const isSelected = selected?.heap === heap && selected.take === move.take;
                    const isTarget = focusTarget?.heap === heap && focusTarget.take === move.take;
                    return (
                      <button
                        key={index}
                        ref={(node) => {
                          if (node) stickRefs.current.set(`${heap}-${index}`, node);
                          else stickRefs.current.delete(`${heap}-${index}`);
                        }}
                        type="button"
                        tabIndex={isTarget ? 0 : -1}
                        aria-disabled={!playerCanMove}
                        aria-pressed={isSelected}
                        aria-label={`Take ${move.take} from ${heapName(heap)}, leaving ${index}`}
                        onClick={(event) => handleStickClick(event, move)}
                        onKeyDown={(event) => handleStickKey(event, move)}
                        onFocus={(event) => {
                          if (event.currentTarget.matches(':focus-visible')) setSelected(move);
                        }}
                        onPointerEnter={(event) => {
                          if (event.pointerType === 'mouse' && playerCanMove) setHovered(move);
                        }}
                        className={[
                          'grid h-20 min-w-0 max-w-14 flex-1 place-items-center rounded-die outline-offset-0',
                          playerCanMove ? 'cursor-pointer' : 'cursor-default',
                        ].join(' ')}
                      >
                        <Stick state={marked ? (previewSeat === 0 ? 'mine' : 'theirs') : 'idle'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            {selected && playerCanMove
              ? `Take ${selected.take} from ${heapName(selected.heap)}, leaving ${game.heaps[selected.heap] - selected.take}.`
              : game.result
                ? 'Round over.'
                : playerCanMove
                  ? 'Tap an object: it and everything to its right will be taken.'
                  : ''}
          </p>
          <Button variant="primary" disabled={!selected || !playerCanMove} onClick={() => selected && play(selected)}>
            {selected && playerCanMove ? `Take ${selected.take}` : 'Take'}
          </Button>
        </div>

        {showBinary && (
          <div className="border-t-2 border-ink pt-3">
            <table className="w-full border-collapse text-sm tabular-nums">
              <caption className="pb-2 text-left font-semibold">Heaps in binary</caption>
              <thead>
                <tr className="border-b-2 border-ink text-ink-soft">
                  <th scope="col" className="py-1 pr-2 text-left font-semibold">Heap</th>
                  <th scope="col" className="px-2 py-1 text-right font-semibold">Size</th>
                  {BITS.map((bit) => (
                    <th key={bit} scope="col" className="w-10 px-1 py-1 text-center font-semibold">
                      {bit}s
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {game.heaps.map((heap, index) => (
                  <tr key={index} className="border-b border-rule">
                    <th scope="row" className="py-1 pr-2 text-left font-semibold">
                      {HEAP_NAMES[index]}
                    </th>
                    <td className="px-2 py-1 text-right">{heap}</td>
                    {BITS.map((bit) => (
                      <td key={bit} className="px-1 py-1 text-center font-mono">
                        {heap & bit ? 1 : 0}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b-2 border-ink">
                  <th scope="row" colSpan={2} className="py-1 pr-2 text-left font-semibold">
                    Column
                  </th>
                  {BITS.map((bit) => {
                    const odd = game.heaps.filter((heap) => heap & bit).length % 2 === 1;
                    return (
                      <td key={bit} className="px-1 py-1 text-center">
                        <span className={['inline-block rounded-[3px] px-1 text-xs font-bold', odd ? 'bg-ink text-paper' : 'text-ink-soft'].join(' ')}>
                          {odd ? 'odd' : 'even'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row" className="py-1 pr-2 text-left font-bold">
                    Nim-sum
                  </th>
                  <td className="px-2 py-1 text-right font-bold">{sum}</td>
                  {BITS.map((bit) => (
                    <td key={bit} className="px-1 py-1 text-center font-mono font-bold">
                      {sum & bit ? 1 : 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            {!game.result && <p className="mt-3 text-sm leading-6">{verdict}</p>}
          </div>
        )}
      </div>
    </GameFrame>
  );
}

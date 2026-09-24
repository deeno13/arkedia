import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';
import { recordRound } from '../../lib/progress';
import {
  MEMORY_SIZES,
  createDeck,
  flipCard,
  hasPendingMismatch,
  hideMismatch,
  isCleared,
  type MemorySize,
  type MemoryState,
  type MemorySymbol,
} from '../../lib/playable/memory';

/** How long a mismatched pair stays face up unless the player clicks on. */
const MISMATCH_MS = 800;

const SIZE_OPTIONS = (Object.keys(MEMORY_SIZES) as MemorySize[]).map((value) => ({ value, label: MEMORY_SIZES[value].label }));

const GLYPHS: Record<MemorySymbol, ReactNode> = {
  circle: <circle cx="20" cy="20" r="13" />,
  triangle: <path d="M20 5 35 32H5Z" />,
  square: <rect x="8" y="8" width="24" height="24" />,
  diamond: <path d="M20 3 36 20 20 37 4 20Z" />,
  star: <path d="M20 5.5 23.8 16.2 35.2 16.6 26.2 23.5 29.4 34.4 20 28 10.6 34.4 13.8 23.5 4.8 16.6 16.2 16.2Z" />,
  cross: <path d="M15 5h10v10h10v10H25v10H15V25H5V15h10Z" />,
  ring: <circle cx="20" cy="20" r="11.5" fill="none" stroke="currentColor" strokeWidth="6" />,
  hexagon: <path d="M20 4 34 12v16l-14 8-14-8V12Z" />,
  arrow: <path d="M20 4 35 19h-9v16H14V19H5Z" />,
  crescent: <path d="M24 4a16 16 0 1 0 0 32 13 13 0 0 1 0-32Z" />,
  heart: <path d="M20 35C7 26 3.5 18.5 7 12c3.5-6 10.5-6 13 0 2.5-6 9.5-6 13 0 3.5 6.5 0 14-13 23Z" />,
  bolt: <path d="M24 3 8 23h10l-3 14 17-21H22Z" />,
  hourglass: <path d="M7 5h26L22 20l11 15H7l11-15Z" />,
  drop: <path d="M20 3c7 10 11.5 16 11.5 22a11.5 11.5 0 0 1-23 0C8.5 19 13 13 20 3Z" />,
  semicircle: <path d="M5 27a15 15 0 0 1 30 0Z" />,
  bars: <path d="M5 7h30v6H5Zm0 10h30v6H5Zm0 10h30v6H5Z" />,
  'four dots': (
    <>
      <circle cx="11.5" cy="11.5" r="6" />
      <circle cx="28.5" cy="11.5" r="6" />
      <circle cx="11.5" cy="28.5" r="6" />
      <circle cx="28.5" cy="28.5" r="6" />
    </>
  ),
  zigzag: <path d="M4 28 12 12l8 16 8-16 8 16" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />,
};

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function MemoryGame({ slug }: { slug: string }) {
  const [size, setSize] = usePref<MemorySize>(slug, 'size', '4x4');
  const config = MEMORY_SIZES[size] ?? MEMORY_SIZES['4x4'];
  const [deck, setDeck] = useState<MemoryState>(() => createDeck(config.pairs));
  const [focusIndex, setFocusIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState('Turn over any card to start.');
  const [result, setResult] = useState<GameResult | null>(null);
  const record = useProgress(slug);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const playing = startedAt !== null && endedAt === null;
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [playing]);

  const pending = hasPendingMismatch(deck);
  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setTimeout(() => setDeck((current) => hideMismatch(current)), MISMATCH_MS);
    return () => window.clearTimeout(timer);
  }, [pending, deck]);

  const pairsFound = deck.matched.filter(Boolean).length / 2;
  const elapsed = startedAt === null ? 0 : Math.floor(((endedAt ?? now) - startedAt) / 1000);
  const best = record.best[size];

  function newGame(next: MemorySize = size) {
    setDeck(createDeck(MEMORY_SIZES[next].pairs));
    setStartedAt(null);
    setEndedAt(null);
    setResult(null);
    setFocusIndex(0);
    setStatus('Turn over any card to start.');
  }

  function flip(index: number) {
    if (result) return;
    const next = flipCard(deck, index);
    if (next === deck) {
      if (deck.matched[index]) setStatus(`Card ${index + 1} is already matched.`);
      return;
    }
    const time = Date.now();
    if (startedAt === null) setStartedAt(time);
    setNow(time);
    setDeck(next);

    const symbol = next.cards[index];
    if (isCleared(next)) {
      const seconds = Math.floor((time - (startedAt ?? time)) / 1000);
      setEndedAt(time);
      const { isNewBest, previousBest } = recordRound(slug, { outcome: 'win', score: next.moves, scoreOrder: 'lower', bucket: size });
      setResult({
        title: 'Table cleared',
        detail: `${next.moves} moves in ${formatTime(seconds)}${
          isNewBest
            ? previousBest === undefined
              ? ` — your first ${config.label} clear.`
              : ` — a new best for ${config.label}.`
            : `. Best for ${config.label} is ${previousBest} moves.`
        }`,
        tone: 'win',
      });
      setStatus(`Match: ${symbol}. All ${config.pairs} pairs found.`);
    } else if (next.open.length === 1) {
      setStatus(`Card ${index + 1}: ${symbol}. Now find its partner.`);
    } else if (next.open.length === 2) {
      setStatus(`No match: ${next.cards[next.open[0]]} and ${symbol}. They turn back over.`);
    } else {
      setStatus(`Match: ${symbol}. ${next.matched.filter(Boolean).length / 2} of ${config.pairs} pairs found.`);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const side = config.side;
    const row = Math.floor(index / side);
    const col = index % side;
    let target: number | null = null;
    if (event.key === 'ArrowUp') target = row > 0 ? index - side : index;
    else if (event.key === 'ArrowDown') target = row < side - 1 ? index + side : index;
    else if (event.key === 'ArrowLeft') target = col > 0 ? index - 1 : index;
    else if (event.key === 'ArrowRight') target = col < side - 1 ? index + 1 : index;
    else if (event.key === 'Home') target = row * side;
    else if (event.key === 'End') target = row * side + side - 1;
    if (target === null) return;
    event.preventDefault();
    setFocusIndex(target);
    cardRefs.current[target]?.focus();
  }

  return (
    <GameFrame
      label="Memory"
      options={
        <Segmented
          label="Table"
          options={SIZE_OPTIONS}
          value={size}
          onChange={(value) => {
            setSize(value);
            newGame(value);
          }}
        />
      }
      stats={[
        { label: 'Moves', value: deck.moves },
        { label: 'Pairs', value: `${pairsFound}/${config.pairs}` },
        { label: 'Time', value: formatTime(elapsed) },
        { label: 'Best', value: best === undefined ? '—' : `${best} moves` },
      ]}
      onNewGame={() => newGame()}
      status={status}
      result={result}
    >
      <div
        role="group"
        aria-label={`${config.label} table of ${config.pairs * 2} cards. Arrow keys move between cards; Enter or Space turns one over.`}
        className={['mx-auto grid', config.side === 4 ? 'max-w-[26rem] gap-2 sm:gap-3' : 'max-w-[34rem] gap-1.5 sm:gap-2'].join(' ')}
        style={{ gridTemplateColumns: `repeat(${config.side}, minmax(0, 1fr))` }}
      >
        {deck.cards.map((symbol, index) => {
          const matched = deck.matched[index];
          const faceUp = matched || deck.open.includes(index);
          const label = `Card ${index + 1}, ${faceUp ? `${symbol}${matched ? ', matched' : ''}` : 'face down'}`;
          return (
            <button
              key={index}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              type="button"
              aria-label={label}
              aria-disabled={matched || undefined}
              tabIndex={index === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => flip(index)}
              className={['group relative aspect-square rounded-die perspective-[700px]', matched ? 'cursor-default' : 'cursor-pointer'].join(' ')}
            >
              <span
                className={[
                  'absolute inset-0 transition-transform duration-200 ease-out transform-3d motion-reduce:transition-none',
                  faceUp ? 'rotate-y-180' : '',
                ].join(' ')}
              >
                <span className="absolute inset-0 flex items-center justify-center rounded-die border-2 border-ink bg-game text-on-game backface-hidden group-hover:*:scale-105">
                  <svg viewBox="0 0 40 40" aria-hidden="true" className="h-full w-full p-[12%] transition-transform duration-150" fill="none" stroke="currentColor">
                    <rect x="2" y="2" width="36" height="36" rx="2" strokeWidth="1.5" />
                    <path d="M6 16 16 6M6 25 25 6M6 34 34 6M15 34 34 15M24 34 34 24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span
                  className={[
                    'absolute inset-0 flex rotate-y-180 items-center justify-center rounded-die border-2 backface-hidden',
                    matched ? 'border-rule bg-paper-deep text-ink-soft' : 'border-ink bg-card text-ink',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 40 40" aria-hidden="true" className="h-[62%] w-[62%]" fill="currentColor">
                    {GLYPHS[symbol]}
                  </svg>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </GameFrame>
  );
}

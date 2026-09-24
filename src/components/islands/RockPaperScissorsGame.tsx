import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { recordRound } from '../../lib/progress';
import {
  BEATEN_BY,
  MATCH_TARGET,
  RPS_MOVES,
  STYLE_NOTES,
  countMoves,
  opponentChoice,
  roundOutcome,
  type OpponentStyle,
  type RpsMove,
  type RpsOutcome,
} from '../../lib/playable/rock-paper-scissors';
import { GameFrame, type GameResult } from './kit/GameFrame';
import { Segmented } from './kit/Segmented';
import { usePref, useProgress } from './kit/useProgress';

interface Round {
  player: RpsMove;
  opponent: RpsMove;
  outcome: RpsOutcome;
  reason: string;
  predictable: boolean;
}

type HandTone = 'you' | 'them' | 'plain';

const LABEL: Record<RpsMove, string> = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };
const KEY: Record<RpsMove, string> = { rock: 'R', paper: 'P', scissors: 'S' };
const VERB: Record<RpsMove, string> = { rock: 'crushes', paper: 'covers', scissors: 'cut' };
const KEY_TO_MOVE: Record<string, RpsMove> = { r: 'rock', p: 'paper', s: 'scissors', 1: 'rock', 2: 'paper', 3: 'scissors' };

const TONE_CLASSES: Record<HandTone, string> = {
  you: 'fill-game stroke-ink',
  them: 'fill-ink stroke-card',
  plain: 'fill-card stroke-ink',
};

/** A hand seen from the side, fingers pointing right (mirrored for the opponent). */
function Hand({ move, tone, mirrored = false, className = '' }: { move: RpsMove; tone: HandTone; mirrored?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      <g
        className={TONE_CLASSES[tone]}
        strokeWidth="4"
        strokeLinejoin="round"
        transform={mirrored ? 'translate(120 0) scale(-1 1)' : undefined}
      >
        <rect x="4" y="38" width="24" height="32" rx="4" />
        {move === 'paper' ? (
          <>
            <rect x="22" y="30" width="44" height="48" rx="12" />
            <rect x="58" y="31" width="48" height="12" rx="6" />
            <rect x="58" y="43" width="54" height="12" rx="6" />
            <rect x="58" y="55" width="50" height="12" rx="6" />
            <rect x="58" y="67" width="42" height="11" rx="5.5" />
            <rect x="38" y="22" width="36" height="13" rx="6.5" transform="rotate(-32 44 28)" />
          </>
        ) : (
          <>
            <rect x="22" y="28" width="52" height="50" rx="14" />
            {move === 'scissors' ? (
              <>
                <rect x="56" y="22" width="58" height="12" rx="6" transform="rotate(-12 60 28)" />
                <rect x="56" y="37" width="58" height="12" rx="6" transform="rotate(8 60 43)" />
                <rect x="58" y="53" width="28" height="13" rx="6.5" />
                <rect x="58" y="66" width="26" height="12" rx="6" />
                <rect x="36" y="50" width="38" height="13" rx="6.5" />
              </>
            ) : (
              <>
                <rect x="58" y="28" width="30" height="13" rx="6.5" />
                <rect x="58" y="41" width="32" height="13" rx="6.5" />
                <rect x="58" y="54" width="30" height="12" rx="6" />
                <rect x="58" y="66" width="27" height="12" rx="6" />
                <rect x="34" y="20" width="42" height="13" rx="6.5" />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

function Pips({ score, tone, label }: { score: number; tone: 'you' | 'them'; label: string }) {
  return (
    <svg viewBox={`0 0 ${MATCH_TARGET * 16} 14`} className="h-3.5 w-20" role="img" aria-label={`${label}: ${score} of ${MATCH_TARGET}`}>
      {Array.from({ length: MATCH_TARGET }, (_, index) => (
        <circle
          key={index}
          cx={index * 16 + 7}
          cy="7"
          r="5.5"
          strokeWidth="2"
          className={['stroke-ink', index < score ? (tone === 'you' ? 'fill-game' : 'fill-ink') : 'fill-none'].join(' ')}
        />
      ))}
    </svg>
  );
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function RockPaperScissorsGame({ slug }: { slug: string }) {
  const progress = useProgress(slug);
  const [style, setStyle] = usePref<OpponentStyle>(slug, 'style', 'random');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pending, setPending] = useState<RpsMove | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const handRefs = useRef<(HTMLDivElement | null)[]>([]);

  const opponentName = STYLE_NOTES[style].name;
  const wins = rounds.filter((round) => round.outcome === 'win').length;
  const losses = rounds.filter((round) => round.outcome === 'loss').length;
  const last = rounds.at(-1);
  const counts = countMoves(rounds.map((round) => round.player));
  const best = progress.best[style];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Reveal: the new hands settle into place.
  useEffect(() => {
    if (rounds.length === 0 || reducedMotion()) return;
    for (const node of handRefs.current) {
      node?.animate([{ transform: 'scale(0.86)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 160, easing: 'ease-out' });
    }
  }, [rounds.length]);

  function restart(nextStyle: OpponentStyle = style) {
    window.clearTimeout(timer.current);
    setRounds([]);
    setPending(null);
    setResult(null);
    if (nextStyle !== style) setStyle(nextStyle);
  }

  function commit(player: RpsMove) {
    const choice = opponentChoice(style, rounds.map((round) => round.player));
    const round: Round = { player, opponent: choice.move, outcome: roundOutcome(player, choice.move), reason: choice.reason, predictable: choice.predictable };
    const next = [...rounds, round];
    setRounds(next);
    setPending(null);

    const youWon = next.filter((r) => r.outcome === 'win').length;
    const theyWon = next.filter((r) => r.outcome === 'loss').length;
    if (youWon < MATCH_TARGET && theyWon < MATCH_TARGET) return;

    const won = youWon === MATCH_TARGET;
    const { isNewBest } = recordRound(slug, {
      outcome: won ? 'win' : 'loss',
      bucket: style,
      ...(won ? { score: theyWon, scoreOrder: 'lower' as const } : {}),
    });
    setResult(
      won
        ? { title: 'You win the match', detail: `${youWon}–${theyWon} against ${opponentName}${isNewBest ? ', your best yet' : ''}.`, tone: 'win' }
        : { title: `${opponentName} wins the match`, detail: `${youWon}–${theyWon}. Read how it plays below.`, tone: 'loss' },
    );
  }

  function play(move: RpsMove) {
    if (result || pending) return;
    if (reducedMotion()) {
      commit(move);
      return;
    }
    // "Rock, paper, scissors, shoot": two quick pumps, then the reveal.
    setPending(move);
    for (const node of handRefs.current) {
      node?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], {
        duration: 170,
        iterations: 2,
        easing: 'ease-out',
      });
    }
    timer.current = window.setTimeout(() => commit(move), 340);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const move = KEY_TO_MOVE[event.key.toLowerCase()];
    if (!move) return;
    event.preventDefault();
    play(move);
  }

  const lastLine = last
    ? last.outcome === 'draw'
      ? `Round ${rounds.length}: both threw ${LABEL[last.player]}. Draw.`
      : last.outcome === 'win'
        ? `Round ${rounds.length}: your ${LABEL[last.player]} ${VERB[last.player]} ${LABEL[last.opponent]}. You take it.`
        : `Round ${rounds.length}: ${LABEL[last.opponent]} ${VERB[last.opponent]} your ${LABEL[last.player]}. ${opponentName} takes it.`
    : '';
  const status = pending
    ? 'Rock, paper, scissors…'
    : last
      ? `${lastLine} ${wins}–${losses}.`
      : `First to ${MATCH_TARGET} wins. Throw rock, paper or scissors (R, P, S).`;

  const predictable = rounds.filter((round) => round.predictable).length;

  return (
    <div onKeyDown={handleKeyDown}>
      <GameFrame
        label="Rock Paper Scissors board"
        options={
          <Segmented
            label="Opponent"
            options={(Object.keys(STYLE_NOTES) as OpponentStyle[]).map((value) => ({ value, label: STYLE_NOTES[value].name }))}
            value={style}
            onChange={(value) => restart(value)}
          />
        }
        stats={[
          { label: 'Matches won', value: progress.wins },
          { label: 'Streak', value: progress.streak },
          { label: 'Best', value: best === undefined ? '—' : `${MATCH_TARGET}–${best}` },
        ]}
        onNewGame={() => restart()}
        newGameLabel="New match"
        status={status}
        result={result}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 rounded-die border-2 border-ink bg-paper p-3 sm:gap-6 sm:p-4">
            {(['you', 'them'] as const).map((side, index) => {
              const move = pending ? 'rock' : last ? (side === 'you' ? last.player : last.opponent) : null;
              const roundWinner = !pending && last && last.outcome !== 'draw' && (last.outcome === 'win') === (side === 'you');
              return (
                <div key={side} className={['flex flex-col gap-2', side === 'them' ? 'items-end text-right' : ''].join(' ')}>
                  <div className={['flex w-full items-baseline justify-between gap-2', side === 'them' ? 'flex-row-reverse' : ''].join(' ')}>
                    <span className="truncate font-display text-base font-black font-stretch-expanded sm:text-lg">
                      {side === 'you' ? 'You' : opponentName}
                    </span>
                    <span className="text-2xl font-black tabular-nums">{side === 'you' ? wins : losses}</span>
                  </div>
                  <Pips score={side === 'you' ? wins : losses} tone={side} label={side === 'you' ? 'Your points' : `${opponentName} points`} />
                  <div
                    ref={(node) => {
                      handRefs.current[index] = node;
                    }}
                    className="grid aspect-[6/5] w-full max-w-48 place-items-center"
                  >
                    {move ? (
                      <Hand move={move} tone={side} mirrored={side === 'them'} className="w-full" />
                    ) : (
                      <svg viewBox="0 0 120 100" className="w-full" aria-hidden="true">
                        <rect x="14" y="14" width="92" height="72" rx="6" fill="none" strokeWidth="2" strokeDasharray="6 5" className="stroke-rule" />
                      </svg>
                    )}
                  </div>
                  <p className="min-h-6 text-sm font-semibold">
                    {pending ? '' : move ? (
                      <>
                        {LABEL[move]}
                        {roundWinner && <span className="ml-1.5 whitespace-nowrap rounded-[3px] bg-ink px-1.5 py-0.5 text-xs text-paper">Wins</span>}
                      </>
                    ) : (
                      <span className="text-ink-muted">Waiting</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div role="group" aria-label="Your throw" className="grid grid-cols-3 gap-2 sm:gap-3">
            {RPS_MOVES.map((move) => (
              <button
                key={move}
                type="button"
                disabled={Boolean(result)}
                aria-disabled={Boolean(pending) || undefined}
                aria-keyshortcuts={`${KEY[move]} ${RPS_MOVES.indexOf(move) + 1}`}
                onClick={() => play(move)}
                className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-die border-2 border-ink bg-card px-1 py-2 transition-colors duration-150 hover:bg-paper-deep active:bg-game active:text-on-game disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Hand move={move} tone="plain" className="h-14 w-[4.2rem]" />
                <span className="text-sm font-bold font-stretch-semi-expanded sm:text-base">{LABEL[move]}</span>
                <span className="text-xs text-ink-muted" aria-hidden="true">
                  {KEY[move]} or {RPS_MOVES.indexOf(move) + 1}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:gap-8">
            <div>
              <h3 className="text-sm font-bold">Rounds</h3>
              {rounds.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">No rounds yet. Each throw adds a column here.</p>
              ) : (
                <ol className="mt-2 flex flex-wrap gap-1.5">
                  {rounds.map((round, index) => (
                    <li key={index} className="flex w-11 flex-col items-center gap-0.5 rounded-die border-2 border-ink bg-paper py-1">
                      <span className="sr-only">
                        Round {index + 1}: you {LABEL[round.player]}, {opponentName} {LABEL[round.opponent]},{' '}
                        {round.outcome === 'win' ? 'you won' : round.outcome === 'loss' ? 'you lost' : 'draw'}
                      </span>
                      <Hand move={round.player} tone="you" className="w-8" />
                      <Hand move={round.opponent} tone="them" mirrored className="w-8" />
                      <span
                        aria-hidden="true"
                        className={[
                          'w-7 rounded-[3px] text-center text-xs font-black',
                          round.outcome === 'win' ? 'bg-game text-on-game' : round.outcome === 'loss' ? 'bg-ink text-paper' : 'text-ink-soft',
                        ].join(' ')}
                      >
                        {round.outcome === 'win' ? 'W' : round.outcome === 'loss' ? 'L' : 'D'}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="sm:w-52">
              <h3 className="text-sm font-bold">Your throws</h3>
              <dl className="mt-2 flex flex-col gap-1.5">
                {RPS_MOVES.map((move) => {
                  const share = rounds.length ? Math.round((counts[move] / rounds.length) * 100) : 0;
                  return (
                    <div key={move} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-sm">
                      <dt className="font-semibold">{LABEL[move]}</dt>
                      <dd className="h-3 rounded-[2px] bg-paper-deep" aria-hidden="true">
                        <div className="h-full rounded-[2px] bg-ink transition-[width] duration-200 ease-out" style={{ width: `${share}%` }} />
                      </dd>
                      <dd className="text-right tabular-nums">
                        {counts[move]} · {share}%
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>

          {result && (
            <div className="border-t-2 border-ink pt-4">
              <h3 className="font-display text-lg font-black font-stretch-expanded">How {opponentName} decides</h3>
              <p className="mt-1 font-serif text-base leading-7">{STYLE_NOTES[style].decides}</p>
              <h3 className="mt-4 font-display text-lg font-black font-stretch-expanded">How to beat it</h3>
              <p className="mt-1 font-serif text-base leading-7">{STYLE_NOTES[style].beat}</p>
              <p className="mt-3 text-sm text-ink-soft">
                {style === 'random'
                  ? `None of its ${rounds.length} throws depended on yours.`
                  : `${predictable} of its ${rounds.length} throws followed directly from your history.`}
              </p>
              {style !== 'random' && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[18rem] border-collapse text-sm">
                  <caption className="sr-only">Why {opponentName} threw what it threw each round</caption>
                  <thead>
                    <tr className="border-b-2 border-ink text-left">
                      <th scope="col" className="py-1 pr-2 font-semibold">#</th>
                      <th scope="col" className="py-1 pr-2 font-semibold">You</th>
                      <th scope="col" className="py-1 pr-2 font-semibold">It</th>
                      <th scope="col" className="py-1 font-semibold">Why it threw that</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((round, index) => (
                      <tr key={index} className="border-b border-rule align-top">
                        <td className="py-1 pr-2 tabular-nums">{index + 1}</td>
                        <td className="py-1 pr-2">{LABEL[round.player]}</td>
                        <td className="py-1 pr-2">{LABEL[round.opponent]}</td>
                        <td className="py-1">
                          {round.reason}
                          {round.predictable && <span className="text-ink-muted">. {LABEL[BEATEN_BY[round.opponent]]} would have won.</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
        </div>
      </GameFrame>
    </div>
  );
}

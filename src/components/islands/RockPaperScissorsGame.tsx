import { useMemo, useState } from 'react';
import { playRpsRound, rpsChoices, type RpsChoice, type RpsRound } from '../../lib/playable/rock-paper-scissors';

export default function RockPaperScissorsGame() {
  const [history, setHistory] = useState<RpsRound[]>([]);
  const latestRound = history[0];

  const score = useMemo(
    () =>
      history.reduce(
        (totals, round) => {
          totals[round.result] += 1;
          return totals;
        },
        { win: 0, lose: 0, draw: 0 },
      ),
    [history],
  );

  function play(choice: RpsChoice) {
    setHistory((current) => [playRpsRound(choice), ...current].slice(0, 8));
  }

  function handleKey(choice: RpsChoice) {
    play(choice);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3" aria-label="Choose rock, paper, or scissors">
        {rpsChoices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => play(choice)}
            onKeyDown={(event) => {
              if (event.key.toLowerCase() === choice[0]) {
                handleKey(choice);
              }
            }}
            className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            aria-label={`Play ${choice}`}
          >
            {choice[0].toUpperCase()}
            {choice.slice(1)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setHistory([])}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Reset rounds
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(14rem,0.8fr)]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Latest round</h3>
          <p className="mt-3 text-sm leading-7 text-slate-700" aria-live="polite">
            {latestRound
              ? `You played ${latestRound.player}. The computer played ${latestRound.computer}. Result: ${latestRound.result}.`
              : 'Choose an option to begin a round.'}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Scoreboard</h3>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-2xl bg-sky-50 px-3 py-3">
              <dt className="text-slate-500">Wins</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{score.win}</dd>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-3">
              <dt className="text-slate-500">Draws</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{score.draw}</dd>
            </div>
            <div className="rounded-2xl bg-rose-50 px-3 py-3">
              <dt className="text-slate-500">Losses</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{score.lose}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

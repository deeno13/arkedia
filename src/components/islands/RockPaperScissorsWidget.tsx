import { useState } from 'react';

const choices = ['rock', 'paper', 'scissors'] as const;

type Choice = (typeof choices)[number];

function getResult(playerChoice: Choice, computerChoice: Choice) {
  if (playerChoice === computerChoice) {
    return "It's a draw.";
  }

  const winsAgainst: Record<Choice, Choice> = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  };

  return winsAgainst[playerChoice] === computerChoice ? 'You win this round.' : 'The computer wins this round.';
}

export default function RockPaperScissorsWidget() {
  const [result, setResult] = useState('Choose one option to play a quick round.');
  const [history, setHistory] = useState<{ player: Choice; computer: Choice } | null>(null);

  function playRound(playerChoice: Choice) {
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];
    setHistory({ player: playerChoice, computer: computerChoice });
    setResult(getResult(playerChoice, computerChoice));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => playRound(choice)}
            className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {choice[0].toUpperCase()}
            {choice.slice(1)}
          </button>
        ))}
      </div>

      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700" aria-live="polite">
        {history ? `${result} You chose ${history.player}; the computer chose ${history.computer}.` : result}
      </p>
    </div>
  );
}

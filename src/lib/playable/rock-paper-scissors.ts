export const rpsChoices = ['rock', 'paper', 'scissors'] as const;

export type RpsChoice = (typeof rpsChoices)[number];
export type RpsRoundResult = 'win' | 'lose' | 'draw';

export interface RpsRound {
  player: RpsChoice;
  computer: RpsChoice;
  result: RpsRoundResult;
}

const winsAgainst: Record<RpsChoice, RpsChoice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export function getComputerChoice(random = Math.random) {
  return rpsChoices[Math.floor(random() * rpsChoices.length)];
}

export function getRoundResult(player: RpsChoice, computer: RpsChoice): RpsRoundResult {
  if (player === computer) {
    return 'draw';
  }

  return winsAgainst[player] === computer ? 'win' : 'lose';
}

export function playRpsRound(player: RpsChoice, random = Math.random): RpsRound {
  const computer = getComputerChoice(random);

  return {
    player,
    computer,
    result: getRoundResult(player, computer),
  };
}

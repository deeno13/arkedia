export const SNAKE_BOARD_SIZE = 10;
export const SNAKE_START_DELAY = 220;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface CellPosition {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: CellPosition[];
  direction: Direction;
  food: CellPosition;
  score: number;
  status: 'idle' | 'playing' | 'paused' | 'lost';
}

const directionOffsets: Record<Direction, CellPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const oppositeDirections: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function positionsEqual(left: CellPosition, right: CellPosition) {
  return left.x === right.x && left.y === right.y;
}

export function getInitialSnakeState(random = Math.random): SnakeState {
  const snake = [
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ];

  return {
    snake,
    direction: 'right',
    food: getRandomOpenCell(snake, random),
    score: 0,
    status: 'idle',
  };
}

export function getNextDirection(current: Direction, requested: Direction) {
  return oppositeDirections[current] === requested ? current : requested;
}

export function getRandomOpenCell(occupied: CellPosition[], random = Math.random): CellPosition {
  const openCells: CellPosition[] = [];

  for (let y = 0; y < SNAKE_BOARD_SIZE; y += 1) {
    for (let x = 0; x < SNAKE_BOARD_SIZE; x += 1) {
      if (!occupied.some((cell) => cell.x === x && cell.y === y)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return { x: 0, y: 0 };
  }

  return openCells[Math.floor(random() * openCells.length)];
}

export function advanceSnake(state: SnakeState, random = Math.random): SnakeState {
  if (state.status === 'lost') {
    return state;
  }

  const head = state.snake[0];
  const offset = directionOffsets[state.direction];
  const nextHead = { x: head.x + offset.x, y: head.y + offset.y };

  const collidedWithWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= SNAKE_BOARD_SIZE ||
    nextHead.y >= SNAKE_BOARD_SIZE;

  const willEatFood = positionsEqual(nextHead, state.food);
  const bodyToCheck = willEatFood ? state.snake : state.snake.slice(0, -1);
  const collidedWithSelf = bodyToCheck.some((cell) => positionsEqual(cell, nextHead));

  if (collidedWithWall || collidedWithSelf) {
    return {
      ...state,
      status: 'lost',
    };
  }

  const nextSnake = [nextHead, ...state.snake];

  if (!willEatFood) {
    nextSnake.pop();
  }

  return {
    ...state,
    snake: nextSnake,
    food: willEatFood ? getRandomOpenCell(nextSnake, random) : state.food,
    score: willEatFood ? state.score + 1 : state.score,
    status: 'playing',
  };
}

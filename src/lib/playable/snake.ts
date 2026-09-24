/**
 * Snake: pure, framework-free rules. Every function returns a new state; randomness
 * (food placement) is injectable so rounds can be replayed in tests.
 */

export const SNAKE_SIZE = 17;
/** Turns waiting to be applied, one per tick. Lets "up, then left" land as two moves. */
export const TURN_BUFFER = 3;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'ready' | 'playing' | 'paused' | 'over';

export interface Cell {
  x: number;
  y: number;
}

export interface SnakeState {
  size: number;
  /** Head first. */
  snake: Cell[];
  direction: Direction;
  /** Buffered turns, oldest first. */
  turns: Direction[];
  /** `null` only when the snake fills the whole board. */
  food: Cell | null;
  score: number;
  status: SnakeStatus;
  /** Why the round ended. */
  end: 'wall' | 'self' | 'full' | null;
}

export const OFFSETS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function placeFood(size: number, snake: Cell[], random = Math.random): Cell | null {
  const taken = new Set(snake.map((cell) => cell.y * size + cell.x));
  const open: number[] = [];
  for (let index = 0; index < size * size; index += 1) if (!taken.has(index)) open.push(index);
  if (open.length === 0) return null;
  const index = open[Math.floor(random() * open.length)];
  return { x: index % size, y: Math.floor(index / size) };
}

/** A three-long snake in the middle row, facing right, waiting for the first input. */
export function createSnake(size = SNAKE_SIZE, random = Math.random): SnakeState {
  const y = Math.floor(size / 2);
  const x = Math.floor(size / 4) + 2;
  const snake = [
    { x, y },
    { x: x - 1, y },
    { x: x - 2, y },
  ];
  return { size, snake, direction: 'right', turns: [], food: placeFood(size, snake, random), score: 0, status: 'ready', end: null };
}

/**
 * Queue a turn. Turns are checked against the last queued direction, so a reversal
 * (or a repeat) is ignored even when it arrives between ticks. Before the first move
 * the snake is stationary, so asking for the opposite way simply turns it around.
 * Any turn starts a ready round and resumes a paused one.
 */
export function turn(state: SnakeState, direction: Direction): SnakeState {
  if (state.status === 'over') return state;

  if (state.status === 'ready') {
    if (direction === OPPOSITE[state.direction]) {
      return { ...state, snake: [...state.snake].reverse(), direction, turns: [], status: 'playing' };
    }
    return { ...state, turns: direction === state.direction ? [] : [direction], status: 'playing' };
  }

  const status = state.status === 'paused' ? 'playing' : state.status;
  const last = state.turns.at(-1) ?? state.direction;
  if (direction === last || direction === OPPOSITE[last] || state.turns.length >= TURN_BUFFER) {
    return status === state.status ? state : { ...state, status };
  }
  return { ...state, turns: [...state.turns, direction], status };
}

export function togglePause(state: SnakeState): SnakeState {
  if (state.status === 'playing') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'playing' };
  return state;
}

/** Advance one tick: apply the next buffered turn, move, eat or collide. */
export function step(state: SnakeState, random = Math.random): SnakeState {
  if (state.status !== 'playing') return state;

  const [nextTurn, ...turns] = state.turns;
  const direction = nextTurn ?? state.direction;
  const offset = OFFSETS[direction];
  const head = { x: state.snake[0].x + offset.x, y: state.snake[0].y + offset.y };

  if (head.x < 0 || head.y < 0 || head.x >= state.size || head.y >= state.size) {
    return { ...state, direction, turns, status: 'over', end: 'wall' };
  }

  const eats = state.food !== null && head.x === state.food.x && head.y === state.food.y;
  // The tail moves out of the way this tick unless the snake is growing.
  const body = eats ? state.snake : state.snake.slice(0, -1);
  if (body.some((cell) => cell.x === head.x && cell.y === head.y)) {
    return { ...state, direction, turns, status: 'over', end: 'self' };
  }

  const snake = [head, ...body];
  if (!eats) return { ...state, snake, direction, turns };

  const food = placeFood(state.size, snake, random);
  return {
    ...state,
    snake,
    direction,
    turns,
    food,
    score: state.score + 1,
    status: food ? 'playing' : 'over',
    end: food ? null : 'full',
  };
}

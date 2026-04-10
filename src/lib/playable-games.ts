export const PLAYABLE_WIDGET_OPTIONS = [
  'snake',
  'rock-paper-scissors',
  'wordle-mini',
  'sudoku-scaffold',
  'crossword-scaffold',
] as const;

export type PlayableWidgetKey = (typeof PLAYABLE_WIDGET_OPTIONS)[number];

export interface PlayableWidgetMeta {
  eyebrow: string;
  title: string;
  description: string;
  controlHints: string[];
  hydration: 'visible' | 'idle' | 'load';
  type: 'playable' | 'scaffold';
  resetLabel?: string;
}

export const PLAYABLE_WIDGET_META: Record<PlayableWidgetKey, PlayableWidgetMeta> = {
  snake: {
    eyebrow: 'Playable demo',
    title: 'Play Snake',
    description: 'Guide the snake around the grid, collect food, and avoid collisions as the board gets tighter.',
    controlHints: ['Arrow keys or WASD to steer', 'Space to pause or resume', 'Use reset to restart the board'],
    hydration: 'visible',
    type: 'playable',
    resetLabel: 'Restart Snake',
  },
  'rock-paper-scissors': {
    eyebrow: 'Playable demo',
    title: 'Play Rock Paper Scissors',
    description: 'Run quick rounds against the computer to explore outcomes, streaks, and player habits.',
    controlHints: ['Choose with buttons or keys R, P, and S', 'Screen reader status updates announce each result'],
    hydration: 'visible',
    type: 'playable',
    resetLabel: 'Reset rounds',
  },
  'wordle-mini': {
    eyebrow: 'Playable demo',
    title: 'Play a Word Guessing Round',
    description: 'Guess a five-letter word in six tries and use each clue to refine the next attempt.',
    controlHints: ['Type a five-letter word and submit', 'Letter feedback uses text labels as well as color', 'Reset to load a new answer'],
    hydration: 'visible',
    type: 'playable',
    resetLabel: 'Start a new puzzle',
  },
  'sudoku-scaffold': {
    eyebrow: 'Interactive scaffold',
    title: 'Sudoku board scaffold',
    description: 'The page is ready for a future playable Sudoku board, but this phase keeps the implementation intentionally lightweight.',
    controlHints: ['Future extension: candidate notes', 'Future extension: keyboard cell navigation', 'Future extension: validation and hints'],
    hydration: 'visible',
    type: 'scaffold',
  },
  'crossword-scaffold': {
    eyebrow: 'Interactive scaffold',
    title: 'Crossword scaffold',
    description: 'The content page already supports a future playable crossword experience without forcing a rushed half-implementation now.',
    controlHints: ['Future extension: clue focus and active word highlighting', 'Future extension: keyboard-first letter entry', 'Future extension: clue list synchronization'],
    hydration: 'visible',
    type: 'scaffold',
  },
};

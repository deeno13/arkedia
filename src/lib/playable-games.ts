/**
 * Widget keys referenced by `widget` in game frontmatter. Each key maps to one React
 * island in src/components/content/InteractiveWidget.astro.
 */
export const PLAYABLE_WIDGET_OPTIONS = [
  'snake',
  'rock-paper-scissors',
  'wordle',
  'sudoku',
  'crossword',
  'tic-tac-toe',
  'connect-four',
  'minesweeper',
  '2048',
  'mastermind',
  'nim',
  'tower-of-hanoi',
  'memory',
  'lights-out',
] as const;

export type PlayableWidgetKey = (typeof PLAYABLE_WIDGET_OPTIONS)[number];

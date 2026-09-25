/**
 * Process inks: one signature colour per game. `on` is the text colour that meets
 * WCAG AA (≥4.5:1) on a solid fill of that ink. Values mirror the @theme tokens in
 * src/styles/global.css.
 */
export const INKS = {
  vermilion: { value: '#c8341b', on: '#ffffff' },
  cobalt: { value: '#2544c4', on: '#ffffff' },
  green: { value: '#0a7049', on: '#ffffff' },
  mustard: { value: '#e0a21a', on: '#1d1c1a' },
  violet: { value: '#6536a6', on: '#ffffff' },
  pink: { value: '#c73d7e', on: '#ffffff' },
  teal: { value: '#0b6f7a', on: '#ffffff' },
  orange: { value: '#e0661c', on: '#1d1c1a' },
  sky: { value: '#3b8fd9', on: '#1d1c1a' },
  plum: { value: '#8c2b5b', on: '#ffffff' },
  olive: { value: '#6b7a1e', on: '#ffffff' },
  brick: { value: '#9c3b24', on: '#ffffff' },
} as const;

export type InkName = keyof typeof INKS;

export const INK_NAMES = Object.keys(INKS) as [InkName, ...InkName[]];

/** Inline style that scopes the `game` / `on-game` Tailwind colours to one ink. */
export function inkStyle(ink: InkName) {
  return `--game-ink: ${INKS[ink].value}; --game-on-ink: ${INKS[ink].on};`;
}

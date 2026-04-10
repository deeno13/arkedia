export const siteConfig = {
  name: 'Arkedia',
  tagline: 'Educational games, explained clearly',
  description:
    'Arkedia is a static-first educational games library built with Astro. It pairs structured guides, thoughtful metadata, and optional playable islands without turning the whole site into a client-heavy app.',
  locale: 'en',
  defaultOgImageAlt: 'Preview image for Arkedia educational game guides',
} as const;

export const mainNavigation = [
  { href: '/', label: 'Home' },
  { href: '/games/', label: 'Games' },
  { href: '/about/', label: 'About' },
] as const;

export const editorialPrinciples = [
  'Explain the game before adding interface complexity.',
  'Keep most pages static and content-driven by default.',
  'Use islands only when interaction clearly improves learning.',
] as const;

export const roadmapGames = ['Snake', 'Wordle-style games', 'Sudoku', 'Crossword', 'Rock Paper Scissors'] as const;

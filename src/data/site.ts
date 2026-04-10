export const siteConfig = {
  name: 'Arkedia',
  description:
    'A content-first educational games site built with Astro, designed to stay static-first, accessible, and ready for optional interactive islands.',
  locale: 'en',
  siteUrl: '',
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

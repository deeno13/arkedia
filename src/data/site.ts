export const siteConfig = {
  name: 'Arkedia',
  tagline: 'Classic games to learn and play',
  description:
    'Fourteen classic games, each on one page: the rules in a minute, a worked example, the strategy and the idea underneath, and a board to play on right beside them.',
  locale: 'en',
  defaultOgImageAlt: 'Arkedia: classic games to learn and play',
} as const;

export const mainNavigation = [
  { href: '/games/', label: 'Games' },
  { href: '/about/', label: 'About' },
] as const;

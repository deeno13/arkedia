import { getCollection, type CollectionEntry } from 'astro:content';

export type GameEntry = CollectionEntry<'games'>;
export type GameCategory = GameEntry['data']['category'];
export type GameDifficulty = GameEntry['data']['difficulty'];

/** Display order and labels; the library filter uses the same order. */
export const GAME_CATEGORY_LABELS = {
  arcade: 'Arcade',
  word: 'Word',
  puzzle: 'Puzzle',
  strategy: 'Strategy',
} as const satisfies Record<GameCategory, string>;

export const GAME_DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const satisfies Record<GameDifficulty, string>;

const categoryOrder = Object.keys(GAME_CATEGORY_LABELS) as GameCategory[];

/** Sorted by category (arcade, word, puzzle, strategy), then title. Throws on duplicate slugs. */
export async function getPublishedGames() {
  const entries = await getCollection('games', ({ data }) => data.status === 'published');
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.data.slug)) {
      throw new Error(`Duplicate game slug detected: "${entry.data.slug}".`);
    }
    seen.add(entry.data.slug);
  }

  return entries.sort(
    (left, right) =>
      categoryOrder.indexOf(left.data.category) - categoryOrder.indexOf(right.data.category) ||
      left.data.title.localeCompare(right.data.title),
  );
}

export function gameHref(entry: GameEntry) {
  return `/games/${entry.data.slug}/`;
}

export function formatPlayerRange(minPlayers: number, maxPlayers: number) {
  if (minPlayers === maxPlayers) {
    return `${minPlayers} player${minPlayers === 1 ? '' : 's'}`;
  }

  return `${minPlayers}–${maxPlayers} players`;
}

export function resolveRelatedGames(entry: GameEntry, entries: GameEntry[]) {
  const bySlug = new Map(entries.map((game) => [game.data.slug, game]));

  return entry.data.relatedGameSlugs
    .map((slug) => bySlug.get(slug))
    .filter((related): related is GameEntry => Boolean(related) && related !== entry);
}

/** Quickest beginner games first: the "start here" set. */
export function getStarterGames(entries: GameEntry[], limit = 3) {
  return entries
    .filter((entry) => entry.data.difficulty === 'beginner')
    .sort((left, right) => left.data.estimatedMinutes - right.data.estimatedMinutes || left.data.title.localeCompare(right.data.title))
    .slice(0, limit);
}

export function groupGamesByCategory(entries: GameEntry[]) {
  return categoryOrder
    .map((category) => ({
      category,
      label: GAME_CATEGORY_LABELS[category],
      entries: entries.filter((entry) => entry.data.category === category),
    }))
    .filter((group) => group.entries.length > 0);
}

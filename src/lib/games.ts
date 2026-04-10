import { getCollection, type CollectionEntry } from 'astro:content';

export type GameEntry = CollectionEntry<'games'>;

export const GAME_CATEGORY_LABELS = {
  arcade: 'Arcade',
  word: 'Word',
  logic: 'Logic',
  probability: 'Probability',
} as const;

export const GAME_STATUS_LABELS = {
  published: 'Published',
  prototype: 'Prototype',
  'coming-soon': 'Coming soon',
} as const;

export const GAME_DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

type MetadataTone = 'accent' | 'neutral' | 'warm';

export interface MetadataItem {
  label: string;
  tone?: MetadataTone;
}

const statusOrder: Record<GameEntry['data']['status'], number> = {
  published: 0,
  prototype: 1,
  'coming-soon': 2,
};

function assertUniqueSlugs(entries: GameEntry[]) {
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.data.slug)) {
      throw new Error(`Duplicate game slug detected: "${entry.data.slug}".`);
    }

    seen.add(entry.data.slug);
  }
}

export function sortGames(entries: GameEntry[]) {
  const sorted = [...entries].sort((left, right) => {
    const statusDiff = statusOrder[left.data.status] - statusOrder[right.data.status];

    if (statusDiff !== 0) {
      return statusDiff;
    }

    const categoryDiff = formatCategoryLabel(left.data.category).localeCompare(formatCategoryLabel(right.data.category));

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    return left.data.title.localeCompare(right.data.title);
  });

  assertUniqueSlugs(sorted);

  return sorted;
}

export async function getAllGames() {
  return sortGames(await getCollection('games'));
}

export async function getPublishedGames() {
  return sortGames(await getCollection('games', ({ data }) => data.status === 'published'));
}

export function formatCategoryLabel(category: GameEntry['data']['category']) {
  return GAME_CATEGORY_LABELS[category];
}

export function formatStatusLabel(status: GameEntry['data']['status']) {
  return GAME_STATUS_LABELS[status];
}

export function formatDifficultyLabel(difficulty: GameEntry['data']['difficulty']) {
  return GAME_DIFFICULTY_LABELS[difficulty];
}

export function formatPlayerRange(minPlayers: number, maxPlayers: number) {
  if (minPlayers === maxPlayers) {
    return `${minPlayers} player${minPlayers === 1 ? '' : 's'}`;
  }

  return `${minPlayers}-${maxPlayers} players`;
}

export function formatEstimatedMinutes(minutes: number) {
  return `${minutes} min`;
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(value);
}

export function indexGamesBySlug(entries: GameEntry[]) {
  const slugMap = new Map<string, GameEntry>();

  for (const entry of entries) {
    if (slugMap.has(entry.data.slug)) {
      throw new Error(`Duplicate game slug detected: "${entry.data.slug}".`);
    }

    slugMap.set(entry.data.slug, entry);
  }

  return slugMap;
}

export function getGameBySlug(slug: string, entries: GameEntry[]) {
  return indexGamesBySlug(entries).get(slug);
}

export function resolveRelatedGames(entry: GameEntry, entries: GameEntry[]) {
  const slugMap = indexGamesBySlug(entries);

  return entry.data.relatedGameSlugs
    .map((slug) => slugMap.get(slug))
    .filter((related): related is GameEntry => Boolean(related) && related.id !== entry.id);
}

export function formatGameCardMetadata(entry: GameEntry): MetadataItem[] {
  return [
    { label: formatPlayerRange(entry.data.minPlayers, entry.data.maxPlayers) },
    { label: formatEstimatedMinutes(entry.data.estimatedMinutes), tone: 'warm' },
    { label: entry.data.isPlayable ? 'Playable' : 'Guide', tone: entry.data.isPlayable ? 'accent' : 'neutral' },
  ];
}

export function formatGamePageMetadata(entry: GameEntry): MetadataItem[] {
  return [
    { label: formatCategoryLabel(entry.data.category) },
    { label: formatDifficultyLabel(entry.data.difficulty), tone: 'warm' },
    { label: formatPlayerRange(entry.data.minPlayers, entry.data.maxPlayers) },
    { label: formatEstimatedMinutes(entry.data.estimatedMinutes) },
    ...(entry.data.isPlayable ? [{ label: 'Playable', tone: 'accent' as const }] : []),
  ];
}

export function getGameCategorySummaries(entries: GameEntry[]) {
  const counts = new Map<GameEntry['data']['category'], number>();

  for (const entry of entries) {
    counts.set(entry.data.category, (counts.get(entry.data.category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({
      slug: category,
      label: formatCategoryLabel(category),
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function groupGamesByCategory(entries: GameEntry[]) {
  return getGameCategorySummaries(entries).map((summary) => ({
    ...summary,
    entries: entries.filter((entry) => entry.data.category === summary.slug),
  }));
}

export function getGameDifficultySummaries(entries: GameEntry[]) {
  const counts = new Map<GameEntry['data']['difficulty'], number>();

  for (const entry of entries) {
    counts.set(entry.data.difficulty, (counts.get(entry.data.difficulty) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([difficulty, count]) => ({
      slug: difficulty,
      label: formatDifficultyLabel(difficulty),
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getPlayableGameCount(entries: GameEntry[]) {
  return entries.filter((entry) => entry.data.isPlayable).length;
}

export function getPopularGameTags(entries: GameEntry[], limit = 10) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
    .slice(0, limit);
}

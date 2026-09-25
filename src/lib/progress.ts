/**
 * Per-device progress, stored in localStorage. No server, no accounts.
 * Safe to import from Astro <script> tags and React islands; every read/write is a
 * no-op on the server or when storage is unavailable (private mode, disabled storage).
 */

export const PROGRESS_STORAGE_KEY = 'arkedia:progress:v1';
export const PROGRESS_EVENT = 'arkedia:progress';

export type RoundOutcome = 'win' | 'loss' | 'draw' | 'complete';
export type ScoreOrder = 'higher' | 'lower';
export type PrefValue = string | number | boolean;

export interface ProgressRecord {
  /** Finished rounds (any outcome). */
  plays: number;
  wins: number;
  losses: number;
  draws: number;
  /** Best score per score bucket (e.g. "default", "hard", "9x9"). */
  best: Record<string, number>;
  /** How each bucket's best compares, so readers can label it. */
  bestOrder: Record<string, ScoreOrder>;
  /** Current and longest win streaks. */
  streak: number;
  bestStreak: number;
  lastPlayedAt?: string;
  prefs: Record<string, PrefValue>;
}

export interface RoundResult {
  outcome: RoundOutcome;
  /** Score for this round (points, seconds, moves…). */
  score?: number;
  /** Whether a higher or lower score is better. Required when `score` is given. */
  scoreOrder?: ScoreOrder;
  /** Separate bests per variant (difficulty, board size). Defaults to "default". */
  bucket?: string;
}

export interface RecordRoundResult {
  record: ProgressRecord;
  isNewBest: boolean;
  previousBest?: number;
}

export interface ProgressEventDetail {
  slug: string | null;
}

type ProgressStore = Record<string, ProgressRecord>;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStore(): ProgressStore {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore, slug: string | null) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent<ProgressEventDetail>(PROGRESS_EVENT, { detail: { slug } }));
}

function normalize(record: Partial<ProgressRecord> | undefined): ProgressRecord {
  return {
    plays: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
    ...record,
    best: { ...record?.best },
    bestOrder: { ...record?.bestOrder },
    prefs: { ...record?.prefs },
  };
}

export function readProgress(slug: string): ProgressRecord {
  return normalize(readStore()[slug]);
}

export function readAllProgress(): Record<string, ProgressRecord> {
  const store = readStore();
  return Object.fromEntries(Object.entries(store).map(([slug, record]) => [slug, normalize(record)]));
}

/** Call exactly once when a round ends. */
export function recordRound(slug: string, result: RoundResult): RecordRoundResult {
  const store = readStore();
  const record = normalize(store[slug]);
  const bucket = result.bucket ?? 'default';

  record.plays += 1;
  record.lastPlayedAt = new Date().toISOString();

  if (result.outcome === 'win') {
    record.wins += 1;
    record.streak += 1;
    record.bestStreak = Math.max(record.bestStreak, record.streak);
  } else if (result.outcome === 'loss') {
    record.losses += 1;
    record.streak = 0;
  } else if (result.outcome === 'draw') {
    record.draws += 1;
  }

  let isNewBest = false;
  const previousBest = record.best[bucket];

  if (typeof result.score === 'number' && Number.isFinite(result.score)) {
    const order = result.scoreOrder ?? 'higher';
    const beats = previousBest === undefined || (order === 'higher' ? result.score > previousBest : result.score < previousBest);
    if (beats) {
      record.best[bucket] = result.score;
      record.bestOrder[bucket] = order;
      isNewBest = true;
    }
  }

  store[slug] = record;
  writeStore(store, slug);
  return { record, isNewBest, previousBest };
}

export function getPref<T extends PrefValue>(slug: string, key: string, fallback: T): T {
  const value = readProgress(slug).prefs[key];
  return (typeof value === typeof fallback ? value : fallback) as T;
}

export function setPref(slug: string, key: string, value: PrefValue) {
  const store = readStore();
  const record = normalize(store[slug]);
  record.prefs[key] = value;
  store[slug] = record;
  writeStore(store, slug);
}

/** Clears one game's record, or everything when no slug is given. */
export function clearProgress(slug?: string) {
  if (slug) {
    const store = readStore();
    delete store[slug];
    writeStore(store, slug);
    return;
  }
  const storage = getStorage();
  try {
    storage?.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ProgressEventDetail>(PROGRESS_EVENT, { detail: { slug: null } }));
  }
}

/** Subscribe to progress changes in this tab and others. Returns an unsubscribe function. */
export function onProgressChange(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PROGRESS_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback);
    window.removeEventListener('storage', handleStorage);
  };
}

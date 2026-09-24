/**
 * Words for a player's per-device record (see progress.ts). Browser-safe: used by the
 * lid stamps, the game page's "Your record" panel, the home page and the library filter.
 */
import type { ProgressRecord } from './progress';

const number = new Intl.NumberFormat('en');

/** Rounds that ended without a win, loss or draw (a solved puzzle, a finished run). */
export function finishedRounds(record: ProgressRecord) {
  return Math.max(0, record.plays - record.wins - record.losses - record.draws);
}

/** The rubber stamp printed on a lid, or null when the game has never been played here. */
export function stampLabel(record: ProgressRecord | undefined) {
  if (!record || record.plays <= 0) return null;
  if (record.wins > 0) return `Won ×${number.format(record.wins)}`;

  const higherBests = Object.entries(record.best)
    .filter(([bucket, value]) => record.bestOrder[bucket] !== 'lower' && value > 0)
    .map(([, value]) => value);
  if (higherBests.length > 0) return `Best ${number.format(Math.max(...higherBests))}`;

  return record.plays === 1 ? 'Played' : `Played ×${number.format(record.plays)}`;
}

/** "Best" for the default bucket, "Best · hard" for named ones. */
export function bestLabel(bucket: string) {
  return bucket === 'default' ? 'Best' : `Best · ${bucket.replace(/[-_]+/g, ' ')}`;
}

/** One line: "5 rounds · 2 won · 3 lost". */
export function recordSummary(record: ProgressRecord) {
  const parts = [`${number.format(record.plays)} round${record.plays === 1 ? '' : 's'}`];
  if (record.wins) parts.push(`${number.format(record.wins)} won`);
  if (record.losses) parts.push(`${number.format(record.losses)} lost`);
  if (record.draws) parts.push(`${number.format(record.draws)} drawn`);
  const finished = finishedRounds(record);
  if (finished && finished !== record.plays) parts.push(`${number.format(finished)} finished`);
  return parts.join(' · ');
}

/** "today", "yesterday", "3 days ago", or a date for anything older than a month. */
export function formatLastPlayed(iso: string | undefined, now = new Date()) {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 30) return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-days, 'day');
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(then);
}

export { number as numberFormat };

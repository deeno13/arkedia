import { useCallback, useEffect, useState } from 'react';
import { getPref, onProgressChange, readProgress, setPref, type PrefValue, type ProgressRecord } from '../../../lib/progress';

/**
 * Live progress record for one game. Islands render with `client:only`, so reading
 * localStorage during the first render is safe.
 */
export function useProgress(slug: string): ProgressRecord {
  const [record, setRecord] = useState(() => readProgress(slug));
  useEffect(() => onProgressChange(() => setRecord(readProgress(slug))), [slug]);
  return record;
}

type WidenBoolean<T> = T extends boolean ? boolean : T;

/**
 * A remembered setting (difficulty, board size, mode) that persists per device.
 * `T` is deliberately unconstrained so an inferred fallback widens (`'1'` → string,
 * `false` → boolean); pass an explicit union (`usePref<Level>(…)`) to keep a narrow type.
 */
export function usePref<T>(
  slug: string,
  key: string,
  fallback: T & PrefValue,
): [WidenBoolean<T>, (value: WidenBoolean<T> & PrefValue) => void] {
  const [value, setValue] = useState(() => getPref<PrefValue>(slug, key, fallback) as WidenBoolean<T> & PrefValue);
  const update = useCallback(
    (next: WidenBoolean<T> & PrefValue) => {
      setValue(next);
      setPref(slug, key, next);
    },
    [slug, key],
  );
  return [value, update];
}

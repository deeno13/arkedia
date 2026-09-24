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

/** A remembered setting (difficulty, board size, mode) that persists per device. */
export function usePref<T extends PrefValue>(slug: string, key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => getPref(slug, key, fallback));
  const update = useCallback(
    (next: T) => {
      setValue(next);
      setPref(slug, key, next);
    },
    [slug, key],
  );
  return [value, update];
}

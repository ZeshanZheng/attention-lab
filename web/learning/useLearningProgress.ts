import { useEffect, useState } from 'react';
import { STORAGE_KEY, emptyProgress, parseProgress } from './progress.ts';
import type { LearningProgress } from './progress.ts';

function readProgress(): LearningProgress {
  try { return parseProgress(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return emptyProgress(); }
}

export function useLearningProgress() {
  const [progress, setProgress] = useState(readProgress);
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }, [progress]);
  return { progress, setProgress, storageAvailable };
}

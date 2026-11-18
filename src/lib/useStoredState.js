import { useEffect, useState } from 'react';

/**
 * useState that persists to localStorage, so the locally-hosted portal keeps
 * its data across reloads until the real backend is wired in.
 * Falls back silently if storage is unavailable or the stored value is corrupt.
 */
export function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      /* ignore corrupt or blocked storage */
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota or blocked storage */
    }
  }, [key, value]);

  return [value, setValue];
}

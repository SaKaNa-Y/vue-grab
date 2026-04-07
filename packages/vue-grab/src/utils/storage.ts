/** Safely read and parse a localStorage value. Returns null on any error. */
export function tryReadStorage<T>(key: string, parse: (raw: string) => T | null): T | null {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return parse(raw);
  } catch {
    return null;
  }
}

/** Safely write a string value to localStorage. Silently ignores errors. */
export function trySaveStorage(key: string, value: string): void {
  if (!key) return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

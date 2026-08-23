const STORAGE_KEY = 'hookguard.watch.identifier';

export function getWatchIdentifier(): string {
  if (typeof window === 'undefined') return 'anonymous';
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) return existing;
    const created = `hg_${crypto.randomUUID()}`;
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return 'anonymous';
  }
}

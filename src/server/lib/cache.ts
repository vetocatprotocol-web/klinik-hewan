/**
 * Simple in-memory TTL cache for server-side data.
 * Survives across requests within the same serverless instance.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 10_000; // 10 seconds

/**
 * Get cached data or compute and cache it.
 * @param key Unique cache key
 * @param fn Async function to compute the data if not cached
 * @param ttlMs Cache TTL in milliseconds (default 10s)
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.data as T;
  }

  const data = await fn();
  store.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Invalidate a specific cache key.
 */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/**
 * Clear all cache entries.
 */
export function clearAll(): void {
  store.clear();
}

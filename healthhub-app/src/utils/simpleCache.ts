/**
 * In-memory TTL cache.
 * Keys are namespaced strings. Values are stored until TTL expires or clear() is called.
 * Survives tab switches but resets on app reload (intended behavior).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const simpleCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  set<T>(key: string, value: T, ttlMs: number): void {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },

  delete(key: string): void {
    store.delete(key);
  },

  // Xoá tất cả keys có prefix (ví dụ: "fitness:" xoá fitness:week, fitness:plans, ...)
  deleteByPrefix(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};

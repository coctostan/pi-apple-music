import { CACHE_TTL_MS } from "./constants.js";

interface CacheEntry {
  data: string;
  timestamp: number;
}

export class LibraryCache {
  private entries = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor(ttlMs?: number) {
    this.ttlMs = ttlMs ?? CACHE_TTL_MS;
  }

  get(key: string): string | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttlMs) {
      this.entries.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: string): void {
    this.entries.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }

  oldestAge(): number | null {
    if (this.entries.size === 0) return null;
    let oldest = Infinity;
    for (const entry of this.entries.values()) {
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return Date.now() - oldest;
  }

  stats(): { entries: number; oldestAgeSec: number | null } {
    const age = this.oldestAge();
    return {
      entries: this.entries.size,
      oldestAgeSec: age !== null ? Math.round(age / 1000) : null,
    };
  }
}

export const libraryCache = new LibraryCache();

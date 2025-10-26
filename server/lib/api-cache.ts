// APICache - In-memory caching with TTL
export class APICache {
  private cache: Map<string, { data: any; expiry: number }>;
  private ttl: number;
  private maxSize: number;

  constructor(ttl = 30 * 60 * 1000, maxSize = 100) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { data, expiry: Date.now() + this.ttl });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

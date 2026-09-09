/**
 * Simple in-memory cache with TTL support for API responses
 * Improves perceived performance by returning cached data instantly
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  // Default TTLs in milliseconds
  static TTL = {
    PROFILE: 5 * 60 * 1000, // 5 minutes for user profile
    WALLET: 60 * 1000, // 1 minute for wallet data
    TRANSACTIONS: 30 * 1000, // 30 seconds for transactions
    NOTIFICATIONS: 30 * 1000, // 30 seconds for notifications
    CONFIG: 60 * 60 * 1000, // 1 hour for static config
  };

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = ApiCache.TTL.CONFIG): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove specific item from cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate all entries matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Generate cache key from endpoint and params
   */
  static generateKey(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }
    return `${endpoint}:${JSON.stringify(params)}`;
  }
}

// Singleton instance
export const apiCache = new ApiCache();

// Export TTL constants for convenience
export const CACHE_TTL = ApiCache.TTL;

export default apiCache;

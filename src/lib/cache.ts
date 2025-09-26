/**
 * Simple in-memory cache for database queries and API responses
 * In production, consider using Redis for distributed caching
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 1000 // Maximum number of cache entries
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }

    this.cache.set(key, entry)
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Evict oldest entries to make room
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Global cache instance
const cache = new MemoryCache()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000)

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Store in cache
  cache.set(key, data, ttl)

  return data
}

/**
 * Cache keys generator for consistent key naming
 */
export const cacheKeys = {
  products: {
    list: (page: number, limit: number, search?: string, category?: string) =>
      `products:list:${page}:${limit}:${search || ''}:${category || ''}`,
    detail: (id: string) => `products:detail:${id}`,
    count: (search?: string, category?: string) =>
      `products:count:${search || ''}:${category || ''}`
  },

  users: {
    list: (page: number, limit: number, search?: string, role?: string) =>
      `users:list:${page}:${limit}:${search || ''}:${role || ''}`,
    detail: (id: string) => `users:detail:${id}`,
    count: (search?: string, role?: string) =>
      `users:count:${search || ''}:${role || ''}`
  },

  workshops: {
    list: (userId?: string) => `workshops:list:${userId || 'all'}`,
    detail: (id: string) => `workshops:detail:${id}`,
    userWorkshops: (userId: string) => `workshops:user:${userId}`,
    reports: (workshopId?: string) => `workshops:reports:${workshopId || 'all'}`
  },

  participants: {
    byWorkshop: (workshopId: string) => `participants:workshop:${workshopId}`,
    list: (workshopId?: string) => `participants:list:${workshopId || 'all'}`
  },

  transactions: {
    byWorkshop: (workshopId: string) => `transactions:workshop:${workshopId}`,
    distributions: () => 'transactions:distributions'
  }
}

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  products: () => {
    const keys = cache.getStats().keys.filter(key => key.startsWith('products:'))
    keys.forEach(key => cache.delete(key))
  },

  users: () => {
    const keys = cache.getStats().keys.filter(key => key.startsWith('users:'))
    keys.forEach(key => cache.delete(key))
  },

  workshops: (workshopId?: string) => {
    if (workshopId) {
      const keys = cache.getStats().keys.filter(key =>
        key.includes(`workshop:${workshopId}`) || key.includes('workshops:')
      )
      keys.forEach(key => cache.delete(key))
    } else {
      const keys = cache.getStats().keys.filter(key => key.startsWith('workshops:'))
      keys.forEach(key => cache.delete(key))
    }
  },

  all: () => cache.clear()
}

// Export cacheUtils for compatibility
export const cacheUtils = {
  withCache,
  cacheKeys,
  invalidateCache,
  cache,
  getStats: () => cache.getStats(),
  clear: () => cache.clear()
}

export { cache }
export default cache
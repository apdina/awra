/**
 * Client-side cache for winning numbers with sophisticated caching strategy
 * 
 * Optimized for high-traffic winning numbers API:
 * - 48-hour cache duration (winning numbers set once per day)
 * - 96-hour stale-while-revalidate window
 * - Version-based invalidation
 * - Request deduplication
 */

interface WinningNumbersCache {
  data: any;
  timestamp: number;
  version: string;
  fetchPromise: Promise<any> | null;
}

const CACHE_DURATION = 48 * 60 * 60 * 1000; // 48 hours - winning numbers set once per day
const STALE_WHILE_REVALIDATE = 96 * 60 * 60 * 1000; // 96 hours - serve stale for 4 days

let cache: WinningNumbersCache = {
  data: null,
  timestamp: 0,
  version: '',
  fetchPromise: null,
};

/**
 * Get cached winning numbers
 * Returns null if cache is expired
 */
export function getCachedWinningNumbers(): any | null {
  if (!cache.data) return null;
  
  const age = Date.now() - cache.timestamp;
  
  // Return cached data if within cache duration
  if (age < CACHE_DURATION) {
    console.log(`📦 Winning numbers cache HIT (age: ${Math.round(age / 1000 / 60 / 60)}h)`);
    return cache.data;
  }
  
  // Return stale data if within stale-while-revalidate window
  if (age < STALE_WHILE_REVALIDATE) {
    console.log(`📦 Winning numbers cache STALE (age: ${Math.round(age / 1000 / 60 / 60)}h)`);
    return cache.data;
  }
  
  console.log(`❌ Winning numbers cache EXPIRED (age: ${Math.round(age / 1000 / 60 / 60)}h)`);
  return null;
}

/**
 * Set cached winning numbers with version
 */
export function setCachedWinningNumbers(data: any, version: string): void {
  cache.data = data;
  cache.timestamp = Date.now();
  cache.version = version;
  console.log('💾 Winning numbers cache updated with version:', version);
}

/**
 * Fetch winning numbers with request deduplication and version checking
 * Users should ALWAYS get data from cache, never directly from API
 */
export async function fetchWinningNumbersWithCache(): Promise<any> {
  // Check cache first
  const cached = getCachedWinningNumbers();
  if (cached) {
    // If cache is stale, trigger background refresh (but still serve cached data)
    const age = Date.now() - cache.timestamp;
    if (age >= CACHE_DURATION && age < STALE_WHILE_REVALIDATE && !cache.fetchPromise) {
      console.log('🔄 Triggering background refresh for stale winning numbers cache');
      cache.fetchPromise = fetch('/api/winning-numbers', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          // Extract version from response (should be included by API)
          const version = data.version || `${data.data?.[0]?.date}_${data.data?.[0]?.number}`;
          setCachedWinningNumbers(data, version);
          cache.fetchPromise = null;
          return data;
        })
        .catch(err => {
          console.error('Background refresh failed:', err);
          cache.fetchPromise = null;
          throw err;
        });
    }
    return cached;
  }

  // Request deduplication: if fetch is in progress, wait for it
  if (cache.fetchPromise) {
    console.log('⏳ Waiting for in-flight winning numbers fetch (request deduplication)');
    return cache.fetchPromise;
  }

  // No cache, no in-flight request - fetch fresh data (this should only happen once)
  console.log('⚠️ No cache exists - initial fetch (this should only happen once)');
  cache.fetchPromise = fetch('/api/winning-numbers', {
    credentials: 'include',
  })
    .then(res => res.json())
    .then(data => {
      // Extract version from response
      const version = data.version || `${data.data?.[0]?.date}_${data.data?.[0]?.number}`;
      setCachedWinningNumbers(data, version);
      cache.fetchPromise = null;
      return data;
    })
    .catch(err => {
      console.error('Fetch failed:', err);
      cache.fetchPromise = null;
      throw err;
    });

  return cache.fetchPromise;
}

/**
 * Invalidate winning numbers cache (call when admin sets new winning number)
 */
export function invalidateWinningNumbersCache(): void {
  console.log('🗑️ Winning numbers cache invalidated');
  cache = {
    data: null,
    timestamp: 0,
    version: '',
    fetchPromise: null,
  };
}

/**
 * Update cache optimistically (e.g., when winning number is announced via WebSocket)
 */
export function updateWinningNumbersCache(updates: Partial<any>): void {
  if (cache.data) {
    cache.data = { ...cache.data, ...updates };
    cache.timestamp = Date.now();
    console.log('✨ Winning numbers cache updated optimistically');
  }
}

/**
 * Check if cache version matches expected version
 */
export function isWinningNumbersCacheVersionValid(expectedVersion: string): boolean {
  return cache.version === expectedVersion;
}

/**
 * Get cache version
 */
export function getWinningNumbersCacheVersion(): string {
  return cache.version;
}

/**
 * Force refresh winning numbers cache
 */
export async function refreshWinningNumbersCache(): Promise<any> {
  invalidateWinningNumbersCache();
  return fetchWinningNumbersWithCache();
}

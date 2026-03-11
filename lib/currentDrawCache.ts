/**
 * Client-side cache for current draw data with optimistic updates
 * 
 * Optimized for spike load (1000 concurrent users during draw time)
 * - Aggressive caching (2 minutes)
 * - Stale-while-revalidate pattern
 * - Optimistic updates when winning number is announced
 * - WebSocket support for real-time updates
 */

interface CurrentDrawCache {
  data: any;
  timestamp: number;
  fetchPromise: Promise<any> | null;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - fetch once per session
const STALE_WHILE_REVALIDATE = 48 * 60 * 60 * 1000; // 48 hours - serve stale for 2 days

let cache: CurrentDrawCache = {
  data: null,
  timestamp: 0,
  fetchPromise: null,
};

// WebSocket for real-time updates
let websocket: WebSocket | null = null;
let websocketReconnectTimeout: NodeJS.Timeout | null = null;

/**
 * Connect to WebSocket for real-time winning number updates
 */
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/draw-updates`;
  
  websocket = new WebSocket(wsUrl);
  
  websocket.onopen = () => {
    console.log('WebSocket connected for draw updates');
  };
  
  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'winning-number-updated') {
        console.log('Received winning number update via WebSocket:', data);
        updateCurrentDrawCache({
          winning_number: data.winningNumber,
          is_processed: true
        });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };
  
  websocket.onclose = () => {
    console.log('WebSocket disconnected, reconnecting in 5 seconds...');
    websocketReconnectTimeout = setTimeout(connectWebSocket, 5000);
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

/**
 * Initialize WebSocket connection on client mount
 */
if (typeof window !== 'undefined') {
  // Only connect if not in production (dev mode) or if you have WebSocket setup
  // In production, use cache invalidation via API calls instead
  // connectWebSocket();
}

/**
 * Get cached current draw
 * Returns null if cache is expired
 */
export function getCachedCurrentDraw(): any | null {
  if (!cache.data) return null;
  
  const age = Date.now() - cache.timestamp;
  
  // Return cached data if within cache duration
  if (age < CACHE_DURATION) {
    console.log(`📦 Client cache HIT (age: ${Math.round(age / 1000)}s)`);
    return cache.data;
  }
  
  // Return stale data if within stale-while-revalidate window
  if (age < STALE_WHILE_REVALIDATE) {
    console.log(`📦 Client cache STALE (age: ${Math.round(age / 1000)}s)`);
    return cache.data;
  }
  
  console.log(`❌ Client cache EXPIRED (age: ${Math.round(age / 1000)}s)`);
  return null;
}

/**
 * Set cached current draw
 */
export function setCachedCurrentDraw(data: any): void {
  cache.data = data;
  cache.timestamp = Date.now();
  console.log('💾 Client cache updated');
}

/**
 * Fetch current draw with request deduplication
 * If a fetch is already in progress, wait for it instead of making a new request
 */
export async function fetchCurrentDrawWithCache(): Promise<any> {
  // Check cache first
  const cached = getCachedCurrentDraw();
  if (cached) {
    // If cache is stale, trigger background refresh
    const age = Date.now() - cache.timestamp;
    if (age >= CACHE_DURATION && age < STALE_WHILE_REVALIDATE && !cache.fetchPromise) {
      console.log('🔄 Triggering background refresh for stale cache');
      cache.fetchPromise = fetch('/api/current-draw', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setCachedCurrentDraw(data);
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
    console.log('⏳ Waiting for in-flight fetch (request deduplication)');
    return cache.fetchPromise;
  }

  // No cache, no in-flight request - fetch fresh data
  console.log('🔍 Fetching fresh current draw');
  cache.fetchPromise = fetch('/api/current-draw', {
    credentials: 'include',
  })
    .then(res => res.json())
    .then(data => {
      setCachedCurrentDraw(data);
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
 * Invalidate cache (call when winning number is announced)
 */
export function invalidateCurrentDrawCache(): void {
  console.log('🗑️ Client cache invalidated');
  cache = {
    data: null,
    timestamp: 0,
    fetchPromise: null,
  };
}

/**
 * Update cache optimistically (e.g., when winning number is announced via WebSocket)
 */
export function updateCurrentDrawCache(updates: Partial<any>): void {
  if (cache.data) {
    cache.data = { ...cache.data, ...updates };
    cache.timestamp = Date.now();
    console.log('✨ Client cache updated optimistically');
  }
}

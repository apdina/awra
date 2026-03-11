/**
 * Shared hook for current draw data with deduplication
 * Prevents multiple components from making duplicate API calls
 */

import { useState, useEffect, useCallback } from 'react';

interface Draw {
  id: string;
  draw_date: string;
  draw_time: string;
  winning_number: number | null;
  is_processed: boolean;
  status?: string;
  total_tickets?: number;
  current_pot?: number;
}

// Global state for sharing between components
let globalDrawData: Draw | null = null;
let globalFetchPromise: Promise<Draw> | null = null;
let globalLastFetch = 0;
let globalSubscribers = new Set<(draw: Draw | null) => void>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCurrentDrawShared(refreshInterval = 0) {
  const [draw, setDraw] = useState<Draw | null>(globalDrawData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to global updates
  useEffect(() => {
    const subscriber = (newDraw: Draw | null) => {
      setDraw(newDraw);
    };
    
    globalSubscribers.add(subscriber);
    
    // Set initial data
    if (globalDrawData) {
      setDraw(globalDrawData);
    }
    
    return () => {
      globalSubscribers.delete(subscriber);
    };
  }, []);

  const fetchDraw = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached data if fresh and not forcing refresh
    if (!forceRefresh && globalDrawData && (now - globalLastFetch) < CACHE_DURATION) {
      return globalDrawData;
    }

    // If already fetching, return the existing promise
    if (globalFetchPromise) {
      try {
        const result = await globalFetchPromise;
        return result;
      } catch {
        // If the fetch failed, try again
        globalFetchPromise = null;
      }
    }

    // Fetch fresh data
    setLoading(true);
    setError(null);
    
    globalFetchPromise = fetch('/api/current-draw')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        globalDrawData = data;
        globalLastFetch = Date.now();
        
        // Notify all subscribers
        globalSubscribers.forEach(subscriber => subscriber(data));
        
        return data;
      })
      .catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current draw';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
        globalFetchPromise = null;
      });

    try {
      const result = await globalFetchPromise;
      return result;
    } catch {
      // Return cached data if available, even if expired
      return globalDrawData;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!globalDrawData) {
      fetchDraw();
    }
  }, [fetchDraw]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!refreshInterval || refreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchDraw(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchDraw]);

  const refresh = useCallback(() => {
    return fetchDraw(true);
  }, [fetchDraw]);

  return {
    draw,
    loading,
    error,
    refresh,
  };
}

/**
 * Utility function to invalidate global cache
 * Call this when you know the data has changed
 */
export function invalidateCurrentDrawCache() {
  globalDrawData = null;
  globalLastFetch = 0;
  globalSubscribers.forEach(subscriber => subscriber(null));
}

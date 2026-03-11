/**
 * React hook for fetching current draw with optimized caching
 * Optimized for spike load (1000 concurrent users)
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentDrawWithCache, invalidateCurrentDrawCache } from '@/lib/currentDrawCache';

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

export function useCurrentDraw(autoRefresh = false, refreshInterval = 0) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDraw = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCurrentDrawWithCache();
      setDraw(data);
    } catch (err: any) {
      console.error('Failed to fetch current draw:', err);
      setError(err.message || 'Failed to fetch current draw');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDraw();
  }, [fetchDraw]);

  // Auto-refresh if enabled (default disabled for 24h cache)
  useEffect(() => {
    if (!autoRefresh || refreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchDraw();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDraw]);

  const refresh = useCallback(() => {
    invalidateCurrentDrawCache();
    return fetchDraw();
  }, [fetchDraw]);

  return {
    draw,
    loading,
    error,
    refresh,
  };
}

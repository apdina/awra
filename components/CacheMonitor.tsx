"use client";

import { useEffect, useState } from "react";

interface CacheStats {
  overview: {
    redisConnected: boolean;
    totalKeys: number;
    healthyKeys: number;
    issues: number;
    lastChecked: string;
  };
  categories: {
    currentDraw: { count: number; keys: any[] };
    winningNumbers: { count: number; keys: any[] };
    versions: { count: number; keys: any[] };
    locks: { count: number; keys: any[] };
    other: { count: number; keys: any[] };
  };
  performance: {
    avgWriteTime: number;
    avgReadTime: number;
    minWriteTime: number;
    maxWriteTime: number;
    minReadTime: number;
    maxReadTime: number;
  };
  health: {
    totalKeys: number;
    healthyKeys: number;
    expiredKeys: number;
    permanentKeys: number;
    issues: string[];
  };
  recommendations: string[];
}

export function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cache-monitor');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading && !stats) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Cache Monitor Error</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Redis Cache Monitor</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${stats.overview.redisConnected ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`text-sm font-medium ${stats.overview.redisConnected ? 'text-green-800' : 'text-red-800'}`}>
            Redis Status
          </div>
          <div className={`text-2xl font-bold ${stats.overview.redisConnected ? 'text-green-600' : 'text-red-600'}`}>
            {stats.overview.redisConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">Total Keys</div>
          <div className="text-2xl font-bold text-blue-600">{stats.overview.totalKeys}</div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-800">Healthy Keys</div>
          <div className="text-2xl font-bold text-green-600">{stats.overview.healthyKeys}</div>
        </div>
        
        <div className={`p-4 rounded-lg ${stats.overview.issues > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
          <div className={`text-sm font-medium ${stats.overview.issues > 0 ? 'text-yellow-800' : 'text-gray-800'}`}>
            Issues
          </div>
          <div className={`text-2xl font-bold ${stats.overview.issues > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
            {stats.overview.issues}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cache Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Current Draw</div>
            <div className="text-lg font-bold text-gray-800">{stats.categories.currentDraw.count}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Winning Numbers</div>
            <div className="text-lg font-bold text-gray-800">{stats.categories.winningNumbers.count}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Versions</div>
            <div className="text-lg font-bold text-gray-800">{stats.categories.versions.count}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Locks</div>
            <div className="text-lg font-bold text-gray-800">{stats.categories.locks.count}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Other</div>
            <div className="text-lg font-bold text-gray-800">{stats.categories.other.count}</div>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance (ms)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded">
            <div className="text-xs text-blue-600">Avg Write</div>
            <div className="text-lg font-bold text-blue-800">{stats.performance.avgWriteTime}</div>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <div className="text-xs text-green-600">Avg Read</div>
            <div className="text-lg font-bold text-green-800">{stats.performance.avgReadTime}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <div className="text-xs text-purple-600">Write Range</div>
            <div className="text-lg font-bold text-purple-800">
              {stats.performance.minWriteTime}-{stats.performance.maxWriteTime}
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded">
            <div className="text-xs text-orange-600">Read Range</div>
            <div className="text-lg font-bold text-orange-800">
              {stats.performance.minReadTime}-{stats.performance.maxReadTime}
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {stats.health.issues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Issues Detected</h3>
          <ul className="list-disc list-inside space-y-1">
            {stats.health.issues.map((issue, index) => (
              <li key={index} className="text-red-600">{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h3>
        <ul className="list-disc list-inside space-y-1">
          {stats.recommendations.map((rec, index) => (
            <li key={index} className="text-gray-600">{rec}</li>
          ))}
        </ul>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-right">
        Last updated: {new Date(stats.overview.lastChecked).toLocaleString()}
      </div>
    </div>
  );
}

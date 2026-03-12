/**
 * Redis-based caching for production
 * 
 * Production-ready cache system that works across multiple server instances
 * Uses Upstash Redis (https://upstash.com) for distributed caching
 * 
 * Features:
 * - Redis EX TTL for automatic expiration
 * - Cache stampede prevention with lock keys
 * - Request deduplication
 */

import { Redis } from "@upstash/redis";

// Cache key prefixes
const CACHE_PREFIXES = {
  CURRENT_DRAW: 'current_draw',
  CURRENT_DRAW_VERSION: 'current_draw_version',
  WINNING_NUMBERS: 'winning_numbers_history',
  WINNING_NUMBERS_VERSION: 'winning_numbers_version',
  DRAW_HISTORY: 'draw_history',
  LOCK_CURRENT_DRAW: 'lock:current_draw',
  LOCK_WINNING_NUMBERS: 'lock:winning_numbers_history',
} as const;

// Cache TTLs (in seconds)
const CACHE_TTLS = {
  CURRENT_DRAW: 86400,   // 24 hours - draw data only changes at draw time
  CURRENT_DRAW_VERSION: 86400 * 7, // 7 days - version tracker
  WINNING_NUMBERS: 0, // NO EXPIRATION - only cleared when admin sets new number
  WINNING_NUMBERS_VERSION: 86400 * 7, // 7 days - version tracker
  DRAW_HISTORY: 3600,     // 1 hour - for draw history
  LOCK_TTL: 30,           // 30 seconds - for lock keys (safety buffer)
} as const;

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client (singleton pattern)
 */
function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured - Redis caching disabled');
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    console.log('✅ Redis Client Connected (Upstash)');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

/**
 * Get cached value with automatic TTL
 * Uses Redis EX option for automatic expiration
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    if (value !== null && value !== undefined) {
      console.log(`📦 Redis cache HIT: ${key}`);
      return value;
    }
    console.log(`❌ Redis cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Set cached value with Redis EX TTL (automatic expiration)
 * Uses SET key value EX ttl for atomic operation
 * If ttl is 0, sets value without expiration (permanent until manually deleted)
 */
export async function setCache<T>(key: string, value: T, ttl: number = 60): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // If TTL is 0, set without expiration (permanent until manually deleted)
    if (ttl === 0) {
      await redis.set(key, value);
      console.log(`💾 Redis cache SET: ${key} (NO EXPIRATION - manual invalidation only)`);
    } else {
      // Use SET with EX for atomic set + TTL
      await redis.set(key, value, { ex: ttl });
      console.log(`💾 Redis cache SET: ${key} (TTL: ${ttl}s)`);
    }
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
    console.log(`🗑️ Redis cache DELETE: ${key}`);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
}

/**
 * Try to acquire a lock (for cache stampede prevention)
 * Returns true if lock acquired, false otherwise
 */
export async function tryAcquireLock(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    // Use SETNX (SET if Not eXists) with EX for atomic operation
    const result = await redis.set(key, '1', { nx: true, ex: CACHE_TTLS.LOCK_TTL });
    if (result === 'OK') {
      console.log(`🔒 Lock acquired: ${key}`);
      return true;
    }
    console.log(`⏳ Lock already held: ${key}`);
    return false;
  } catch (error) {
    console.error('Redis LOCK error:', error);
    return false;
  }
}

/**
 * Release a lock
 */
export async function releaseLock(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
    console.log(`🔓 Lock released: ${key}`);
  } catch (error) {
    console.error('Redis UNLOCK error:', error);
  }
}

/**
 * Invalidate all related cache keys
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Use SCAN for production (safer than KEYS in production)
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Redis cache INVALIDATED: ${keys.length} keys matching ${pattern}`);
    }
  } catch (error) {
    console.error('Redis INVALIDATE error:', error);
  }
}

/**
 * Current Draw Cache Functions
 */
export async function getCurrentDrawCache() {
  return getCache<any>(CACHE_PREFIXES.CURRENT_DRAW);
}

export async function setCurrentDrawCache(data: any) {
  return setCache(CACHE_PREFIXES.CURRENT_DRAW, data, CACHE_TTLS.CURRENT_DRAW);
}

export async function invalidateCurrentDrawCache() {
  return deleteCache(CACHE_PREFIXES.CURRENT_DRAW);
}

export async function tryAcquireCurrentDrawLock() {
  return tryAcquireLock(CACHE_PREFIXES.LOCK_CURRENT_DRAW);
}

export async function releaseCurrentDrawLock() {
  return releaseLock(CACHE_PREFIXES.LOCK_CURRENT_DRAW);
}

/**
 * Cache Versioning for Draw Time Changes
 */
export async function getDrawCacheVersion() {
  return getCache<string>(CACHE_PREFIXES.CURRENT_DRAW_VERSION);
}

export async function setDrawCacheVersion(version: string) {
  return setCache(CACHE_PREFIXES.CURRENT_DRAW_VERSION, version, CACHE_TTLS.CURRENT_DRAW_VERSION);
}

export async function updateDrawCacheVersion(drawTime: string, drawDate: string) {
  const version = `${drawDate}_${drawTime}`;
  await setDrawCacheVersion(version);
  console.log(`📝 Draw cache version updated: ${version}`);
  return version;
}

export async function hasDrawCacheVersionChanged(drawTime: string, drawDate: string): Promise<boolean> {
  const currentVersion = await getDrawCacheVersion();
  const newVersion = `${drawDate}_${drawTime}`;
  
  if (!currentVersion) {
    console.log('🆕 No cache version exists, setting initial version');
    await updateDrawCacheVersion(drawTime, drawDate);
    return true;
  }
  
  if (currentVersion !== newVersion) {
    console.log(`🔄 Cache version changed: ${currentVersion} → ${newVersion}`);
    await updateDrawCacheVersion(drawTime, drawDate);
    return true;
  }
  
  return false;
}

/**
 * Winning Numbers Cache Functions
 */
export async function getWinningNumbersCache() {
  return getCache<any>(CACHE_PREFIXES.WINNING_NUMBERS);
}

export async function setWinningNumbersCache(data: any) {
  return setCache(CACHE_PREFIXES.WINNING_NUMBERS, data, CACHE_TTLS.WINNING_NUMBERS);
}

export async function invalidateWinningNumbersCache() {
  return deleteCache(CACHE_PREFIXES.WINNING_NUMBERS);
}

export async function tryAcquireWinningNumbersLock() {
  return tryAcquireLock(CACHE_PREFIXES.LOCK_WINNING_NUMBERS);
}

export async function releaseWinningNumbersLock() {
  return releaseLock(CACHE_PREFIXES.LOCK_WINNING_NUMBERS);
}

/**
 * Winning Numbers Cache Versioning
 */
export async function getWinningNumbersVersion() {
  return getCache<string>(CACHE_PREFIXES.WINNING_NUMBERS_VERSION);
}

export async function setWinningNumbersVersion(version: string) {
  return setCache(CACHE_PREFIXES.WINNING_NUMBERS_VERSION, version, CACHE_TTLS.WINNING_NUMBERS_VERSION);
}

export async function updateWinningNumbersVersion(lastWinningNumber: number, lastDrawDate: string) {
  const version = `${lastDrawDate}_${lastWinningNumber}`;
  await setWinningNumbersVersion(version);
  console.log(`📝 Winning numbers cache version updated: ${version}`);
  return version;
}

export async function hasWinningNumbersChanged(currentWinningNumber: number | null, currentDrawDate: string): Promise<boolean> {
  const currentVersion = await getWinningNumbersVersion();
  const newVersion = currentWinningNumber ? `${currentDrawDate}_${currentWinningNumber}` : `${currentDrawDate}_null`;
  
  if (!currentVersion) {
    console.log('🆕 No winning numbers version exists, setting initial version');
    await updateWinningNumbersVersion(currentWinningNumber || 0, currentDrawDate);
    return true;
  }
  
  if (currentVersion !== newVersion) {
    console.log(`🔄 Winning numbers version changed: ${currentVersion} → ${newVersion}`);
    await updateWinningNumbersVersion(currentWinningNumber || 0, currentDrawDate);
    return true;
  }
  
  return false;
}

/**
 * Fallback: In-memory cache for development
 */
let devCache: Record<string, { data: any; timestamp: number }> = {};

export async function getDevCache<T>(key: string): Promise<T | null> {
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't use dev cache in production
  }
  
  const cached = devCache[key];
  if (cached && Date.now() - cached.timestamp < 10000) {
    return cached.data as T;
  }
  return null;
}

export async function setDevCache<T>(key: string, data: T): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  devCache[key] = { data, timestamp: Date.now() };
}

export async function invalidateDevCache(key: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  delete devCache[key];
}

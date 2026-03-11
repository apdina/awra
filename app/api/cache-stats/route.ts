import { NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";
import { logger } from '@/lib/logger';

/**
 * API endpoint to monitor Redis cache performance
 * Call this endpoint to see cache statistics and health
 */
export async function GET() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Get all cache keys
    const allKeys = await redis.keys('*');
    
    // Get info about each key
    const cacheInfo = await Promise.all(
      allKeys.map(async (key) => {
        const ttl = await redis.ttl(key);
        const type = await redis.type(key);
        
        return {
          key,
          ttl,
          type,
          sizeBytes: -1, // Upstash Redis doesn't support memory usage command
          isExpired: ttl === -2,
          hasNoExpiry: ttl === -1,
        };
      })
    );

    // Calculate statistics
    const stats = {
      totalKeys: allKeys.length,
      expiredKeys: cacheInfo.filter(info => info.isExpired).length,
      keysWithNoExpiry: cacheInfo.filter(info => info.hasNoExpiry).length,
      totalMemoryUsage: 0, // Upstash Redis doesn't provide memory usage
      cacheKeys: cacheInfo,
      redisConnected: true,
      timestamp: new Date().toISOString(),
    };

    // Test cache performance
    const performanceTest = await testCachePerformance(redis);

    return NextResponse.json({
      ...stats,
      performance: performanceTest,
    });

  } catch (error) {
    logger.error('Cache stats error:', error);
    return NextResponse.json({
      error: 'Failed to get cache stats',
      redisConnected: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * Test cache read/write performance
 */
async function testCachePerformance(redis: Redis) {
  const testKey = 'cache_performance_test';
  const testValue = { timestamp: Date.now(), data: 'test' };
  
  const results = {
    writeTime: 0,
    readTime: 0,
    deleteTime: 0,
    success: false,
  };

  try {
    // Test write
    const writeStart = Date.now();
    await redis.set(testKey, testValue, { ex: 60 });
    results.writeTime = Date.now() - writeStart;

    // Test read
    const readStart = Date.now();
    const readValue = await redis.get(testKey);
    results.readTime = Date.now() - readStart;

    // Test delete
    const deleteStart = Date.now();
    await redis.del(testKey);
    results.deleteTime = Date.now() - deleteStart;

    results.success = readValue !== null;

  } catch (error) {
    logger.error('Performance test error:', error);
  }

  return results;
}

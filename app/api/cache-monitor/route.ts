import { NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";

/**
 * Comprehensive cache monitoring endpoint
 * Provides detailed insights into cache performance and effectiveness
 */
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const detailed = searchParams.get('detailed') === 'true';
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Get all keys with detailed info
    const allKeys = await redis.keys('*');
    const keyDetails = await Promise.all(
      allKeys.map(async (key) => {
        const ttl = await redis.ttl(key);
        const type = await redis.type(key);
        let sample = null;
        
        // Get sample data for small keys
        if (type === 'string') {
          const value = await redis.get(key);
          if (value && typeof value === 'string' && value.length < 200) {
            try {
              sample = JSON.parse(value);
            } catch {
              sample = value.substring(0, 100);
            }
          }
        }
        
        return {
          key,
          ttl,
          type,
          sample,
          isExpired: ttl === -2,
          hasNoExpiry: ttl === -1,
          expiresIn: ttl > 0 ? `${ttl}s` : 'expired/none',
        };
      })
    );

    // Categorize keys
    const categorized = {
      currentDraw: keyDetails.filter(k => k.key.includes('current_draw')),
      winningNumbers: keyDetails.filter(k => k.key.includes('winning_numbers')),
      versions: keyDetails.filter(k => k.key.includes('version')),
      locks: keyDetails.filter(k => k.key.includes('lock')),
      other: keyDetails.filter(k => 
        !k.key.includes('current_draw') && 
        !k.key.includes('winning_numbers') && 
        !k.key.includes('version') && 
        !k.key.includes('lock')
      ),
    };

    // Performance metrics
    const performance = await measurePerformance(redis);

    // Cache health indicators
    const health = {
      totalKeys: allKeys.length,
      healthyKeys: keyDetails.filter(k => !k.isExpired && k.ttl > 0).length,
      expiredKeys: keyDetails.filter(k => k.isExpired).length,
      permanentKeys: keyDetails.filter(k => k.hasNoExpiry).length,
      issues: [] as string[],
    };

    // Identify potential issues
    if (health.expiredKeys > 0) {
      health.issues.push(`${health.expiredKeys} expired keys still exist`);
    }
    if (health.permanentKeys > 2) {
      health.issues.push(`${health.permanentKeys} keys have no expiry (potential memory leak)`);
    }
    if (performance.avgWriteTime > 500) {
      health.issues.push('Slow write performance detected');
    }
    if (performance.avgReadTime > 200) {
      health.issues.push('Slow read performance detected');
    }

    const response = {
      overview: {
        redisConnected: true,
        totalKeys: health.totalKeys,
        healthyKeys: health.healthyKeys,
        issues: health.issues.length,
        lastChecked: new Date().toISOString(),
      },
      categories: {
        currentDraw: {
          count: categorized.currentDraw.length,
          keys: detailed ? categorized.currentDraw : categorized.currentDraw.map(k => ({ key: k.key, ttl: k.ttl })),
        },
        winningNumbers: {
          count: categorized.winningNumbers.length,
          keys: detailed ? categorized.winningNumbers : categorized.winningNumbers.map(k => ({ key: k.key, ttl: k.ttl })),
        },
        versions: {
          count: categorized.versions.length,
          keys: detailed ? categorized.versions : categorized.versions.map(k => ({ key: k.key, ttl: k.ttl })),
        },
        locks: {
          count: categorized.locks.length,
          keys: detailed ? categorized.locks : categorized.locks.map(k => ({ key: k.key, ttl: k.ttl })),
        },
        other: {
          count: categorized.other.length,
          keys: detailed ? categorized.other : categorized.other.map(k => ({ key: k.key, ttl: k.ttl })),
        },
      },
      performance,
      health,
      recommendations: generateRecommendations(health, performance, categorized),
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Cache monitor error:', error);
    return NextResponse.json({
      error: 'Failed to monitor cache',
      redisConnected: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function measurePerformance(redis: Redis) {
  const testKey = 'performance_test_' + Date.now();
  const testValue = { test: true, timestamp: Date.now() };
  
  const measurements = {
    writeTimes: [] as number[],
    readTimes: [] as number[],
  };

  // Measure multiple operations
  for (let i = 0; i < 5; i++) {
    // Write test
    const writeStart = Date.now();
    await redis.set(testKey + '_' + i, testValue, { ex: 30 });
    measurements.writeTimes.push(Date.now() - writeStart);

    // Read test
    const readStart = Date.now();
    await redis.get(testKey + '_' + i);
    measurements.readTimes.push(Date.now() - readStart);
  }

  // Cleanup
  for (let i = 0; i < 5; i++) {
    await redis.del(testKey + '_' + i);
  }

  return {
    avgWriteTime: Math.round(measurements.writeTimes.reduce((a, b) => a + b, 0) / measurements.writeTimes.length),
    avgReadTime: Math.round(measurements.readTimes.reduce((a, b) => a + b, 0) / measurements.readTimes.length),
    minWriteTime: Math.min(...measurements.writeTimes),
    maxWriteTime: Math.max(...measurements.writeTimes),
    minReadTime: Math.min(...measurements.readTimes),
    maxReadTime: Math.max(...measurements.readTimes),
  };
}

function generateRecommendations(health: any, performance: any, categorized: any) {
  const recommendations = [];

  // Cache size recommendations
  if (health.totalKeys > 50) {
    recommendations.push("Consider implementing cache key rotation to reduce memory usage");
  }

  // Performance recommendations
  if (performance.avgWriteTime > 200) {
    recommendations.push("Write performance is slow - consider batching operations or using a faster Redis provider");
  }

  if (performance.avgReadTime > 100) {
    recommendations.push("Read performance is slow - consider optimizing data structures or reducing payload sizes");
  }

  // Cache strategy recommendations
  if (categorized.currentDraw.length === 0) {
    recommendations.push("Current draw cache is empty - users may experience slower load times");
  }

  if (categorized.winningNumbers.length === 0) {
    recommendations.push("Winning numbers cache is empty - consider pre-warming this cache");
  }

  // TTL recommendations
  if (health.permanentKeys > 0) {
    recommendations.push("Some keys have no TTL - set appropriate expiration times to prevent memory leaks");
  }

  // Lock recommendations
  if (categorized.locks.length > 2) {
    recommendations.push("Multiple lock keys detected - ensure locks are being released properly");
  }

  if (recommendations.length === 0) {
    recommendations.push("Cache configuration looks healthy!");
  }

  return recommendations;
}

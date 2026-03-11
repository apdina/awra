import { NextRequest } from 'next/server';
import { createClient } from 'redis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime?: number;
  totalRequests?: number;
}

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });

      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisClient = null;
    }
  }
  return redisClient;
}

/**
 * Redis-based rate limiting for production
 */
export async function createRedisRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest, identifier?: string): Promise<RateLimitResult> => {
    const key = identifier || 
                request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redisKey = `rate_limit:${key}`;
    
    try {
      const redis = await getRedisClient();
      
      if (!redis) {
        // Fallback to in-memory if Redis is not available
        return createMemoryRateLimit(config)(request, identifier);
      }

      // Use Redis pipeline for atomic operations
      const pipeline = redis.multi();
      
      // Remove old entries outside the window
      pipeline.zRemRangeByScore(redisKey, 0, windowStart);
      
      // Add current request
      pipeline.zAdd(redisKey, { score: now, value: `${now}-${Math.random()}` });
      
      // Count current requests
      pipeline.zCard(redisKey);
      
      // Set expiration for cleanup
      pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline failed');
      }
      
      const currentCount = (results[2] as any) as number;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const success = currentCount <= config.maxRequests;
      
      return {
        success,
        remaining,
        totalRequests: currentCount,
        resetTime: now + config.windowMs
      };
      
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fallback to in-memory rate limiting
      return createMemoryRateLimit(config)(request, identifier);
    }
  };
}

/**
 * In-memory rate limiting for development/fallback
 */
export function createMemoryRateLimit(config: RateLimitConfig) {
  const rateLimitStore = new Map<string, { count: number; resetTime: number; requests: number[] }>();
  
  return (request: NextRequest, identifier?: string): RateLimitResult => {
    const key = identifier || 
                request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        requests: [now],
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(key, entry);
      return {
        success: true,
        remaining: config.maxRequests - 1,
        totalRequests: 1,
        resetTime: entry.resetTime
      };
    }
    
    // Remove old requests outside the window
    entry.requests = entry.requests.filter(timestamp => timestamp > now - config.windowMs);
    entry.count = entry.requests.length;
    
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        totalRequests: entry.count,
        resetTime: entry.resetTime
      };
    }
    
    // Add current request
    entry.requests.push(now);
    entry.count++;
    
    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      totalRequests: entry.count,
      resetTime: entry.resetTime
    };
  };
}

/**
 * Adaptive rate limiting that chooses Redis or in-memory based on environment
 */
export function createAdaptiveRateLimit(config: RateLimitConfig): (request: NextRequest, identifier?: string) => Promise<RateLimitResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedisUrl = !!process.env.REDIS_URL;
  
  if (isProduction && hasRedisUrl) {
    console.log('Using Redis-based rate limiting for production');
    // Return a wrapper function that handles the async Redis call
    return async (request: NextRequest, identifier?: string): Promise<RateLimitResult> => {
      const redisLimiter = await createRedisRateLimit(config);
      return redisLimiter(request, identifier);
    };
  } else {
    console.log('Using in-memory rate limiting for development');
    const memoryLimiter = createMemoryRateLimit(config);
    // Wrap the sync function to make it async for consistency
    return async (request: NextRequest, identifier?: string): Promise<RateLimitResult> => {
      return memoryLimiter(request, identifier);
    };
  }
}

// Pre-configured rate limiters
export const authLimiter = createAdaptiveRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per window
});

export const apiLimiter = createAdaptiveRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
});

export const purchaseLimiter = createAdaptiveRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3 // 3 purchases per minute
});

export const uploadLimiter = createAdaptiveRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 uploads per minute
});

/**
 * Rate limiting middleware wrapper for API routes
 */
export function withRateLimit(
  rateLimiter: ReturnType<typeof createAdaptiveRateLimit>,
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    const rateLimitResult = await rateLimiter(request);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Limit': rateLimitResult.totalRequests?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
            'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    const response = await handler(request, ...args);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Limit', rateLimitResult.totalRequests?.toString() || '0');
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime?.toString() || '');
    
    return response;
  };
}

import { NextRequest } from 'next/server';

// Re-export the enhanced rate limiting system
export {
  createAdaptiveRateLimit,
  createRedisRateLimit,
  createMemoryRateLimit,
  withRateLimit,
  authLimiter,
  apiLimiter,
  purchaseLimiter,
  uploadLimiter,
  type RateLimitConfig,
  type RateLimitResult
} from './rateLimit-redis';

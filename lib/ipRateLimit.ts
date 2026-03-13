/**
 * IP-based Rate Limiting
 * 
 * Protects endpoints from abuse before authentication
 * Uses in-memory storage (consider Redis for production multi-instance)
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage (per instance)
// For multi-instance production, use Redis
const ipLimits = new Map<string, RateLimitEntry>();

/**
 * Get client IP address (proxy-aware)
 */
export function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for (most common proxy header)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Try x-real-ip (nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Try cf-connecting-ip (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }
  
  // Try Vercel geo data (cast to any to access Vercel-specific properties)
  const geo = (request as any).geo?.ip;
  if (geo) {
    return geo;
  }
  
  // Fallback to unknown
  return 'unknown';
}

/**
 * Check IP rate limit
 * 
 * @param ip - Client IP address
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function checkIpRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): { 
  allowed: boolean; 
  remaining: number; 
  resetAt: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = ipLimits.get(ip);
  
  // Periodic cleanup (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now);
  }
  
  // No entry or expired window - create new
  if (!entry || entry.resetAt < now) {
    ipLimits.set(ip, {
      count: 1,
      resetAt: now + windowMs
    });
    return { 
      allowed: true, 
      remaining: maxRequests - 1, 
      resetAt: now + windowMs 
    };
  }
  
  // Limit exceeded
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: entry.resetAt,
      retryAfter
    };
  }
  
  // Increment count
  entry.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - entry.count, 
    resetAt: entry.resetAt 
  };
}

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(now: number): void {
  let cleaned = 0;
  for (const [key, value] of ipLimits.entries()) {
    if (value.resetAt < now) {
      ipLimits.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired IP rate limit entries`);
  }
}

/**
 * Get rate limit stats (for monitoring)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeIps: string[];
} {
  const now = Date.now();
  const activeIps: string[] = [];
  
  for (const [ip, entry] of ipLimits.entries()) {
    if (entry.resetAt >= now) {
      activeIps.push(ip);
    }
  }
  
  return {
    totalEntries: ipLimits.size,
    activeIps
  };
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  ipLimits.clear();
  console.log('🗑️ Cleared all IP rate limits');
}

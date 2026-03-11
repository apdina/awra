import { NextRequest, NextResponse } from 'next/server';
import { invalidateDrawCache } from '@/app/api/current-draw/route';
import { invalidateWinningNumbersCache } from '@/app/api/winning-numbers/route';
import { invalidateCurrentDrawCache, invalidateWinningNumbersCache as invalidateWinningNumbersCacheRedis } from '@/lib/redis-cache';
import { getAdminSecret } from '@/lib/admin-secrets';
import { logger } from '@/lib/logger';

/**
 * Admin endpoint to invalidate all caches
 * Call this after setting a winning number to force fresh data
 * 
 * Production: Uses Redis for global cache invalidation across all instances
 * Development: Falls back to in-memory cache invalidation
 */
export async function POST(request: NextRequest) {
  try {
    // Get admin secret from Convex
    const adminSecretValue = await getAdminSecret();
    
    // Verify admin secret
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    
    if (adminSecret !== adminSecretValue) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Invalidate Redis cache
    try {
      await invalidateCurrentDrawCache();
      await invalidateWinningNumbersCacheRedis();
      logger.log('✅ Redis caches invalidated');
    } catch (redisError) {
      logger.error('❌ Redis cache invalidation failed:', redisError);
    }

    // Invalidate in-memory caches
    invalidateDrawCache();
    invalidateWinningNumbersCache();

    logger.log('✅ All caches invalidated via /api/invalidate-cache');

    return NextResponse.json({
      success: true,
      message: 'All caches invalidated'
    });
  } catch (error) {
    logger.error('Failed to invalidate caches:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate caches' },
      { status: 500 }
    );
  }
}

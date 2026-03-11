import { NextRequest, NextResponse } from 'next/server';
import { invalidateDrawCache } from '@/app/api/current-draw/route';
import { invalidateWinningNumbersCache } from '@/app/api/winning-numbers/route';
import { invalidateCurrentDrawCache, invalidateWinningNumbersCache as invalidateWinningNumbersCacheRedis } from '@/lib/redis-cache';

/**
 * Admin endpoint to invalidate all caches
 * Protected with Bearer token authorization
 * 
 * Usage: POST /api/admin/invalidate-cache
 * Headers:
 *   Authorization: Bearer INTERNAL_SECRET
 * 
 * Production: Uses Redis for global cache invalidation across all instances
 * Development: Falls back to in-memory cache invalidation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token authorization
    const authHeader = request.headers.get('Authorization');
    const INTERNAL_SECRET = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token !== INTERNAL_SECRET) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
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

    logger.log('✅ All caches invalidated via /api/admin/invalidate-cache');

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

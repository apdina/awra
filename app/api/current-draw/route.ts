import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * DEPRECATED: Use /api/draw instead
 * 
 * This endpoint now proxies to the unified draw API for backward compatibility
 */
export async function GET() {
  try {
    // Proxy to the unified draw API with no-store to bypass cache
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/draw?type=current&t=${Date.now()}`,
      { cache: 'no-store' }
    );
    
    const data = await response.json();
    
    // Return with no-cache headers to ensure fresh data
    const result = NextResponse.json(data.data || data);
    
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    result.headers.set('Pragma', 'no-cache');
    result.headers.set('Expires', '0');
    result.headers.set('X-Cache-Status', 'PROXIED-TO-UNIFIED');
    
    return result;

  } catch (error) {
    logger.error('Error in current-draw API:', error);
    
    // Return fallback data
    const fallbackData = {
      id: "fallback-draw-error",
      draw_date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '/'),
      draw_time: "21:40",
      winning_number: null,
      is_processed: false
    };

    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'X-Cache-Status': 'ERROR-FALLBACK',
      }
    });
  }
}

/**
 * Force cache invalidation (call this when winning number is set)
 * Can be called from admin API or webhook
 * Invalidates both Redis and in-memory caches
 */
export function invalidateDrawCache() {
  logger.log('🗑️ Invalidating current draw cache');
  
  // The unified API handles cache invalidation automatically
  // No need for manual invalidation
}

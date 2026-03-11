import { NextRequest, NextResponse } from 'next/server';
import { getWinningNumbersHybrid } from '@/lib/convex-data-fetching';
import { 
  getWinningNumbersCache, 
  setWinningNumbersCache, 
  invalidateWinningNumbersCache as invalidateWinningNumbersCacheRedis,
  getDevCache,
  setDevCache,
  invalidateDevCache,
  tryAcquireWinningNumbersLock,
  releaseWinningNumbersLock,
  hasWinningNumbersChanged,
  updateWinningNumbersVersion
} from '@/lib/redis-cache';

// Sophisticated caching for high-traffic winning numbers API
// Winning numbers are set once per day by admin, so we can cache for 48 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6'); // Default 6 entries (6 days of play per week)

    // ALWAYS SERVE FROM REDIS CACHE - Users should never hit Convex directly
    if (page === 1) {
      const redisCached = await getWinningNumbersCache();
      if (redisCached) {
        logger.log('📦 Serving winning numbers from Redis cache (users only get from cache)');
        return NextResponse.json(redisCached, {
          headers: {
            'Cache-Control': 'public, s-maxage=172800, stale-while-revalidate=345600',
            'X-Cache-Status': 'HIT-REDIS',
            'X-Data-Source': 'cache-only'
          }
        });
      }

      // Fallback to in-memory cache (development)
      const memoryCached = await getDevCache('winning_numbers');
      if (memoryCached) {
        logger.log('📦 Serving winning numbers from memory cache (users only get from cache)');
        return NextResponse.json(memoryCached, {
          headers: {
            'Cache-Control': 'public, s-maxage=172800, stale-while-revalidate=345600',
            'X-Cache-Status': 'HIT-MEMORY',
            'X-Data-Source': 'cache-only'
          }
        });
      }
    }

    // IF NO CACHE EXISTS - This should only happen after initial deployment
    logger.log('⚠️ No cache exists - fetching fresh data (this should only happen once)');
    
    // Use Redis lock for distributed deduplication (stampede prevention)
    const lockAcquired = await tryAcquireWinningNumbersLock();
    
    if (!lockAcquired) {
      // Another instance is fetching - wait for it via Redis cache
      logger.log('⏳ Waiting for another instance to fetch (Redis lock held)');
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryCached = await getWinningNumbersCache();
      if (retryCached) {
        return NextResponse.json(retryCached, {
          headers: {
            'Cache-Control': 'public, s-maxage=172800, stale-while-revalidate=345600',
            'X-Cache-Status': 'HIT-REDIS-WAIT',
            'X-Data-Source': 'cache-only'
          }
        });
      }
    }

    try {
      // Get winning numbers from Convex (initial fetch only)
      const draws = await getWinningNumbersHybrid(limit * page); // Get enough for all pages
      
      // Apply pagination manually
      const offset = (page - 1) * limit;
      const paginatedDraws = draws.slice(offset, offset + limit);
      
      // Convert Convex data to expected format
      const formattedEntries = paginatedDraws.map((draw: any) => {
        // Parse date from DD/MM/YYYY format
        const [day, month, year] = draw.draw_date.split('/');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        return {
          day: dayOfWeek,
          date: draw.draw_date,
          number: draw.winning_number
        };
      });

      const responseData = {
        data: formattedEntries,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(draws.length / limit),
          totalEntries: draws.length,
          hasNextPage: page * limit < draws.length,
          hasPreviousPage: page > 1
        },
        // Include version for client-side cache validation
        version: draws.length > 0 ? `${draws[0].draw_date}_${draws[0].winning_number}` : 'no_data',
        lastUpdated: Date.now()
      };

      // Cache the response for first page (both Redis and memory)
      if (page === 1) {
        await setWinningNumbersCache(responseData);
        await setDevCache('winning_numbers', responseData);
        
        // Update version tracking
        const latestWinningNumber = draws.length > 0 ? draws[0].winning_number : null;
        const latestDrawDate = draws.length > 0 ? draws[0].draw_date : new Date().toLocaleDateString('en-GB');
        await updateWinningNumbersVersion(latestWinningNumber || 0, latestDrawDate);
        
        logger.log('� Initial cache created for 48 hours (Redis + Memory)');
      }

      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'public, s-maxage=172800, stale-while-revalidate=345600', // 48h + 96h SWR
          'X-Cache-Status': 'INITIAL-FETCH',
          'X-Data-Version': responseData.version,
          'X-Data-Source': 'cache-only'
        }
      });
    } finally {
      await releaseWinningNumbersLock(); // Always release lock
    }
  } catch (error) {
    logger.error('Failed to fetch winning numbers from Convex:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winning numbers' },
      { status: 500 }
    );
  }
}

// POST /api/winning-numbers - Add new winning number
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement Convex write operation
    return NextResponse.json(
      { error: 'Write operations not yet implemented for Convex' },
      { status: 501 }
    );
  } catch (error) {
    logger.error('Failed to add winning number:', error);
    return NextResponse.json(
      { error: 'Failed to add winning number' },
      { status: 500 }
    );
  }
}

// PUT /api/winning-numbers - Update existing winning number
export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement Convex write operation
    return NextResponse.json(
      { error: 'Write operations not yet implemented for Convex' },
      { status: 501 }
    );
  } catch (error) {
    logger.error('Failed to update winning number:', error);
    return NextResponse.json(
      { error: 'Failed to update winning number' },
      { status: 500 }
    );
  }
}

// DELETE /api/winning-numbers - Delete winning number
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement Convex write operation
    return NextResponse.json(
      { error: 'Write operations not yet implemented for Convex' },
      { status: 501 }
    );
  } catch (error) {
    logger.error('Failed to delete winning number:', error);
    return NextResponse.json(
      { error: 'Failed to delete winning number' },
      { status: 500 }
    );
  }
}

/**
 * Invalidate winning numbers cache
 * Call this when a new winning number is set
 * Invalidates both Redis and in-memory caches
 */
export function invalidateWinningNumbersCache() {
  logger.log('🗑️ Invalidating winning numbers cache');
  
  // Clear Redis cache (async, non-blocking)
  invalidateWinningNumbersCacheRedis().catch((err: unknown) => {
    logger.error('Failed to invalidate Redis cache:', err);
  });
  
  // Clear dev cache
  invalidateDevCache('winning_numbers');
}

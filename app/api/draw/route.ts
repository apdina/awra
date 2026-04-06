import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';
import { logger } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis-cache';

function getZonedDateTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hourCycle: 'h23', weekday: 'long'
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  return {
    year: parseInt(getPart('year') || '0', 10),
    month: parseInt(getPart('month') || '0', 10),
    day: parseInt(getPart('day') || '0', 10),
    hour: parseInt(getPart('hour') || '0', 10),
    minute: parseInt(getPart('minute') || '0', 10),
    second: parseInt(getPart('second') || '0', 10),
    weekday: getPart('weekday') || ''
  };
}

function createDateInTimezone(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const estimate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = getZonedDateTimeParts(estimate, timeZone);
  const partsMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offsetMs = partsMs - estimate.getTime();
  const exact = new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMs);
  const exactParts = getZonedDateTimeParts(exact, timeZone);
  if (exactParts.hour !== hour || exactParts.minute !== minute) {
    const partsMs2 = Date.UTC(exactParts.year, exactParts.month - 1, exactParts.day, exactParts.hour, exactParts.minute);
    const offsetMs2 = partsMs2 - exact.getTime();
    return new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMs2);
  }
  return exact;
}

/**
 * UNIFIED DRAW API
 * 
 * Single source of truth for all draw-related data
 * Automatically handles:
 * - Draw time updates from admin
 * - Draw increment when time passes
 * - Countdown calculation
 * - Caching strategy
 * 
 * Query params:
 * - ?type=countdown - Returns countdown data (hours, minutes, seconds)
 * - ?type=current - Returns current draw info (default)
 * - ?t=<timestamp> - Force refresh (bypass cache)
 */
export async function GET(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const now = Date.now();
    const url = new URL(request.url);
    
    // Get query parameters
    const type = url.searchParams.get('type') || 'current';
    const isForceRefresh = url.searchParams.has('t');
    
    // Try to reuse Redis-backed draw state cache to reduce backend load
    const cacheKey = 'draw_api_state';
    let cachedState = null;
    if (!isForceRefresh) {
      cachedState = await getCache<any>(cacheKey);
    }

    let currentDraw;
    let defaultTimeConfig;
    let timezoneConfig;

    if (cachedState) {
      currentDraw = cachedState.currentDraw;
      defaultTimeConfig = cachedState.defaultTimeConfig;
      timezoneConfig = cachedState.timezoneConfig;
    } else {
      [currentDraw, defaultTimeConfig, timezoneConfig] = await Promise.all([
        convex.query(api.draws.getOrCreateCurrentDraw, {}),
        convex.query(api.systemConfig.getConfig, { key: 'default_draw_time' }),
        convex.query(api.systemConfig.getConfig, { key: 'app_timezone' })
      ]);
      await setCache(cacheKey, { currentDraw, defaultTimeConfig, timezoneConfig }, 10);
    }

    const timezone = (timezoneConfig?.value as string) || "Africa/Casablanca";
    
    if (!currentDraw) {
      return NextResponse.json({
        success: false,
        error: 'No draw available'
      }, { status: 500 });
    }

    // Use the latest default_draw_time from systemConfig
    // This ensures admin changes are immediately reflected
    let drawTimeToUse = '21:40'; // fallback
    
    if (defaultTimeConfig && defaultTimeConfig.value) {
      drawTimeToUse = defaultTimeConfig.value as string;
    } else if (currentDraw.draw_time) {
      drawTimeToUse = currentDraw.draw_time;
    }
    
    logger.log('Draw time resolution:', {
      fromSystemConfig: defaultTimeConfig?.value,
      fromCurrentDraw: currentDraw.draw_time,
      final: drawTimeToUse
    });
    
    logger.log('Draw API:', {
      type,
      draw_date: currentDraw.draw_date,
      draw_time: drawTimeToUse,
      source: defaultTimeConfig?.value ? 'systemConfig' : (currentDraw.draw_time ? 'draw_object' : 'fallback')
    });

    // Parse draw date and time
    const [day, month, year] = currentDraw.draw_date.split('/').map(Number);
    const [hours, minutes] = drawTimeToUse.split(':').map(Number);
    
    // Create draw time (Timezone Aware)
    const drawTime = createDateInTimezone(year, month, day, hours, minutes, timezone);
    const diff = drawTime.getTime() - now;

    // If draw has passed, trigger the draw increment to create the next draw
    let drawWasIncremented = false;
    let finalDraw = currentDraw;
    let finalDrawTime = drawTimeToUse;
    
    if (diff <= 0) {
      logger.log('⏰ Draw time has passed, triggering draw increment...');
      try {
        const adminSecret = process.env.ADMIN_SECRET || '';
        await convex.mutation(api.draws.checkAndIncrementDraw, {
          adminSecret
        });
        logger.log('✅ Draw increment triggered successfully');
        
        // Fetch the updated draw after increment
        const updatedDraw = await convex.query(api.draws.getOrCreateCurrentDraw, {});
        if (updatedDraw && updatedDraw.draw_date !== currentDraw.draw_date) {
          drawWasIncremented = true;
          finalDraw = updatedDraw;
          logger.log('✅ New draw detected:', updatedDraw.draw_date);

          // Update the cached state after the draw increments
          await setCache(cacheKey, { currentDraw: updatedDraw, defaultTimeConfig, timezoneConfig }, 10);
        }
      } catch (error) {
        logger.error('Error triggering draw increment:', error);
      }
    }

    // Calculate countdown for final draw
    const [finalDay, finalMonth, finalYear] = finalDraw.draw_date.split('/').map(Number);
    const [finalHours, finalMinutes] = finalDrawTime.split(':').map(Number);
    const finalDrawDateTime = createDateInTimezone(finalYear, finalMonth, finalDay, finalHours, finalMinutes, timezone);
    const finalDiff = finalDrawDateTime.getTime() - now;

    const hrs = Math.max(0, Math.floor(finalDiff / (1000 * 60 * 60)));
    const mins = Math.max(0, Math.floor((finalDiff % (1000 * 60 * 60)) / (1000 * 60)));
    const secs = Math.max(0, Math.floor((finalDiff % (1000 * 60)) / 1000));
    
    const dayOfWeek = getZonedDateTimeParts(finalDrawDateTime, timezone).weekday;

    // Build response based on type
    let responseData: any;
    
    if (type === 'countdown') {
      // Countdown format
      responseData = {
        success: true,
        data: {
          hours: hrs,
          minutes: mins,
          seconds: secs,
          totalSeconds: Math.max(0, Math.floor(finalDiff / 1000)),
          isExpired: finalDiff <= 0,
          nextDrawDate: finalDraw.draw_date,
          nextDrawTime: finalDrawTime,
          dayOfWeek,
          cached: !drawWasIncremented,
          timestamp: now
        }
      };
    } else {
      // Current draw format (default)
      responseData = {
        success: true,
        data: {
          id: finalDraw.id,
          draw_date: finalDraw.draw_date,
          draw_time: finalDrawTime,
          winning_number: finalDraw.winning_number || null,
          is_processed: finalDraw.is_processed || false,
          status: finalDraw.status,
          total_tickets: finalDraw.total_tickets || 0,
          current_pot: finalDraw.current_pot || 0,
          // Include countdown info
          countdown: {
            hours: hrs,
            minutes: mins,
            seconds: secs,
            totalSeconds: Math.max(0, Math.floor(finalDiff / 1000)),
            isExpired: finalDiff <= 0,
            dayOfWeek
          },
          cached: !drawWasIncremented,
          timestamp: now
        }
      };
    }

    // Set cache headers
    const response = NextResponse.json(responseData);
    
    if (isForceRefresh || drawWasIncremented) {
      // No caching for force refresh or when draw was just incremented
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    } else {
      // Cache for 10 seconds with stale-while-revalidate
      response.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
      response.headers.set('CDN-Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    }
    
    return response;

  } catch (error) {
    logger.error('Error in unified draw API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch draw data' 
    }, { status: 500 });
  }
}

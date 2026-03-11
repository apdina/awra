import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';
import { logger } from '@/lib/logger';

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
    
    // Fetch current draw and latest default time
    const [currentDraw, defaultTimeConfig] = await Promise.all([
      convex.query(api.draws.getOrCreateCurrentDraw, {}),
      convex.query(api.systemConfig.getConfig, { key: 'default_draw_time' })
    ]);
    
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
    
    // Create draw time (UTC)
    const drawTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
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
        }
      } catch (error) {
        logger.error('Error triggering draw increment:', error);
      }
    }

    // Calculate countdown for final draw
    const [finalDay, finalMonth, finalYear] = finalDraw.draw_date.split('/').map(Number);
    const [finalHours, finalMinutes] = finalDrawTime.split(':').map(Number);
    const finalDrawDateTime = new Date(Date.UTC(finalYear, finalMonth - 1, finalDay, finalHours, finalMinutes, 0, 0));
    const finalDiff = finalDrawDateTime.getTime() - now;

    const hrs = Math.max(0, Math.floor(finalDiff / (1000 * 60 * 60)));
    const mins = Math.max(0, Math.floor((finalDiff % (1000 * 60 * 60)) / (1000 * 60)));
    const secs = Math.max(0, Math.floor((finalDiff % (1000 * 60)) / 1000));
    
    const dayOfWeek = finalDrawDateTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

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

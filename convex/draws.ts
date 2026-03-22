/**
 * Cleaned-up Draw System
 * 
 * Only keeping functions that are actually used
 * Removed userTickets system (replaced by unifiedTickets)
 */

import { v } from "convex/values";
import { mutation, query, action, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { internal as unifiedInternal } from "../convex/_generated/api.js";
import { Redis } from "@upstash/redis";

// Constants
const DRAW_DURATION_HOURS = 24;
const SUNDAY_DRAW_DURATION_HOURS = 48;

/**
 * Redis client for cache invalidation
 */
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    // Redis is optional - only used for cache invalidation in production
    return null;
  }
  
  return new Redis({ url, token });
}

/**
 * Internal Action to invalidate cache (direct Redis access)
 * Called from mutations after database updates
 * 
 * This is the clean, production-ready approach:
 * - Direct Redis connection (no HTTP overhead)
 * - No Bearer token needed (internal to Convex)
 * - Fast, cheap, and reliable
 */
export const invalidateCacheInternal = internalAction({
  handler: async (ctx, args: { drawId?: string }) => {
    try {
      const redis = getRedisClient();
      
      if (redis) {
        // Invalidate cache keys directly
        await redis.del('current_draw');
        await redis.del('winning_numbers_history');
        console.log('✅ Redis cache invalidated via internalAction');
      } else {
        console.log('⚠️ Redis not configured, skipping cache invalidation');
      }
    } catch (error) {
      console.error('❌ Cache invalidation failed (non-critical):', error);
      // Don't fail the mutation if cache invalidation fails
    }
  },
});

/**
 * Get countdown data
 */
export const getCountdownData = query({
  handler: async (ctx): Promise<any> => {
    const now = Date.now();
    
    // Parallel query active and upcoming draws
    const [currentDrawRaw, upcomingDrawRaw] = await Promise.all([
      ctx.db
        .query("dailyDraws")
        .withIndex("by_status", (q) => 
          q.eq("status", "active").gte("endTime", now)
        )
        .first(),
      ctx.db
        .query("dailyDraws")
        .withIndex("by_status", (q) => 
          q.eq("status", "upcoming").gte("endTime", now)
        )
        .order("asc")
        .first()
    ]);

    const drawToProcess = currentDrawRaw || upcomingDrawRaw;
    if (!drawToProcess) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        cached: false,
        timestamp: now
      };
    }

    return processDrawForCountdown(drawToProcess, ctx, now);
  },
});

/**
 * Process a draw for countdown calculation
 */
async function processDrawForCountdown(draw: any, ctx: any, now: number): Promise<any> {
  // Parse draw date and time
  const [day, month, year] = draw.drawId.split('/').map(Number);
  const [hours, minutes] = (draw.draw_time || "21:40").split(':').map(Number);
  
  // Create draw time (UTC)
  const drawTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  
  // Calculate next draw if current has passed
  let targetDrawTime = drawTime;
  let nextDrawDate = draw.drawId;
  let nextDrawTime = draw.draw_time;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let dayOfWeek = dayNames[drawTime.getUTCDay()];
  
  if (drawTime.getTime() <= now) {
    // Calculate next draw with Sunday logic
    const nextDate = new Date(drawTime);
    
    // Check if current day is Sunday
    if (drawTime.getUTCDay() === 0) {
      // Sunday: skip Monday, go to Tuesday
      nextDate.setUTCDate(nextDate.getUTCDate() + 2);
    } else {
      // Next day
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    }
    
    // Skip Sundays if configured
    // Batch fetch all configs once
    const configs = await ctx.db.query("systemConfig").collect();
    const excludeSundaysConfig = configs.find((c: any) => c.key === "exclude_sundays");
    const defaultTimeConfig = configs.find((c: any) => c.key === "default_draw_time");
    const holidaysConfig = configs.find((c: any) => c.key === "holiday_exceptions");
    
    const excludeSundays = excludeSundaysConfig?.value !== false;
    const holidays: string[] = holidaysConfig ? JSON.parse(holidaysConfig.value as string) : [];
    
    // Helper function to check if a date is a holiday
    const isHoliday = (date: Date): boolean => {
      const d = String(date.getUTCDate()).padStart(2, '0');
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const y = date.getUTCFullYear();
      const dateStr = `${d}/${m}/${y}`;
      return holidays.includes(dateStr);
    };
    
    // Skip Sundays
    while (excludeSundays && nextDate.getUTCDay() === 0) {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    }
    
    // Skip holidays
    while (isHoliday(nextDate)) {
      const d = String(nextDate.getUTCDate()).padStart(2, '0');
      const m = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
      const y = nextDate.getUTCFullYear();
      console.log(`🎉 Holiday detected in countdown: ${d}/${m}/${y} - Skipping to next day`);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      
      // Re-check Sunday after skipping holiday
      if (excludeSundays && nextDate.getUTCDay() === 0) {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      }
    }
    
    nextDate.setUTCHours(hours, minutes, 0, 0);
    targetDrawTime = nextDate;
    
    // Format next draw date
    const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');
    const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const nextYear = nextDate.getUTCFullYear();
    nextDrawDate = `${nextDay}/${nextMonth}/${nextYear}`;
    nextDrawTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    dayOfWeek = dayNames[nextDate.getUTCDay()];
  }
  
  const diff = targetDrawTime.getTime() - now;
  const hrs = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const mins = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  const secs = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));
  
  return {
    hours: hrs,
    minutes: mins,
    seconds: secs,
    totalSeconds: Math.max(0, Math.floor(diff / 1000)),
    isExpired: diff <= 0,
    nextDrawDate,
    nextDrawTime,
    dayOfWeek,
    cached: false,
    timestamp: now
  };
}
export const getCurrentDraw = query({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find active or upcoming draw
    const draws = await ctx.db
      .query("dailyDraws")
      .withIndex("by_status", (q) => 
        q.eq("status", "active").gte("endTime", now)
      )
      .first();

    if (draws) {
      return draws;
    }

    // If no active draw, find the most recent upcoming one
    const upcomingDraws = await ctx.db
      .query("dailyDraws")
      .withIndex("by_status", (q) => 
        q.eq("status", "upcoming").gte("endTime", now)
      )
      .order("asc")
      .first();

    if (upcomingDraws) {
      return upcomingDraws;
    }

    // If no draws at all, return null
    return null;
  },
});
/**
 * Get draw history (completed draws with winning numbers)
 */
export const getDrawHistory = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    const cursorTime = args.cursor ? parseInt(args.cursor) : null;

    let completedDraws;
    if (cursorTime) {
      completedDraws = await ctx.db
        .query("dailyDraws")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .filter((q) => q.lt(q.field("updatedAt"), cursorTime))
        .order("desc")
        .take(limit + 1);
    } else {
      completedDraws = await ctx.db
        .query("dailyDraws")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .order("desc")
        .take(limit + 1);
    }

    // Filter winning numbers + pagination slice
    const drawsWithWinners = completedDraws.filter((draw: any) => draw.winningNumber != null);
    const hasMore = drawsWithWinners.length > limit;
    const paginated = hasMore ? drawsWithWinners.slice(0, limit) : drawsWithWinners;

    return {
      draws: paginated,
      count: drawsWithWinners.length,
      hasMore,
      nextCursor: hasMore ? paginated[paginated.length - 1].updatedAt.toString() : null,
    };
  },
});

/**
 * Set winning number for a draw (admin function)
 * 
 * 🚨 CRITICAL: AUTOMATIC WIN PROCESSING
 * When admin sets a winning number, tickets are automatically processed:
 * 1. Winning number is set on the draw
 * 2. processDrawInternal is called immediately 
 * 3. All eligible tickets are checked for wins
 * 4. Winning tickets are updated (status: "won", winningAmount set)
 * 5. User balances are credited instantly
 * 6. Transaction records are created for audit trail
 * 
 * This ensures wins are calculated and balances updated immediately,
 * not requiring separate manual processing steps.
 * 
 * ⏰ TIME CRITICAL CODE
 * 
 * Date Format: DD/MM/YYYY (e.g., "20/02/2026")
 * Time Format: HH:MM 24-hour (read from systemConfig.default_draw_time)
 * Timezone: Local server time
 * 
 * ⚠️ IMPORTANT: 24-Hour Window Logic
 * - Winning number for date 20/02/2026 is valid for tickets purchased
 *   between 19/02/2026 21:40:01 and 20/02/2026 21:40:00
 * - This is the 24-hour window for that draw
 * 
 * ⚠️ DO NOT modify without:
 * 1. Understanding the 24-hour window calculation
 * 2. Verifying time validation logic
 * 3. Testing with different draw times
 * 4. Ensuring cache invalidation works
 * 
 * Note: This function is kept for backward compatibility.
 * Consider using processDraw from unifiedTickets.ts instead for full processing.
 */
export const setWinningNumber = mutation({
  args: {
    drawId: v.string(), // Draw ID like "20/02/2026" (DD/MM/YYYY)
    winningNumber: v.number(),
    adminSecret: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    // Verify admin secret from database
    const config = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq(q.field("key"), "adminSecret"))
      .first();
    
    const ADMIN_SECRET = config?.value || "";
    if (args.adminSecret !== ADMIN_SECRET) {
      throw new Error("Invalid admin secret");
    }

    // Validate winning number
    if (args.winningNumber < 1 || args.winningNumber > 200) {
      throw new Error("Winning number must be between 1 and 200");
    }

    // Parse and validate draw date
    const [day, month, year] = args.drawId.split('/').map(Number);
    if (!day || !month || !year) {
      throw new Error("Invalid draw date format. Expected DD/MM/YYYY");
    }

    // Get default draw time
// Batch fetch configs at top - already handled
    
    const configs = await ctx.db.query("systemConfig").collect();
    const defaultTimeConfig = configs.find((c: any) => c.key === "default_draw_time");
    const drawTime = (defaultTimeConfig?.value as string) || "21:40";
    const [hours, minutes] = drawTime.split(':').map(Number);
    
    // Calculate draw timestamp (UTC)
    const drawTimestamp = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0)).getTime();
    const now = Date.now();
    
    // Validate that draw time has passed
    if (drawTimestamp > now) {
      throw new Error(`Cannot set winning number for future draw. Draw time is ${new Date(drawTimestamp).toLocaleString()}, current time is ${new Date(now).toLocaleString()}`);
    }
    
    // Calculate 24-hour window
    const windowStart = drawTimestamp - (24 * 60 * 60 * 1000);
    const windowStartDate = new Date(windowStart);
    const windowEndDate = new Date(drawTimestamp);
    
    console.log(`Setting winning number ${args.winningNumber} for draw ${args.drawId}`);
    console.log(`24-hour window: ${windowStartDate.toLocaleString()} to ${windowEndDate.toLocaleString()}`);

    // Find draw by drawId
    let draw = await ctx.db
      .query("dailyDraws")
      .withIndex("by_drawId", (q: any) => q.eq("drawId", args.drawId))
      .first();

    if (!draw) {
      // Create draw if it doesn't exist
      const drawId = await ctx.db.insert("dailyDraws", {
        drawId: args.drawId,
        ticketPrice: 10,
        maxTickets: 1000,
        currentPot: 0,
        startTime: windowStart,
        endTime: drawTimestamp,
        drawingTime: drawTimestamp,
        status: "completed",
        winningNumber: args.winningNumber,
        totalTickets: 0,
        uniquePlayers: 0,
        createdAt: now,
        updatedAt: now,
      });

      // 🚨 CRITICAL: Process tickets immediately for newly created draw with winning number
      let processResult;
      try {
        processResult = await ctx.runMutation(unifiedInternal.unifiedTickets.processDrawInternal, {
          drawDate: args.drawId,
          winningNumber: args.winningNumber,
        });
        console.log('✅ New draw created + tickets processed successfully:', processResult);
      } catch (error: any) {
        console.error('❌ CRITICAL ERROR: Failed to process tickets for new draw:', error);
        processResult = {
          success: false,
          error: error?.message || 'Unknown error',
          totalTickets: 0,
          winners: [],
          totalPayout: 0,
          message: 'Draw created but ticket processing failed'
        };
      }

      // 🚨 CRITICAL: Invalidate winning numbers cache so fresh data is fetched
      try {
        await ctx.scheduler.runAfter(0, internal.draws.invalidateWinningNumbersCacheInternal);
        console.log('✅ Winning numbers cache invalidation scheduled for new draw');
      } catch (error: any) {
        console.error('⚠️ Cache invalidation failed (non-critical):', error?.message || 'Unknown error');
      }

      return {
        success: true,
        drawId: args.drawId,
        winningNumber: args.winningNumber,
        windowStart: windowStartDate.toISOString(),
        windowEnd: windowEndDate.toISOString(),
        ticketsProcessed: processResult.totalTickets || 0,
        winnersCount: processResult.winners?.length || 0,
        totalPayout: processResult.totalPayout || 0,
        processingSuccess: processResult.success !== false,
        message: processResult.success !== false
          ? `✅ Draw created and winning number set + ${processResult.totalTickets || 0} tickets processed (${processResult.winners?.length || 0} winners)`
          : `⚠️ Draw created with winning number but ticket processing failed: ${processResult.error || 'Unknown error'}`,
        _id: drawId,
      };
    }

    // Update existing draw with winning number
    await ctx.db.patch(draw._id, {
      winningNumber: args.winningNumber,
      status: "completed",
      updatedAt: now,
    });

    // 🚨 CRITICAL: Auto-process tickets immediately after setting winning number
    // This ensures wins are calculated and balances updated instantly
    let processResult;
    try {
      processResult = await ctx.runMutation(unifiedInternal.unifiedTickets.processDrawInternal, {
        drawDate: args.drawId,
        winningNumber: args.winningNumber,
      });
      console.log('✅ Winning number set + tickets processed successfully:', processResult);
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR: Failed to process tickets after setting winning number:', error);
      // Don't fail the entire operation, but log the error
      // The winning number is still set, but tickets weren't processed
      processResult = {
        success: false,
        error: error?.message || 'Unknown error',
        totalTickets: 0,
        winners: [],
        totalPayout: 0,
        message: 'Winning number set but ticket processing failed'
      };
    }

    // 🚨 CRITICAL: Invalidate winning numbers cache so fresh data is fetched
    // This ensures users see the updated winning number immediately, not stale cache
    try {
      await ctx.scheduler.runAfter(0, internal.draws.invalidateWinningNumbersCacheInternal);
      console.log('✅ Winning numbers cache invalidation scheduled');
    } catch (error: any) {
      console.error('⚠️ Cache invalidation failed (non-critical):', error?.message || 'Unknown error');
      // Don't fail the winning number update if cache invalidation fails
    }

    return {
      success: true,
      drawId: args.drawId,
      winningNumber: args.winningNumber,
      windowStart: windowStartDate.toISOString(),
      windowEnd: windowEndDate.toISOString(),
      ticketsProcessed: processResult.totalTickets || 0,
      winnersCount: processResult.winners?.length || 0,
      totalPayout: processResult.totalPayout || 0,
      processingSuccess: processResult.success !== false,
      message: processResult.success !== false 
        ? `✅ Winning number set + ${processResult.totalTickets || 0} tickets processed (${processResult.winners?.length || 0} winners)`
        : `⚠️ Winning number set but ticket processing failed: ${processResult.error || 'Unknown error'}`,
    };
  },
});

/**
 * Get or create current draw (for API compatibility)
 * 
 * ⏰ TIME CRITICAL CODE
 * 
 * Date Format: DD/MM/YYYY (e.g., "09/03/2026")
 * Time Format: HH:MM 24-hour (e.g., "21:40")
 * Timezone: UTC (CRITICAL: Convex runs in West Virginia EST/EDT, must use UTC methods!)
 * 
 * ⚠️ IMPORTANT: Convex server is in West Virginia (UTC-5/UTC-4)
 * - NEVER use: getDay(), getHours(), getDate() - these use local time
 * - ALWAYS use: getUTCDay(), getUTCHours(), getUTCDate() - these use UTC
 * 
 * ⚠️ DO NOT modify time logic without:
 * 1. Checking frontend countdown compatibility
 * 2. Verifying cache invalidation timing
 * 3. Testing Sunday skip logic IN UTC
 * 4. Ensuring date format consistency (DD/MM/YYYY)
 * 
 * Single Source of Truth: This function returns the draw from database
 * Frontend MUST use the returned values, NOT recalculate independently
 */
export const getOrCreateCurrentDraw = query({
  args: {
    date: v.optional(v.string()), // DD/MM/YYYY format
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
// Batch fetch configs at top
    const configs = await ctx.db.query("systemConfig").collect();
    const defaultTimeConfig = configs.find((c: any) => c.key === "default_draw_time");
    const defaultDrawTime = (defaultTimeConfig?.value as string) || "21:40";
    
    // Find the most recent active or upcoming draw
    const draws = await ctx.db
      .query("dailyDraws")
      .order("desc")
      .take(10);
    
    // Find first draw that hasn't been completed
    const activeDraw = draws.find(d => d.status !== "completed");
    
    if (activeDraw) {
      return {
        id: activeDraw._id,
        draw_date: activeDraw.drawId,
        draw_time: (() => {
          const d = new Date(activeDraw.drawingTime);
          return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        })(),
        winning_number: activeDraw.winningNumber || null,
        is_processed: activeDraw.status === "completed",
        status: activeDraw.status,
        total_tickets: activeDraw.totalTickets,
        current_pot: activeDraw.currentPot,
      };
    }

    // No active draw found - this should NOT happen if cron job is working correctly
    // But we return a fallback if needed
    // The cron job should have created an upcoming draw by now
    
    // Get Sunday exclusion setting
    const excludeSundaysConfig = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq("key", "exclude_sundays"))
      .first();
    
    const holidaysConfig = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq("key", "holiday_exceptions"))
      .first();
    
    const excludeSundays = excludeSundaysConfig?.value !== false; // Default true
    const holidays: string[] = holidaysConfig ? JSON.parse(holidaysConfig.value as string) : [];
    
    // Helper function to check if a date is a holiday
    const isHoliday = (date: Date): boolean => {
      const d = String(date.getUTCDate()).padStart(2, '0');
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const y = date.getUTCFullYear();
      const dateStr = `${d}/${m}/${y}`;
      return holidays.includes(dateStr);
    };
    
    // Calculate next draw date (UTC) - this is a fallback
    let nextDrawDate = new Date();
    nextDrawDate.setUTCHours(0, 0, 0, 0); // Start of today
    
    // If draw time has passed today, start from tomorrow
    const [hours, minutes] = defaultDrawTime.split(':').map(Number);
    nextDrawDate.setUTCHours(hours, minutes, 0, 0);
    
    if (nextDrawDate.getTime() <= now) {
      nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
    }
    
    // Skip Sundays if configured (UTC)
    while (excludeSundays && nextDrawDate.getUTCDay() === 0) {
      nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
    }
    
    // Skip holidays
    while (isHoliday(nextDrawDate)) {
      const d = String(nextDrawDate.getUTCDate()).padStart(2, '0');
      const m = String(nextDrawDate.getUTCMonth() + 1).padStart(2, '0');
      const y = nextDrawDate.getUTCFullYear();
      console.log(`🎉 Holiday detected in fallback: ${d}/${m}/${y} - Skipping to next day`);
      nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
      
      // Re-check Sunday after skipping holiday
      if (excludeSundays && nextDrawDate.getUTCDay() === 0) {
        nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
      }
    }
    
    // Format as DD/MM/YYYY (UTC)
    const day = String(nextDrawDate.getUTCDate()).padStart(2, '0');
    const month = String(nextDrawDate.getUTCMonth() + 1).padStart(2, '0');
    const year = nextDrawDate.getUTCFullYear();
    const fallbackDate = `${day}/${month}/${year}`;
    
    console.log('⚠️ No active draw found in database - returning fallback');
    console.log('Fallback draw date:', fallbackDate, 'time:', defaultDrawTime);
    
    return {
      id: "fallback-draw",
      draw_date: fallbackDate,
      draw_time: defaultDrawTime,
      winning_number: null,
      is_processed: false,
      status: "upcoming",
      total_tickets: 0,
      current_pot: 0,
    };
  },
});

/**
 * Create or update draw with time (admin function)
 */
export const setDrawTime = mutation({
  args: {
    drawDate: v.string(), // DD/MM/YYYY format
    drawTime: v.string(), // HH:MM format
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin secret from database
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "adminSecret"))
      .first();
    
    const ADMIN_SECRET = config?.value || "";
    if (args.adminSecret !== ADMIN_SECRET) {
      throw new Error("Invalid admin secret");
    }

    // Parse date and time (UTC)
    const [day, month, year] = args.drawDate.split('/').map(Number);
    const [hours, minutes] = args.drawTime.split(':').map(Number);
    
    const drawDateTime = new Date(Date.UTC(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0
    ));

    const drawingTime = drawDateTime.getTime();
    const startTime = drawingTime - (24 * 60 * 60 * 1000); // 24 hours before
    const endTime = drawingTime - (5 * 60 * 1000); // 5 minutes before drawing

    // Find existing draw
    const existingDraw = await ctx.db
      .query("dailyDraws")
      .withIndex("by_drawId", (q) => q.eq("drawId", args.drawDate))
      .first();

    if (existingDraw) {
      // Update existing draw
      await ctx.db.patch(existingDraw._id, {
        drawingTime,
        endTime,
        updatedAt: Date.now(),
      });

      // Also update the default draw time in system config
      const defaultTimeConfig = await ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q: any) => q.eq("key", "default_draw_time"))
        .first();
      
      if (defaultTimeConfig) {
        await ctx.db.patch(defaultTimeConfig._id, {
          value: args.drawTime,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("systemConfig", {
          key: "default_draw_time",
          value: args.drawTime,
          description: "Default time for new draws (HH:MM format)",
          updatedAt: Date.now(),
        });
      }

      // Schedule cache invalidation actions (must be outside mutation)
      await ctx.scheduler.runAfter(0, internal.draws.invalidateCurrentDrawCacheInternal);
      // FIXED: Invalidate ticket caches so new tickets show correct draw time
      await ctx.scheduler.runAfter(50, internal.draws.invalidateTicketCachesInternal);

      return {
        success: true,
        drawId: args.drawDate,
        drawTime: args.drawTime,
        message: "Draw time updated successfully - ticket caches invalidated",
      };
    } else {
      // Create new draw
      const drawId = await ctx.db.insert("dailyDraws", {
        drawId: args.drawDate,
        ticketPrice: 10,
        maxTickets: 1000,
        currentPot: 0,
        startTime,
        endTime,
        drawingTime,
        status: "upcoming",
        totalTickets: 0,
        uniquePlayers: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Also update the default draw time in system config
      const defaultTimeConfig = await ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q: any) => q.eq("key", "default_draw_time"))
        .first();
      
      if (defaultTimeConfig) {
        await ctx.db.patch(defaultTimeConfig._id, {
          value: args.drawTime,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("systemConfig", {
          key: "default_draw_time",
          value: args.drawTime,
          description: "Default time for new draws (HH:MM format)",
          updatedAt: Date.now(),
        });
      }

      // Schedule cache invalidation actions (must be outside mutation)
      await ctx.scheduler.runAfter(0, internal.draws.invalidateCurrentDrawCacheInternal);
      // FIXED: Invalidate ticket caches so new tickets show correct draw time
      await ctx.scheduler.runAfter(50, internal.draws.invalidateTicketCachesInternal);

      return {
        success: true,
        drawId: args.drawDate,
        drawTime: args.drawTime,
        message: "Draw created successfully - ticket caches invalidated",
        _id: drawId,
      };
    }
  },
});

/**
 * Instant cache refill after winning number is set
 * Fetches new winning numbers and caches them immediately
 */
export const refreshWinningNumbersCacheInternal = internalAction({
  args: {
    drawId: v.string(),
    winningNumber: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`🔄 Instant cache refill for draw ${args.drawId}, number ${args.winningNumber}`);
      
      // Get fresh winning numbers from database using runQuery
      const draws = await ctx.runQuery(internal.draws.getCompletedDrawsForCache);
      
      // Format the data exactly like the API does
      const formattedEntries = draws.map((draw: any) => {
        // Parse date from DD/MM/YYYY format
        const [day, month, year] = draw.drawId.split('/');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        return {
          day: dayOfWeek,
          date: draw.drawId,
          number: draw.winning_number
        };
      });

      const responseData = {
        data: formattedEntries,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(formattedEntries.length / 50),
          totalEntries: formattedEntries.length,
          hasNextPage: false,
          hasPreviousPage: false
        },
        // Include version for client-side cache validation
        version: `${args.drawId}_${args.winningNumber}`,
        lastUpdated: Date.now()
      };

      // Cache the fresh data immediately
      const redis = getRedisClient();
      if (redis) {
        await redis.set('winning_numbers_history', responseData, { ex: 172800 }); // 48 hours
        await redis.set('winning_numbers_version', `${args.drawId}_${args.winningNumber}`, { ex: 604800 }); // 7 days
        console.log('✅ Winning numbers cache refreshed and cached instantly');
      } else {
        console.log('⚠️ Redis not configured, skipping cache refill');
      }
      
    } catch (error) {
      console.error('❌ Instant cache refill failed:', error);
    }
  },
});

/**
 * Get completed draws for cache refill
 */
export const getCompletedDrawsForCache = internalQuery({
  handler: async (ctx: any) => {
    return await ctx.db
      .query("dailyDraws")
      .withIndex("by_status", (q: any) => q.eq("status", "completed"))
      .order("desc")
      .take(50); // Get latest 50 completed draws
  },
});

/**
 * Invalidate winning numbers cache when winning number is set
 * Called after setWinningNumber mutation completes
 */
export const invalidateWinningNumbersCacheInternal = internalAction({
  handler: async (ctx) => {
    try {
      const redis = getRedisClient();
      
      if (redis) {
        await redis.del('winning_numbers_history');
        await redis.del('winning_numbers_version');
        console.log('✅ Winning numbers cache invalidated via internalAction');
      } else {
        console.log('⚠️ Redis not configured, skipping winning numbers cache invalidation');
      }
    } catch (error) {
      console.error('❌ Winning numbers cache invalidation failed (non-critical):', error);
      // Don't fail the mutation if cache invalidation fails
    }
  },
});

/**
 * Invalidate current draw cache when draw time changes
 * Called after setDrawTime mutation completes
 */
export const invalidateCurrentDrawCacheInternal = internalAction({
  handler: async (ctx) => {
    try {
      const redis = getRedisClient();
      
      if (redis) {
        await redis.del('current_draw');
      }
    } catch (error) {
      // Cache invalidation is non-critical, silently fail
    }
  },
});

/**
 * Invalidate ticket caches when draw time changes
 * Called after setDrawTime mutation - CRITICAL for ticket drawTime fix
 */
export const invalidateTicketCachesInternal = internalAction({
  handler: async (ctx) => {
    try {
      const redis = getRedisClient();
      
      if (redis) {
        // Clear all potential ticket cache keys
        await redis.del('user_tickets:*');
        await redis.del('tickets:*');
        await redis.del('ticket_list:*');
        // Also clear legacy caches if they exist
        await redis.del('legacy_tickets:*');
        console.log('✅ TICKET CACHES invalidated - new tickets will show correct draw time');
      } else {
        console.log('⚠️ Redis not configured, skipping ticket cache invalidation');
      }
    } catch (error) {
      console.error('❌ Ticket cache invalidation failed (non-critical):', error);
    }
  },
});

/**
 * Helper function to create the next draw with Sunday 48H logic
 * 
 * ⏰ TIME CRITICAL CODE
 * 
 * IMPORTANT: Uses UTC methods because Convex runs in West Virginia (UTC-5/UTC-4)
 * - NEVER use: getDay(), setDate(), setHours(), getDate(), getMonth()
 * - ALWAYS use: getUTCDay(), setUTCDate(), setUTCHours(), getUTCDate(), getUTCMonth()
 * 
 * Sunday Logic:
 * - If current draw day is Friday/Saturday, next draw is Sunday (+24H)
 * - If current draw day is Sunday, next draw is Tuesday (+48H, skipping Monday)
 * - All other days: next draw is next day (+24H)
 */
async function createNextDraw(ctx: any, now: number, baseDate?: Date) {
  // Start from today or base date
  let nextDate = baseDate ? new Date(baseDate) : new Date();
  
  // If base date is provided, start from next day. Otherwise, use today
  if (baseDate) {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  }

  // Batch fetch configs
  const configs = await ctx.db.query("systemConfig").collect();
  const excludeSundaysConfig = configs.find((c: any) => c.key === "exclude_sundays");
  const defaultTimeConfig = configs.find((c: any) => c.key === "default_draw_time");
  const holidaysConfig = configs.find((c: any) => c.key === "holiday_exceptions");
  
  const excludeSundays = excludeSundaysConfig?.value !== false; // Default true
  const defaultDrawTime = (defaultTimeConfig?.value as string) || "21:40";
  const holidays: string[] = holidaysConfig ? JSON.parse(holidaysConfig.value as string) : [];

  // Helper function to check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const dateStr = `${day}/${month}/${year}`;
    return holidays.includes(dateStr);
  };

  // Parse default draw time (UTC)
  const [hours, minutes] = defaultDrawTime.split(':');
  nextDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Calculate draw duration based on day of week
  let drawDurationHours = DRAW_DURATION_HOURS;
  
  // Check if we're creating a Sunday draw and need to skip to Tuesday
  const currentDayOfWeek = baseDate ? baseDate.getUTCDay() : new Date().getUTCDay();
  
  // If current day is Sunday (0), next draw should be Tuesday (48H window)
  if (currentDayOfWeek === 0) {
    // Sunday: skip Monday, go to Tuesday
    nextDate.setUTCDate(nextDate.getUTCDate() + 1); // Skip Monday
    drawDurationHours = SUNDAY_DRAW_DURATION_HOURS;
    console.log('📅 Sunday detected: Creating Tuesday draw with 48-hour window');
  }
  // Skip Sundays if configured (UTC)
  else if (excludeSundays && nextDate.getUTCDay() === 0) {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    console.log('📅 Sunday skip configured: Moving to Monday');
  }

  // Skip holidays
  while (isHoliday(nextDate)) {
    const day = String(nextDate.getUTCDate()).padStart(2, '0');
    const month = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const year = nextDate.getUTCFullYear();
    console.log(`🎉 Holiday detected: ${day}/${month}/${year} - Skipping to next day`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    
    // Re-check Sunday exclusion after skipping holiday
    if (excludeSundays && nextDate.getUTCDay() === 0) {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      console.log('📅 Sunday skip after holiday: Moving to Monday');
    }
  }

  // If the calculated draw time is still in the past, move to next day (UTC)
  while (nextDate.getTime() <= now) {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    
    // Re-check Sunday exclusion (UTC)
    while (excludeSundays && nextDate.getUTCDay() === 0) {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    }
    
    // Re-check holidays
    while (isHoliday(nextDate)) {
      const day = String(nextDate.getUTCDate()).padStart(2, '0');
      const month = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
      const year = nextDate.getUTCFullYear();
      console.log(`🎉 Holiday detected: ${day}/${month}/${year} - Skipping to next day`);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      
      // Re-check Sunday after skipping holiday
      if (excludeSundays && nextDate.getUTCDay() === 0) {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      }
    }
  }

  // Format next draw date (DD/MM/YYYY) using UTC
  const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');
  const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
  const nextYear = nextDate.getUTCFullYear();
  const nextDrawId = `${nextDay}/${nextMonth}/${nextYear}`;

  // Check if next draw already exists
  const existingNextDraw = await ctx.db
    .query("dailyDraws")
    .withIndex("by_drawId", (q: any) => q.eq("drawId", nextDrawId))
    .first();

  if (existingNextDraw) {
    return {
      success: true,
      message: baseDate ? "Next draw already exists" : "First draw already exists",
      next_draw: {
        date: nextDrawId,
        time: (() => {
          const d = new Date(existingNextDraw.drawingTime);
          return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        })(),
        already_exists: true
      }
    };
  }

  // Create new draw with dynamic duration
  const drawingTime = nextDate.getTime();
  const startTime = drawingTime - (drawDurationHours * 60 * 60 * 1000); // Dynamic hours before
  const endTime = drawingTime - (5 * 60 * 1000); // 5 minutes before drawing

  const newDrawId = await ctx.db.insert("dailyDraws", {
    drawId: nextDrawId,
    drawingTime,
    startTime,
    endTime,
    status: "active",
    totalTickets: 0,
    uniquePlayers: 0,
    currentPot: 0,
    ticketPrice: 10, // Default ticket price
    maxTickets: 1000, // Default max tickets
    drawDurationHours, // Store the duration for reference
    createdAt: now,
    updatedAt: now,
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[nextDate.getUTCDay()];
  
  return {
    success: true,
    message: baseDate ? "Next draw created successfully" : "First draw created successfully",
    next_draw: {
      date: nextDrawId,
      dayOfWeek: dayName,
      time: (() => {
        const d = new Date(drawingTime);
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      })(),
      draw_id: newDrawId,
      duration_hours: drawDurationHours,
      created: true
    }
  };
}

/**
 * Internal Action wrapper for checkAndIncrementDraw
 * Called from cron jobs (internalAction can call mutations)
 */
export const checkAndIncrementDrawInternal = internalAction({
  handler: async (ctx) => {
    // Call the internal helper function directly
    return await checkAndIncrementDrawHelper(ctx, process.env.ADMIN_SECRET || '');
  },
});

/**
 * Helper function for checkAndIncrementDraw
 * Can be called from both mutation and internalAction
 */
async function checkAndIncrementDrawHelper(ctx: any, adminSecret: string) {
  // Verify admin secret from database
  const config = await ctx.db
    .query("systemConfig")
    .filter((q: any) => q.eq(q.field("key"), "adminSecret"))
    .first();
  
  const ADMIN_SECRET = config?.value || "";
  if (adminSecret !== ADMIN_SECRET) {
    throw new Error("Invalid admin secret");
  }

  const now = Date.now();

  // Get the most recent draw
  const draws = await ctx.db
    .query("dailyDraws")
    .order("desc")
    .take(10);

  // Find the first non-completed draw
  const currentDraw = draws.find((d: any) => d.status !== "completed");

  if (!currentDraw) {
    // No draws exist, create the first one
    return await createNextDraw(ctx, now);
  }

  // Check if draw time has passed
  if (currentDraw.drawingTime > now) {
    const timeRemaining = currentDraw.drawingTime - now;
    return {
      success: true,
      message: "Current draw is still active",
      current_draw: {
        date: currentDraw.drawId,
        time: (() => {
          const d = new Date(currentDraw.drawingTime);
          return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        })(),
        time_remaining: timeRemaining
      }
    };
  }

  // Draw has passed, create next draw
  const currentDrawDate = new Date(currentDraw.drawingTime);
  return await createNextDraw(ctx, now, currentDrawDate);
}

/**
 * Check and increment draw (create next draw if current has passed)
 */
export const checkAndIncrementDraw = mutation({
  args: {
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    return await checkAndIncrementDrawHelper(ctx, args.adminSecret);
  },
});

/**
 * Scheduled Draw Updates
 * 
 * ⏰ TIME CRITICAL CODE
 * 
 * Automatically invalidates cache at exact draw time
 * Detects when admin changes draw time and adjusts schedule
 * 
 * Date Format: DD/MM/YYYY (e.g., "09/03/2026")
 * Time Format: HH:MM 24-hour (e.g., "21:40" or "22:00")
 * Timezone: UTC
 * 
 * ⚠️ DO NOT modify without:
 * 1. Testing cache invalidation timing
 * 2. Verifying Sunday skip logic
 * 3. Checking draw time change detection
 * 4. Ensuring cron job runs correctly
 * 
 * Dynamic Behavior: Reads draw time from database every minute
 * This allows admin to change draw time without code deployment
 */

import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Redis } from "@upstash/redis";
import { getZonedDateTimeParts } from "./timeHelpers";

/**
 * Redis client for cache invalidation
 */
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Redis not configured - cache auto-invalidation disabled');
    return null;
  }
  
  return new Redis({ url, token });
}

/**
 * Check every minute if we've reached draw time
 * Dynamically reads draw time from database
 */
export const checkAndInvalidateAtDrawTime = internalAction({
  handler: async (ctx) => {
    try {
      // Get App Timezone directly
      const tzConfig = await ctx.runQuery(internal.scheduledDrawUpdates.getAppTimezoneConfig);
      const appTimezone = (tzConfig?.value as string) || "Africa/Casablanca";

      const now = new Date();
      const tzParts = getZonedDateTimeParts(now, appTimezone);
      
      // Skip if today is Sunday (in the target timezone)
      if (tzParts.weekday === "Sunday") {
        return; // Silent skip on Sundays
      }
      
      // Get draw time from database
      const config = await ctx.runQuery(internal.scheduledDrawUpdates.getDrawTimeConfig);
      
      if (!config) {
        console.log('⚠️ No draw time config found, using default 21:40');
        return;
      }
      
      const drawTime = config.value as string;
      const [drawHour, drawMinute] = drawTime.split(':').map(Number);
      
      // Check if we're within 1 minute after draw time in the correct timezone!
      // Example: If draw is 22:00, this triggers at 22:00 or 22:01
      const isDrawTime = (tzParts.hour === drawHour && tzParts.minute === drawMinute) ||
                         (tzParts.hour === drawHour && tzParts.minute === drawMinute + 1);
      
      if (isDrawTime) {
        console.log(`🔄 Draw time reached (${drawTime} in ${appTimezone})! Invalidating cache...`);
        
        // Invalidate Redis cache
        const redis = getRedisClient();
        if (redis) {
          await redis.del('current_draw');
          await redis.del('winning_numbers_history');
          console.log('✅ Cache invalidated at draw time - users will see new draw');
        }
        
        // Also ensure next draw is created
        await ctx.runAction(internal.draws.checkAndIncrementDrawInternal);
        
        console.log('✅ Next draw ensured');
      } else {
        // Check if draw time has changed (admin might have updated it)
        const currentDrawTime = `${String(tzParts.hour).padStart(2, '0')}:${String(tzParts.minute).padStart(2, '0')}`;
        if (Math.abs(tzParts.hour - drawHour) === 0 && Math.abs(tzParts.minute - drawMinute) === 1) {
          // We're 1 minute away from draw time, pre-emptively check for changes
          console.log(`📅 Draw time check: ${drawTime}, current: ${currentDrawTime} (${appTimezone})`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking draw time:', error);
    }
  },
});

/**
 * Get draw time configuration
 */
export const getDrawTimeConfig = internalQuery({
  handler: async (ctx) => {
    const config = await ctx.db
      .query("systemConfig")
      .filter((q) => q.eq(q.field("key"), "default_draw_time"))
      .first();
    
    return config;
  },
});

/**
 * Get app timezone configuration
 */
export const getAppTimezoneConfig = internalQuery({
  handler: async (ctx) => {
    const config = await ctx.db
      .query("systemConfig")
      .filter((q) => q.eq(q.field("key"), "app_timezone"))
      .first();
    
    return config;
  },
});

/**
 * Ensure there's always an upcoming draw scheduled
 * Creates next draw if needed (skipping Sundays and holidays)
 */
export const ensureUpcomingDraw = internalAction({
  handler: async (ctx) => {
    try {
      console.log('🔍 Checking if upcoming draw exists...');
      
      // This will trigger the checkAndIncrementDraw logic
      // which automatically creates next draw if current has passed
      const result = await ctx.runAction(internal.draws.checkAndIncrementDrawInternal);
      
      console.log('✅ Upcoming draw check complete:', result.message);
    } catch (error) {
      console.error('❌ Error ensuring upcoming draw:', error);
    }
  },
});

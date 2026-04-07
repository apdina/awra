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

import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
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
 * Invalidate Redis cache and ensure next draw
 * Scheduled to run EXACTLY at draw time by runAt 
 */
export const invalidateCacheAtDrawTime = internalAction({
  args: {
    drawId: v.id("dailyDraws"),
    expectedTime: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`🔄 Draw time reached! Running scheduled invalidation task...`);
      
      // Verify the expected time matches the database
      const draw = await ctx.runQuery(internal.scheduledDrawUpdates.getDrawTimeById, { drawId: args.drawId });
      
      if (!draw) {
        console.log(`⚠️ Draw ${args.drawId} not found. Skipping cache invalidation.`);
        return;
      }
      
      if (draw.drawingTime !== args.expectedTime) {
        console.log(`⚠️ Draw time changed for ${args.drawId} (expected: ${args.expectedTime}, actual: ${draw.drawingTime}). Skipping cache invalidation as a new job should be scheduled.`);
        return;
      }

      // Invalidate Redis cache directly
      const redis = getRedisClient();
      if (redis) {
        await redis.del('current_draw');
        await redis.del('winning_numbers_history');
        console.log('✅ Cache invalidated at draw time - users will see new draw');
      }
      
      // Also ensure next draw is created
      await ctx.runMutation(internal.draws.checkAndIncrementDrawInternal);
      console.log('✅ Next draw ensured');
      
    } catch (error) {
      console.error('❌ Error in cache invalidation:', error);
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
 * Get draw time by ID (used for verifying scheduled tasks)
 */
export const getDrawTimeById = internalQuery({
  args: { drawId: v.id("dailyDraws") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.drawId);
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
      const result = await ctx.runMutation(internal.draws.checkAndIncrementDrawInternal);
      
      console.log('✅ Upcoming draw check complete:', result.message);
    } catch (error) {
      console.error('❌ Error ensuring upcoming draw:', error);
    }
  },
});

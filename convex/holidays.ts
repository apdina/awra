/**
 * Simple Holiday Exceptions System
 * 
 * Stores holiday dates in systemConfig as JSON array
 * Format: DD/MM/YYYY (e.g., "25/12/2025")
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_SECRET_KEY = "ADMIN_SECRET";
const HOLIDAYS_KEY = "holiday_exceptions";

/**
 * Add a holiday exception date
 */
export const addHoliday = mutation({
  args: {
    dateStr: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const adminConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", ADMIN_SECRET_KEY))
      .first();
    
    if (adminConfig?.value !== args.adminSecret) {
      throw new Error("Invalid admin secret");
    }

    // Get current holidays
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", HOLIDAYS_KEY))
      .first();

    let holidays: string[] = config ? JSON.parse(config.value as string) : [];
    
    // Add if not exists
    if (!holidays.includes(args.dateStr)) {
      holidays.push(args.dateStr);
      holidays.sort();
      
      if (config) {
        await ctx.db.patch(config._id, {
          value: JSON.stringify(holidays),
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("systemConfig", {
          key: HOLIDAYS_KEY,
          value: JSON.stringify(holidays),
          description: "Holiday exception dates (DD/MM/YYYY)",
          updatedAt: Date.now(),
        });
      }
    }
    
    // If a holiday was successfully added, we must delete any "upcoming" draws
    // that might have already been created for this date, so the system recalculates
    // the next valid draw and skips the holiday.
    const upcomingDraws = await ctx.db
      .query("dailyDraws")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();
      
    // Delete all upcoming draws to be safe and force a clean recalculation
    for (const draw of upcomingDraws) {
      await ctx.db.delete(draw._id);
    }
    
    // Invalidate caches and trigger recreation of the next draw
    try {
      const internalApi = (await import("./_generated/api.js")).internal;
      await ctx.scheduler.runAfter(0, internalApi.draws.invalidateCurrentDrawCacheInternal);
      await ctx.scheduler.runAfter(0, internalApi.draws.invalidateTicketCachesInternal);
      await ctx.scheduler.runAfter(100, internalApi.scheduledDrawUpdates.ensureUpcomingDraw);
    } catch (e) {
      console.error("Failed to trigger cache invalidation or upcoming draw creation", e);
    }

    return { success: true, holidays };
  },
});

/**
 * Remove a holiday exception date
 */
export const removeHoliday = mutation({
  args: {
    dateStr: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const adminConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", ADMIN_SECRET_KEY))
      .first();
    
    if (adminConfig?.value !== args.adminSecret) {
      throw new Error("Invalid admin secret");
    }

    // Get current holidays
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", HOLIDAYS_KEY))
      .first();

    if (!config) {
      return { success: true, holidays: [] };
    }

    const holidays: string[] = JSON.parse(config.value as string);
    const filtered = holidays.filter(d => d !== args.dateStr);
    
    await ctx.db.patch(config._id, {
      value: JSON.stringify(filtered),
      updatedAt: Date.now(),
    });

    // We also delete all "upcoming" draws when a holiday is removed
    // so that the system can properly schedule a draw on the newly available day
    const upcomingDraws = await ctx.db
      .query("dailyDraws")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();
      
    for (const draw of upcomingDraws) {
      await ctx.db.delete(draw._id);
    }
    
    // Invalidate caches and trigger recreation of the next draw
    try {
      const internalApi = (await import("./_generated/api.js")).internal;
      await ctx.scheduler.runAfter(0, internalApi.draws.invalidateCurrentDrawCacheInternal);
      await ctx.scheduler.runAfter(0, internalApi.draws.invalidateTicketCachesInternal);
      await ctx.scheduler.runAfter(100, internalApi.scheduledDrawUpdates.ensureUpcomingDraw);
    } catch (e) {
      console.error("Failed to trigger cache invalidation or upcoming draw creation", e);
    }

    return { success: true, holidays: filtered };
  },
});

/**
 * Get all holiday exception dates
 */
export const getHolidays = query({
  handler: async (ctx) => {
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", HOLIDAYS_KEY))
      .first();

    if (!config) {
      return [];
    }

    return JSON.parse(config.value as string) as string[];
  },
});

/**
 * Check if a date is a holiday
 */
export const isHoliday = query({
  args: { dateStr: v.string() },
  handler: async (ctx, args) => {
    const holidays = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", HOLIDAYS_KEY))
      .first();

    if (!holidays) {
      return false;
    }

    const list: string[] = JSON.parse(holidays.value as string);
    return list.includes(args.dateStr);
  },
});

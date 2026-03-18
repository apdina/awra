/**
 * Simple Holiday Exceptions System
 * 
 * Stores holiday dates in systemConfig as JSON array
 * Format: DD/MM/YYYY (e.g., "25/12/2025")
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_SECRET_KEY = "adminSecret";
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

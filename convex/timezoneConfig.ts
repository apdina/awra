/**
 * Timezone Configuration Management
 * 
 * Stores and retrieves the app timezone from systemConfig
 * Handles timezone-aware date calculations
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { createDateInTimezone, formatToDateString, getZonedDateTimeParts, getAppTimezone as getAppTimezoneHelper } from "./timeHelpers";

/**
 * Get the configured app timezone
 * Default: UTC
 * Can be any IANA timezone (e.g., "Africa/Casablanca")
 */
export const getAppTimezone = query({
  handler: async (ctx) => {
    const config = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq(q.field("key"), "app_timezone"))
      .first();
    
    return (config?.value as string) || "UTC";
  }
});

/**
 * Set the app timezone
 * Admin only
 */
export const setAppTimezone = mutation({
  args: {
    timezone: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin secret
    const adminSecretConfig = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq(q.field("key"), "ADMIN_SECRET"))
      .first();
    
    if (args.adminSecret !== adminSecretConfig?.value) {
      throw new Error("Unauthorized");
    }
    
    // Validate timezone
    const validTimezones = [
      'UTC', 'Africa/Casablanca', 'Africa/Cairo', 'Africa/Johannesburg',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin',
      'America/New_York', 'America/Los_Angeles',
      'Asia/Dubai', 'Asia/Bangkok', 'Asia/Singapore',
      'Australia/Sydney'
    ];
    
    if (!validTimezones.includes(args.timezone)) {
      throw new Error(`Invalid timezone: ${args.timezone}`);
    }
    
    // Update or create timezone config
    const existing = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq(q.field("key"), "app_timezone"))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.timezone,
        updatedAt: Date.now()
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "app_timezone",
        value: args.timezone,
        updatedAt: Date.now()
      });
    }
    
    console.log(`✅ App timezone set to: ${args.timezone}`);
    
    return {
      success: true,
      timezone: args.timezone,
      message: `Timezone changed to ${args.timezone}`
    };
  }
});

/**
 * Get current time in app timezone
 * Returns formatted date, time, and day of week
 */
export const getCurrentTimeInAppTimezone = query({
  handler: async (ctx) => {
    // Get timezone from systemConfig
    const timezoneConfig = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq(q.field("key"), "app_timezone"))
      .first();
    
    const timezone = (timezoneConfig?.value as string) || "UTC";
    const now = Date.now();
    const date = new Date(now);
    
    // Format using Intl API
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });
    
    const dateParts = dateFormatter.formatToParts(date);
    const year = dateParts.find(p => p.type === 'year')?.value;
    const month = dateParts.find(p => p.type === 'month')?.value;
    const day = dateParts.find(p => p.type === 'day')?.value;
    
    return {
      date: `${day}/${month}/${year}`,
      time: timeFormatter.format(date),
      dayOfWeek: dayFormatter.format(date),
      timezone: timezone,
      timestamp: now
    };
  }
});

/**
 * Format a UTC timestamp in app timezone
 */
export const formatTimestampInAppTimezone = query({
  args: {
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Get timezone from systemConfig
    const timezoneConfig = await ctx.db
      .query("systemConfig")
      .filter((q: any) => q.eq(q.field("key"), "app_timezone"))
      .first();
    
    const timezone = (timezoneConfig?.value as string) || "UTC";
    const date = new Date(args.timestamp);
    
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const dateParts = dateFormatter.formatToParts(date);
    const year = dateParts.find(p => p.type === 'year')?.value;
    const month = dateParts.find(p => p.type === 'month')?.value;
    const day = dateParts.find(p => p.type === 'day')?.value;
    
    return {
      date: `${day}/${month}/${year}`,
      time: timeFormatter.format(date),
      timezone: timezone
    };
  }
});

/**
 * Check if a draw time has passed in app timezone
 */
export const hasDrawTimePassed = query({
  args: {
    drawDate: v.string(), // DD/MM/YYYY
    drawTime: v.string(), // HH:MM
  },
  handler: async (ctx, args) => {
    const timezone = await getAppTimezoneHelper(ctx.db);
    const now = Date.now();
    
    // Parse draw date and time
    const [day, month, year] = args.drawDate.split('/').map(Number);
    const [hours, minutes] = args.drawTime.split(':').map(Number);
    
    // Create exact draw time in target timezone
    const exactDrawTime = createDateInTimezone(year, month, day, hours, minutes, timezone);
    const hasPassed = now > exactDrawTime.getTime();
    
    // Formatted current time string just for debug return value
    const p = getZonedDateTimeParts(new Date(now), timezone);

    return {
      hasPassed,
      drawDateTime: exactDrawTime.toISOString(),
      currentTimeInTz: `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`,
      timezone: timezone
    };
  }
});

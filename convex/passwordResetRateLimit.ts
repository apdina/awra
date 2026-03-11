/**
 * Password Reset Rate Limiting
 * 
 * Prevents spam and brute force attacks on password reset:
 * - Maximum 3 reset requests per email per hour
 * - Automatic cleanup of old rate limit records
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Check if an email can request a password reset
 */
export const canRequestPasswordReset = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Find rate limit record for this email
    const rateLimitRecord = await ctx.db
      .query("passwordResetRateLimits")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!rateLimitRecord) {
      return { allowed: true, requestsRemaining: 3 };
    }

    // Check if window has expired
    if (rateLimitRecord.windowStart < oneHourAgo) {
      // Window expired, reset
      return { allowed: true, requestsRemaining: 3 };
    }

    // Check if limit exceeded
    if (rateLimitRecord.requestCount >= 3) {
      const resetTime = rateLimitRecord.windowStart + (60 * 60 * 1000);
      const minutesRemaining = Math.ceil((resetTime - now) / 60000);
      
      return {
        allowed: false,
        requestsRemaining: 0,
        resetTime,
        minutesRemaining,
      };
    }

    return {
      allowed: true,
      requestsRemaining: 3 - rateLimitRecord.requestCount,
    };
  },
});

/**
 * Record a password reset request
 */
export const recordPasswordResetRequest = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Find existing rate limit record
    const rateLimitRecord = await ctx.db
      .query("passwordResetRateLimits")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!rateLimitRecord) {
      // Create new record
      await ctx.db.insert("passwordResetRateLimits", {
        email: args.email,
        requestCount: 1,
        windowStart: now,
        lastRequestAt: now,
      });
    } else if (rateLimitRecord.windowStart < oneHourAgo) {
      // Window expired, reset
      await ctx.db.patch(rateLimitRecord._id, {
        requestCount: 1,
        windowStart: now,
        lastRequestAt: now,
      });
    } else {
      // Increment counter
      await ctx.db.patch(rateLimitRecord._id, {
        requestCount: rateLimitRecord.requestCount + 1,
        lastRequestAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Cleanup old rate limit records (older than 24 hours)
 */
export const cleanupOldRateLimits = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const oldRecords = await ctx.db
      .query("passwordResetRateLimits")
      .filter((q) => q.lt(q.field("windowStart"), oneDayAgo))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    console.log(`🧹 Cleaned up ${oldRecords.length} old password reset rate limit records`);
    return { cleaned: oldRecords.length };
  },
});

/**
 * Admin Lockout System
 * 
 * Implements account lockout protection for admin accounts:
 * - Tracks failed login attempts per IP
 * - Locks IP after 5 failed attempts
 * - 15-minute lockout duration
 * - Automatic cleanup of expired lockouts
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Check if an IP is currently locked out
 */
export const isAdminLockedOut = query({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Find active lockout for this IP
    const lockout = await ctx.db
      .query("adminLockouts")
      .withIndex("by_ip", (q) => q.eq("ipAddress", args.ipAddress))
      .first();

    if (!lockout) {
      return { locked: false };
    }

    // Check if lockout has expired
    if (lockout.lockedUntil < now) {
      // Lockout expired (cleanup handled by cleanupExpiredLockouts mutation)
      return { locked: false };
    }

    // Still locked
    const remainingMs = lockout.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      locked: true,
      lockedUntil: lockout.lockedUntil,
      remainingMinutes,
      reason: lockout.reason,
      failedAttempts: lockout.failedAttempts,
    };
  },
});

/**
 * Record a failed admin login attempt
 */
export const recordFailedAdminLogin = mutation({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);

    // Count recent failed attempts from this IP
    const recentAttempts = await ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", fifteenMinutesAgo))
      .filter((q) =>
        q.and(
          q.eq(q.field("ipAddress"), args.ipAddress),
          q.eq(q.field("success"), false)
        )
      )
      .collect();

    const failedCount = recentAttempts.length + 1; // +1 for current attempt

    // If 5+ failed attempts, create lockout
    if (failedCount >= 5) {
      // Check if lockout already exists
      const existingLockout = await ctx.db
        .query("adminLockouts")
        .withIndex("by_ip", (q) => q.eq("ipAddress", args.ipAddress))
        .first();

      if (existingLockout && existingLockout.lockedUntil > now) {
        // Update existing lockout
        await ctx.db.patch(existingLockout._id, {
          lockedUntil: now + (15 * 60 * 1000),
          failedAttempts: failedCount,
        });
      } else {
        // Create new lockout
        await ctx.db.insert("adminLockouts", {
          ipAddress: args.ipAddress,
          lockedUntil: now + (15 * 60 * 1000), // 15 minute lockout
          reason: `Too many failed login attempts (${failedCount} attempts)`,
          failedAttempts: failedCount,
          createdAt: now,
        });
      }

      console.log(`🔒 Admin IP locked out: ${args.ipAddress} (${failedCount} failed attempts)`);
    }

    return { failedCount };
  },
});

/**
 * Record a successful admin login
 */
export const recordSuccessfulAdminLogin = mutation({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Clear any lockout for this IP
    const lockout = await ctx.db
      .query("adminLockouts")
      .withIndex("by_ip", (q) => q.eq("ipAddress", args.ipAddress))
      .first();

    if (lockout) {
      await ctx.db.delete(lockout._id);
      console.log(`✅ Admin lockout cleared for IP: ${args.ipAddress}`);
    }

    return { success: true };
  },
});

/**
 * Cleanup expired lockouts (run periodically)
 */
export const cleanupExpiredLockouts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredLockouts = await ctx.db
      .query("adminLockouts")
      .withIndex("by_locked_until", (q) => q.lt("lockedUntil", now))
      .collect();

    for (const lockout of expiredLockouts) {
      await ctx.db.delete(lockout._id);
    }

    console.log(`🧹 Cleaned up ${expiredLockouts.length} expired admin lockouts`);
    return { cleaned: expiredLockouts.length };
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Login Attempt Tracking for Account Lockout
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Internal helper function
async function recordFailedAttemptInternal(ctx: any, email: string) {
  const now = Date.now();
  const windowStart = now - LOCKOUT_DURATION;

  // Find existing tracking record
  let tracking = await ctx.db
    .query("loginAttempts")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();

  if (!tracking) {
    // Create new tracking record
    await ctx.db.insert("loginAttempts", {
      email,
      failedAttempts: 1,
      lastAttemptAt: now,
      lockedUntil: undefined,
      attemptTimestamps: [now],
    });
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
  }

  // Check if currently locked
  if (tracking.lockedUntil && tracking.lockedUntil > now) {
    return {
      isLocked: true,
      lockedUntil: tracking.lockedUntil,
      remainingAttempts: 0,
    };
  }

  // Filter attempts within the window
  const recentAttempts = tracking.attemptTimestamps.filter(
    (timestamp: number) => timestamp > windowStart
  );
  recentAttempts.push(now);

  const failedCount = recentAttempts.length;
  const isLocked = failedCount >= MAX_FAILED_ATTEMPTS;

  // Update tracking record
  await ctx.db.patch(tracking._id, {
    failedAttempts: failedCount,
    lastAttemptAt: now,
    lockedUntil: isLocked ? now + LOCKOUT_DURATION : undefined,
    attemptTimestamps: recentAttempts,
  });

  return {
    isLocked,
    lockedUntil: isLocked ? now + LOCKOUT_DURATION : undefined,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedCount),
  };
}

// Internal helper function
async function isAccountLockedInternal(ctx: any, email: string) {
  const tracking = await ctx.db
    .query("loginAttempts")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();

  if (!tracking) {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const now = Date.now();

  // Check if locked
  if (tracking.lockedUntil && tracking.lockedUntil > now) {
    return {
      isLocked: true,
      lockedUntil: tracking.lockedUntil,
      remainingAttempts: 0,
    };
  }

  // Count recent attempts
  const windowStart = now - LOCKOUT_DURATION;
  const recentAttempts = tracking.attemptTimestamps.filter(
    (timestamp: number) => timestamp > windowStart
  );

  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - recentAttempts.length),
  };
}

// Internal helper function
async function clearFailedAttemptsInternal(ctx: any, email: string) {
  const tracking = await ctx.db
    .query("loginAttempts")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();

  if (tracking) {
    await ctx.db.delete(tracking._id);
  }

  return { success: true };
}

// Export internal functions
export { recordFailedAttemptInternal, isAccountLockedInternal, clearFailedAttemptsInternal };

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = mutation({
  args: {
    email: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - LOCKOUT_DURATION;

    // Find existing tracking record
    let tracking = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!tracking) {
      // Create new tracking record
      await ctx.db.insert("loginAttempts", {
        email: args.email,
        failedAttempts: 1,
        lastAttemptAt: now,
        lockedUntil: undefined,
        attemptTimestamps: [now],
      });
      return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
    }

    // Check if currently locked
    if (tracking.lockedUntil && tracking.lockedUntil > now) {
      return {
        isLocked: true,
        lockedUntil: tracking.lockedUntil,
        remainingAttempts: 0,
      };
    }

    // Filter attempts within the window
    const recentAttempts = tracking.attemptTimestamps.filter(
      (timestamp) => timestamp > windowStart
    );
    recentAttempts.push(now);

    const failedCount = recentAttempts.length;
    const isLocked = failedCount >= MAX_FAILED_ATTEMPTS;

    // Update tracking record
    await ctx.db.patch(tracking._id, {
      failedAttempts: failedCount,
      lastAttemptAt: now,
      lockedUntil: isLocked ? now + LOCKOUT_DURATION : undefined,
      attemptTimestamps: recentAttempts,
    });

    return {
      isLocked,
      lockedUntil: isLocked ? now + LOCKOUT_DURATION : undefined,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedCount),
    };
  },
});

/**
 * Check if an account is locked
 */
export const isAccountLocked = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const tracking = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!tracking) {
      return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }

    const now = Date.now();

    // Check if locked
    if (tracking.lockedUntil && tracking.lockedUntil > now) {
      return {
        isLocked: true,
        lockedUntil: tracking.lockedUntil,
        remainingAttempts: 0,
      };
    }

    // Count recent attempts
    const windowStart = now - LOCKOUT_DURATION;
    const recentAttempts = tracking.attemptTimestamps.filter(
      (timestamp) => timestamp > windowStart
    );

    return {
      isLocked: false,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - recentAttempts.length),
    };
  },
});

/**
 * Clear failed attempts (on successful login)
 */
export const clearFailedAttempts = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const tracking = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (tracking) {
      await ctx.db.delete(tracking._id);
    }

    return { success: true };
  },
});

/**
 * Cleanup old login attempt records (run periodically)
 */
export const cleanupOldAttempts = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago

    const oldRecords = await ctx.db
      .query("loginAttempts")
      .filter((q) => q.lt(q.field("lastAttemptAt"), cutoff))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return { deleted: oldRecords.length };
  },
});

/**
 * Audit Log Mutations
 * 
 * Handles audit logging operations for security events,
 * authentication events, and admin actions.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Log an audit event
 */
export const logEvent = mutation({
  args: {
    eventType: v.string(),
    status: v.union(v.literal("success"), v.literal("failure"), v.literal("blocked")),
    message: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    details: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("auditLogs", {
      eventType: args.eventType,
      status: args.status,
      message: args.message,
      severity: args.severity,
      userId: args.userId,
      email: args.email,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      details: args.details,
      timestamp: Date.now(),
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const logLevel = args.severity === "critical" ? "error" : "log";
      console[logLevel as "log" | "error"]("[AUDIT]", {
        event: args.eventType,
        status: args.status,
        user: args.email || args.userId,
        ip: args.ipAddress,
        message: args.message,
      });
    }

    return { success: true, logId };
  },
});

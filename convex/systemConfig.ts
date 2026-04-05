import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get configuration value from systemConfig
 */
export const getConfig = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();
    
    return config;
  },
});

/**
 * Get configuration by key (alias for getConfig)
 */
export const getByKey = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();
    
    return config;
  },
});

/**
 * Get admin secret
 */
export const getAdminSecret = query({
  handler: async (ctx) => {
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "ADMIN_SECRET"))
      .first();
    
    return config;
  },
});

/**
 * Update draw configuration
 */
export const updateDrawConfig = mutation({
  args: {
    defaultDrawTime: v.string(),
    excludeSundays: v.boolean(),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin secret
    const adminConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "adminSecret"))
      .first();
    
    if (!adminConfig || adminConfig.value !== args.adminSecret) {
      return { success: false, error: "Invalid admin secret" };
    }

    try {
      // Update default draw time
      const defaultTimeConfig = await ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q: any) => q.eq("key", "default_draw_time"))
        .first();
      
      if (defaultTimeConfig) {
        await ctx.db.patch(defaultTimeConfig._id, {
          value: args.defaultDrawTime,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("systemConfig", {
          key: "default_draw_time",
          value: args.defaultDrawTime,
          description: "Default time for new draws (HH:MM format)",
          updatedAt: Date.now(),
        });
      }

      // Update Sunday exclusion
      const excludeSundaysConfig = await ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q: any) => q.eq("key", "exclude_sundays"))
        .first();
      
      if (excludeSundaysConfig) {
        await ctx.db.patch(excludeSundaysConfig._id, {
          value: args.excludeSundays,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("systemConfig", {
          key: "exclude_sundays",
          value: args.excludeSundays,
          description: "Whether to exclude Sundays from draws (creates 48H weekend window)",
          updatedAt: Date.now(),
        });
      }

      return { 
        success: true, 
        message: "Draw configuration updated successfully" 
      };

    } catch (error) {
      console.error("Error updating draw config:", error);
      return { success: false, error: "Failed to update configuration" };
    }
  },
});

/**
 * Get all system configuration values
 */
export const getAllConfig = query({
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("systemConfig")
      .collect();
    
    return configs;
  },
});

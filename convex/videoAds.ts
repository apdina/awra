/**
 * Simple Video Ads System - Direct Avatar Unlock
 * 
 * Logic: User watches video → Update profile to allow special avatars
 * No coins needed - direct profile update
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Check if user can watch a video ad for AVATAR unlock (separate from chat videos)
export const canWatchVideo = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { canWatch: false, reason: "not_authenticated" };

    // Try to find user by email first (for email/password users)
    let user = null;
    if (identity.email) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
        .first();
    }

    // If not found by email, try by OAuth
    if (!user && identity.provider && identity.subject) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_oauth", (q: any) => 
          q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
        )
        .first();
    }

    if (!user) return { canWatch: false, reason: "user_not_found" };

    // For AVATAR videos: check if user already has special avatar access
    if (user.avatarType === "special") {
      return { canWatch: false, reason: "already_unlocked" };
    }

    // User can watch avatar video
    return { canWatch: true, reason: "available" };
  },
});

// Check if user can watch a video ad for CHAT (separate from avatar videos)
export const canWatchChatVideo = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { canWatch: false, reason: "not_authenticated" };

    // Try to find user by email first (for email/password users)
    let user = null;
    if (identity.email) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
        .first();
    }

    // If not found by email, try by OAuth
    if (!user && identity.provider && identity.subject) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_oauth", (q: any) => 
          q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
        )
        .first();
    }

    if (!user) return { canWatch: false, reason: "user_not_found" };

    // For CHAT videos: always allow (no cooldown, no restrictions)
    // User can watch anytime they hit the 3-message limit
    return { canWatch: true, reason: "available" };
  },
});

// Start a video watch session (placeholder)
export const startVideoWatch = mutation({
  args: {
    userId: v.id("userProfiles"), // Required: User ID from client
    adProvider: v.string(), // Required: "admob", "unity", "custom", "placeholder"
    adUnitId: v.string(), // Required: Specific ad unit identifier
    videoId: v.optional(v.string()), // Optional: Unique video identifier from platform
  },
  handler: async (ctx, args) => {
    console.log("[videoAds:startVideoWatch] Starting video watch for user:", args.userId);

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create video watch session record for tracking
    const watchId = await ctx.db.insert("videoAdWatches", {
      userId: args.userId,
      adProvider: args.adProvider,
      adUnitId: args.adUnitId,
      videoId: args.videoId,
      coinsEarned: 0, // No coins needed for avatar unlock
      watchedAt: Date.now(),
      completionRate: 0, // Will be updated on completion
      rewardClaimed: false,
    });

    console.log("[videoAds:startVideoWatch] Created watch session:", watchId);

    return { 
      success: true, 
      watchId,
      message: `Video watch session started with ${args.adProvider}`,
      adProvider: args.adProvider,
      adUnitId: args.adUnitId
    };
  },
});

// Complete a video watch and update profile with selected special avatar
export const completeVideoWatch = mutation({
  args: {
    userId: v.id("userProfiles"), // Required: User ID from client
    watchId: v.id("videoAdWatches"), // Required: Session ID from startVideoWatch
    watchDuration: v.number(), // Required: Actual watch duration in seconds
    completionRate: v.number(), // Required: Completion percentage (0-100)
    selectedAvatar: v.string(), // Required: Which special avatar user wants (sp1-sp10)
  },
  handler: async (ctx, args) => {
    console.log("[videoAds:completeVideoWatch] Called with userId:", args.userId, "watchId:", args.watchId);

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.error("[videoAds:completeVideoWatch] User not found:", args.userId);
      throw new Error("User not found");
    }
    console.log("[videoAds:completeVideoWatch] Found user:", user._id, "email:", user.email);

    // Get the watch session
    const watchSession = await ctx.db.get(args.watchId);
    console.log("[videoAds:completeVideoWatch] Watch session:", watchSession?._id, "userId:", watchSession?.userId);
    if (!watchSession || watchSession.userId !== args.userId) {
      console.error("[videoAds:completeVideoWatch] Invalid watch session. Expected user:", args.userId, "got:", watchSession?.userId);
      throw new Error("Invalid watch session");
    }

    if (watchSession.rewardClaimed) {
      console.error("[videoAds:completeVideoWatch] Video already completed:", args.watchId);
      throw new Error("Video already completed");
    }

    // For chat reward, just update lastChatVideoWatchAt (don't change avatar)
    if (args.selectedAvatar === "chat_reward") {
      console.log("[videoAds:completeVideoWatch] Processing chat reward for user:", args.userId);
      await ctx.db.patch(args.userId, {
        lastChatVideoWatchAt: Date.now(),
        totalVideosWatched: (user.totalVideosWatched || 0) + 1,
      });
      console.log("[videoAds:completeVideoWatch] Updated lastChatVideoWatchAt for user:", args.userId);
    } else {
      // Validate selected avatar for special avatar unlock
      const validSpecialAvatars = ['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6', 'sp7', 'sp8', 'sp9', 'sp10'];
      if (!validSpecialAvatars.includes(args.selectedAvatar)) {
        throw new Error("Invalid special avatar selection");
      }

      // Update user profile with the selected special avatar AND unlock access
      await ctx.db.patch(args.userId, {
        avatarName: args.selectedAvatar, // Set the specific avatar user selected
        avatarType: "special", // Mark as special avatar type
        lastVideoWatchAt: Date.now(),
        videosWatchedToday: (user.videosWatchedToday || 0) + 1,
        totalVideosWatched: (user.totalVideosWatched || 0) + 1,
      });
    }

    // Update the video watch record
    await ctx.db.patch(args.watchId, {
      watchedAt: Date.now(),
      completionRate: args.completionRate,
      coinsEarned: 0, // No coins needed - avatar is the reward
      rewardClaimed: true,
    });

    console.log("[videoAds:completeVideoWatch] Successfully completed video watch");

    return { 
      success: true, 
      message: `Special avatar ${args.selectedAvatar} unlocked! Watched ${args.watchDuration}s with ${args.completionRate}% completion via ${watchSession.adProvider}`,
      adProvider: watchSession.adProvider,
      adUnitId: watchSession.adUnitId,
      selectedAvatar: args.selectedAvatar,
      watchDuration: args.watchDuration,
      completionRate: args.completionRate
    };
  },
});

// Get user's video stats and special avatar access
export const getVideoStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Try to find user by email first (for email/password users)
    let user = null;
    if (identity.email) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
        .first();
    }

    // If not found by email, try by OAuth
    if (!user && identity.provider && identity.subject) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_oauth", (q: any) => 
          q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
        )
        .first();
    }

    if (!user) return null;

    // Check if user has special avatar access (based on having watched a video)
    const hasSpecialAvatarAccess = user.totalVideosWatched && user.totalVideosWatched > 0;

    return {
      totalWatches: user.totalVideosWatched || 0,
      hasSpecialAvatarAccess,
      unlockedAt: user.lastVideoWatchAt,
      lastWatch: user.lastVideoWatchAt,
    };
  },
});

// Get video ad configuration (placeholder for future ad platform)
export const getVideoAdConfig = query({
  handler: async (ctx) => {
    return {
      enabled: true,
      supportedProviders: ["admob", "unity", "custom", "placeholder"],
      rewardType: "special_avatar_access",
      cooldownHours: 24,
      minimumWatchSeconds: 30,
      minimumCompletionRate: 80,
      placeholderMode: true,
      message: "Ready for ad platform integration when available"
    };
  },
});

// Get ad platform analytics (for admin dashboard)
export const getAdPlatformAnalytics = query({
  args: {
    dateRange: v.optional(v.number()), // Optional: Days to look back (default: 30)
  },
  handler: async (ctx, args) => {
    const days = args.dateRange || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const watches = await ctx.db
      .query("videoAdWatches")
      .withIndex("by_claimed", (q) => q.eq("rewardClaimed", true).gt("watchedAt", cutoff))
      .collect();

    // Group by ad provider
    const providerStats = watches.reduce((stats, watch) => {
      const provider = watch.adProvider || "unknown";
      if (!stats[provider]) {
        stats[provider] = {
          totalWatches: 0,
          totalDuration: 0,
          avgCompletionRate: 0,
          revenue: 0, // Will be calculated based on platform rates
        };
      }
      
      stats[provider].totalWatches += 1;
      stats[provider].totalDuration += watch.completionRate || 0;
      stats[provider].avgCompletionRate = 
        stats[provider].totalDuration / stats[provider].totalWatches;
      
      return stats;
    }, {} as Record<string, {
      totalWatches: number;
      totalDuration: number;
      avgCompletionRate: number;
      revenue: number;
    }>);

    // Calculate estimated revenue (placeholder rates)
    const revenueRates = {
      admob: 0.02, // $0.02 per completed view
      unity: 0.018, // $0.018 per completed view
      custom: 0.025, // $0.025 per completed view
      placeholder: 0, // No revenue for placeholder
      unknown: 0,
    };

    Object.keys(providerStats).forEach(provider => {
      providerStats[provider].revenue = 
        providerStats[provider].totalWatches * (revenueRates[provider as keyof typeof revenueRates] || 0);
    });

    return {
      dateRange: days,
      totalCompletedWatches: watches.length,
      providerStats,
      totalRevenue: Object.values(providerStats).reduce((sum, stat) => sum + stat.revenue, 0),
      generatedAt: Date.now(),
    };
  },
});

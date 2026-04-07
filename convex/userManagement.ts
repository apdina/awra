import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./auth";

// Search users by display name or email
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, limit = 20 } = args;
    
    // Utilize the Convex native Search Index for blazingly fast querying
    const searchResults = await ctx.db
      .query("userProfiles")
      .withSearchIndex("search_displayName", (q) => q.search("displayName", searchTerm))
      .take(limit);

    // If using search on email, Convex search index matches text, but since we didn't index email
    // for fulltext, fallback filters are kept light, or we just rely on exact email lookups elsewhere.
    // For general UI searches, displayName is usually what users use.
    
    return searchResults;
  },
});

// Get users with pagination
export const getUsersWithPagination = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    
    // Get users with pagination
    const users = await ctx.db.query("userProfiles").order("desc").take(paginationOpts.numItems);
    
    return users;
  },
});

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    
    // Efficiently find user via indexed match
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    return user || null;
  },
});

// Update user ban status
export const updateUserBanStatus = mutation({
  args: {
    userId: v.id("userProfiles"),
    isBanned: v.boolean(),
    bannedBy: v.optional(v.id("userProfiles")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, isBanned, bannedBy, reason } = args;
    
    // Get the user to update
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update ban status
    await ctx.db.patch(userId, {
      isBanned,
    });
    
    // Log the ban action (optional - could create a separate adminLogs table)
    console.log(`User ${user.displayName} (${user.email}) ${isBanned ? 'banned' : 'unbanned'} by ${bannedBy || 'admin'}. Reason: ${reason || 'No reason provided'}`);
    
    return { success: true };
  },
});

// Update user moderator status
export const updateUserModeratorStatus = mutation({
  args: {
    userId: v.id("userProfiles"),
    isModerator: v.boolean(),
    updatedBy: v.optional(v.id("userProfiles")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, isModerator, updatedBy, reason } = args;
    
    // Get the user to update
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Prevent modifying admin users
    if (user.isAdmin) {
      throw new Error("Cannot modify moderator status of admin users");
    }
    
    // Update moderator status
    await ctx.db.patch(userId, {
      isModerator,
    });
    
    // Log the action
    console.log(`User ${user.displayName} (${user.email}) ${isModerator ? 'granted' : 'revoked'} moderator status by ${updatedBy || 'admin'}. Reason: ${reason || 'No reason provided'}`);
    
    return { success: true };
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    
    // Check if user is admin or moderator
    if (!authUser.isAdmin && !authUser.isModerator) {
      throw new Error("Unauthorized. Admin or moderator access required.");
    }
    
    const { limit = 50 } = args;
    
    // Get all users with pagination
    const users = await ctx.db.query("userProfiles").order("desc").take(limit);
    
    return users;
  },
});

// Get user statistics (admin only)
export const getUserStats = query({
  handler: async (ctx) => {
    const authUser = await requireAuth(ctx);
    
    // Check if user is admin or moderator
    if (!authUser.isAdmin && !authUser.isModerator) {
      throw new Error("Unauthorized. Admin or moderator access required.");
    }
    
    // Get all users
    const allUsers = await ctx.db.query("userProfiles").collect();
    
    // Calculate statistics
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.isActive).length,
      bannedUsers: allUsers.filter(u => u.isBanned).length,
      adminUsers: allUsers.filter(u => u.isAdmin).length,
      moderatorUsers: allUsers.filter(u => u.isModerator).length,
      totalCoins: allUsers.reduce((sum, u) => sum + (u.coinBalance || 0), 0),
      totalWinnings: allUsers.reduce((sum, u) => sum + (u.totalWinnings || 0), 0),
      totalSpent: allUsers.reduce((sum, u) => sum + (u.totalSpent || 0), 0),
    };
    
    return stats;
  },
});

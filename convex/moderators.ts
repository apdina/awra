import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all moderators
export const getModerators = query({
  handler: async (ctx) => {
    const moderators = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("isModerator"), true))
      .collect();

    return moderators.map(mod => ({
      _id: mod._id,
      email: mod.email,
      displayName: mod.displayName,
      isActive: mod.isActive,
      createdAt: mod.createdAt,
    }));
  },
});

// Make a user a moderator
export const makeModerator = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    // Check if already a moderator
    if (user.isModerator) {
      throw new Error(`User ${user.displayName} is already a moderator`);
    }

    // Make user a moderator
    await ctx.db.patch(user._id, {
      isModerator: true,
    });

    return {
      success: true,
      message: `${user.displayName} is now a moderator`,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  },
});

// Remove moderator status
export const removeModerator = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    // Check if is a moderator
    if (!user.isModerator) {
      throw new Error(`User ${user.displayName} is not a moderator`);
    }

    // Remove moderator status
    await ctx.db.patch(user._id, {
      isModerator: false,
    });

    return {
      success: true,
      message: `Moderator status removed from ${user.displayName}`,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  },
});

// Search users by email (for admin to find users to promote)
export const searchUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.email || args.email.length < 3) {
      return null;
    }

    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      isModerator: user.isModerator || false,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  },
});

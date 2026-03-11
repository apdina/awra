import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Re-export native auth functions
export { 
  getCurrentUser,
  getCurrentUserByToken,
  requireAuth,
  requireAdmin,
  updateProfile,
  changePassword,
  registerWithEmail,
  loginWithEmail,
  registerWithOAuth,
  ensureUserProfile
} from "./native_auth";

// Helper function to safely get string values from identity
function getIdentityString(value: any): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

// Update user presence (compatible with new schema)
// Supports both Convex auth and direct userId for native auth
export const updatePresence = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
    currentRoomId: v.optional(v.string()),
    isTyping: v.boolean(),
    // Optional userId for native auth (when Convex auth isn't available)
    userId: v.optional(v.id("userProfiles")),
    // Optional sessionId to track multiple devices per user
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = null;

    // Try to get user from Convex auth first (for OAuth users)
    if (!args.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const email = getIdentityString(identity.email);
        if (email) {
          user = await ctx.db
            .query("userProfiles")
            .withIndex("by_email", (q: any) => q.eq("email", email))
            .first();
        }

        if (!user) {
          const provider = getIdentityString(identity.provider);
          const subject = getIdentityString(identity.subject);
          if (provider && subject) {
            user = await ctx.db
              .query("userProfiles")
              .withIndex("by_oauth", (q: any) => 
                q.eq("oauthProvider", provider).eq("oauthId", subject)
              )
              .first();
          }
        }
      }
    } else {
      // Use provided userId (for native auth users)
      user = await ctx.db.get(args.userId);
    }

    if (!user) {
      throw new Error("User profile not found");
    }

    // Generate sessionId if not provided (for native auth)
    // Use a consistent format that matches the client-side generation
    const sessionId = args.sessionId || `native_${String(user._id)}_${Date.now()}`;

    // Check if presence record exists for this user+sessionId combination
    const existingPresence = await ctx.db
      .query("userPresence")
      .withIndex("by_user_session", (q: any) => 
        q.eq("userId", user._id).eq("sessionId", sessionId)
      )
      .first();

    const now = Date.now();
    
    if (existingPresence) {
      // Skip update if last update was less than 2 seconds ago (debounce)
      // This dramatically reduces write conflicts during high traffic
      const timeSinceLastUpdate = now - existingPresence.lastSeen;
      if (timeSinceLastUpdate < 2000 && 
          existingPresence.status === args.status && 
          existingPresence.currentRoomId === args.currentRoomId &&
          existingPresence.isTyping === args.isTyping) {
        // Skip redundant update
        return;
      }
      
      // Use replace instead of patch to avoid write conflicts
      try {
        await ctx.db.replace(existingPresence._id, {
          userId: user._id,
          sessionId,
          status: args.status,
          currentRoomId: args.currentRoomId,
          isTyping: args.isTyping,
          lastSeen: now,
          typingSince: args.isTyping ? now : undefined,
        });
      } catch (e) {
        // If replace fails, silently ignore - presence is non-critical
        // The next heartbeat will update it
      }
    } else {
      try {
        await ctx.db.insert("userPresence", {
          userId: user._id,
          sessionId,
          status: args.status,
          currentRoomId: args.currentRoomId,
          isTyping: args.isTyping,
          lastSeen: now,
          typingSince: args.isTyping ? now : undefined,
        });
      } catch (e) {
        // Ignore insert conflicts - likely race condition with another insert
      }
    }
  },
});

/**
 * Get or create user profile (backward compatibility)
 * This is the main entry point for all authenticated operations
 */
export const getOrCreateUserProfile = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user
    let user = null;
    const email = getIdentityString(identity.email);
    if (email) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", email))
        .first();
    }

    if (!user) {
      const provider = getIdentityString(identity.provider);
      const subject = getIdentityString(identity.subject);
      if (provider && subject) {
        user = await ctx.db
          .query("userProfiles")
          .withIndex("by_oauth", (q: any) => 
            q.eq("oauthProvider", provider).eq("oauthId", subject)
          )
          .first();
      }
    }

    if (!user) {
      // Create new user from identity
      const name = getIdentityString(identity.name);
      const picture = getIdentityString(identity.picture);
      
      const userId = await ctx.db.insert("userProfiles", {
        email: email,
        oauthProvider: getIdentityString(identity.provider),
        oauthId: getIdentityString(identity.subject),
        displayName: name || email?.split('@')[0] || 'User',
        avatarUrl: picture,
        coinBalance: 1000,
        coinBalanceVersion: 1,
        totalWinnings: 0,
        totalSpent: 0,
        isActive: true,
        isBanned: false,
        isAdmin: false,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      // Update last active
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });
    }

    // Check if user is banned
    if (user?.isBanned) {
      throw new Error(`Account banned: ${user.banReason || 'No reason provided'}`);
    }

    return user;
  },
});

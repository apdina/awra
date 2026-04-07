import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAuth } from "./auth";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { 
  validateChatMessage, 
  checkRateLimit, 
  rateLimitSchema
} from "./validators";
import { CHAT_ROOMS, getChatRoom, isRoomFull, hasUserReachedMessageLimit } from "./chat_rooms_config";

// Constants
const MAX_MESSAGES_PER_FETCH = 50;
const EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MESSAGES_BEFORE_AD = 3; // Users can send 3 messages before video ad

// Send a new message (with built-in rate limiting)
export const sendMessage = mutation({
  args: {
    userId: v.id("userProfiles"),
    roomId: v.string(),
    content: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("system"), v.literal("winner"))),
  },
  handler: async (ctx, args) => {
    // Get user profile
    const userProfile = await ctx.db.get(args.userId);
    if (!userProfile) {
      throw new Error("User not found");
    }

    // Permission check: Only allow system messages from admins
    if (args.messageType === "system" && !userProfile.isAdmin) {
      throw new Error("Only admins can send system messages");
    }

    // Get room configuration
    const roomConfig = await ctx.runQuery(api.chatRooms.getRoomConfig, { roomId: args.roomId });
    
    if (!roomConfig) {
      throw new Error("Invalid room ID");
    }

    // Check if room is full
    const onlineUsers = await ctx.runQuery(api.chat.getOnlineUsers, { roomId: args.roomId });
    
    if (isRoomFull(onlineUsers.length, roomConfig.maxUsers)) {
      throw new Error(`Room is full. Maximum ${roomConfig.maxUsers} users allowed.`);
    }

    // Check user's message count in this room (only count messages after last video watch)
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .filter((q) => q.and(
        q.eq(q.field("roomId"), args.roomId),
        q.eq(q.field("isDeleted"), false),
        q.gt(q.field("createdAt"), userProfile.lastChatVideoWatchAt || 0)
      ))
      .collect();
    const userMessageCount = messages.length;

    // If user has reached message limit, return a video ad requirement response
    if (userMessageCount >= MESSAGES_BEFORE_AD) {
      return { success: false, videoAdRequired: true };
    }

    // Validate and sanitize message
    const validation = validateChatMessage(args.content);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid message");
    }

    const sanitizedContent = validation.sanitized!;

    // Create the message
    const messageId = await ctx.db.insert("chatMessages", {
      userId: userProfile._id,
      roomId: args.roomId,
      content: sanitizedContent,
      messageType: args.messageType || "text",
      
      // Denormalized user fields for ultra-fast reading
      userDisplayName: userProfile.displayName,
      userAvatarUrl: userProfile.avatarUrl,
      userAvatarName: userProfile.avatarName,
      userAvatarType: userProfile.avatarType,
      userIsAdmin: userProfile.isAdmin,
      userIsModerator: userProfile.isModerator,
      
      isDeleted: false,
      isEdited: false,
      createdAt: Date.now(),
    });

    // Update user's last message timestamp (rate limiting)
    await ctx.db.patch(userProfile._id, {
      lastMessageAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    // Update user presence with consistent sessionId
    const sessionId = `session_${String(userProfile._id)}`;
    await ctx.runMutation(api.auth.updatePresence, {
      status: "online",
      currentRoomId: args.roomId,
      isTyping: false,
      userId: userProfile._id,
      sessionId,
    });

    return { success: true, messageId };
  },
});

// Helper function to get admin secret from database
async function getAdminSecret(ctx: any): Promise<string> {
  const config = await ctx.db.query("systemConfig").filter((q: any) => q.eq(q.field("key"), "adminSecret")).first();
  return config?.value as string || "";
}



// Delete a message (own messages or admin can delete any)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    userId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    // Get user profile
    const userProfile = await ctx.db.get(args.userId);
    if (!userProfile) {
      throw new Error("User not found");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user owns the message OR is an admin OR is a moderator
    const canDelete = message.userId === userProfile._id || 
                     userProfile.isAdmin || 
                     (userProfile.isModerator || false);
    
    if (!canDelete) {
      throw new Error("Not authorized to delete this message");
    }

    // Determine deletion reason
    let deletedReason: string | undefined;
    if (message.userId !== userProfile._id) {
      if (userProfile.isAdmin) {
        deletedReason = "Deleted by admin";
      } else if (userProfile.isModerator) {
        deletedReason = "Deleted by moderator";
      }
    }

    // Soft delete the message
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedReason,
    });

    return args.messageId;
  },
});

// Edit a message (only own messages, within 5 minutes, with rate limiting)
export const editMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    newContent: v.string(),
    userId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    // Get user profile
    const userProfile = await ctx.db.get(args.userId);
    if (!userProfile) {
      throw new Error("User not found");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user owns the message
    if (message.userId !== userProfile._id) {
      throw new Error("Not authorized to edit this message");
    }

    // Check if message is within edit window
    if (Date.now() - message.createdAt > EDIT_WINDOW_MS) {
      throw new Error("Message can only be edited within 5 minutes of sending");
    }

    // Rate limiting for edits (prevent spam editing)
    const rateLimit = checkRateLimit(
      message.editedAt || message.createdAt,
      rateLimitSchema.chatMessage.windowMs
    );

    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.waitMs / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before editing again`);
    }

    // Validate and sanitize new content
    const validation = validateChatMessage(args.newContent);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid message");
    }

    // Update the message
    await ctx.db.patch(args.messageId, {
      content: validation.sanitized!,
      isEdited: true,
      editedAt: Date.now(),
    });

    return args.messageId;
  },
});

// Get messages for a room (paginated, default 50 limit)
export const getMessages = query({
  args: {
    roomId: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50; // Default to 50 messages
    const roomId = args.roomId;

    // Handle null cursor (convert to undefined)
    const cursor = args.cursor ?? undefined;

    let messages;
    if (cursor) {
      // Get messages before the cursor (for loading older messages)
      const cursorTimestamp = parseInt(cursor);
      messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_room_created", (q) => 
          q.eq("roomId", roomId).lt("createdAt", cursorTimestamp)
        )
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .order("desc")
        .take(limit);
    } else {
      // Get latest messages
      messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_room_created", (q) => q.eq("roomId", roomId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .order("desc")
        .take(limit);
    }

    // 🚀 PERFORMANCE: Filter messages that don't have denormalized data yet
    const messagesMissingProfiles = messages.filter(
      msg => msg.userId && !msg.userDisplayName && msg.messageType !== 'system'
    );
    
    // Get user profiles only for old messages that need them (backward compatibility)
    const userIdsToFetch = [...new Set(messagesMissingProfiles.map(msg => msg.userId).filter((id): id is any => id !== undefined))];
    
    // Fetch missing user profiles (ideally this array is empty for new messages and executes instantly!)
    const userProfiles = await Promise.all(
      userIdsToFetch.map(async (id) => {
        try {
          const profile = await ctx.db.get(id as any);
          return profile;
        } catch (error) {
          console.error('Error fetching profile for userId:', id, error);
          return null;
        }
      })
    );

    // Create profile map for fallback queries
    const profileMap = new Map();
    userProfiles.forEach(profile => {
      if (profile) {
        profileMap.set(profile._id, profile);
      }
    });

    // Format messages with user info - ensure user object is always present
    const formattedMessages = messages.map(msg => {
      // For system messages without userId
      if (!msg.userId || msg.messageType === 'system') {
        return {
          ...msg,
          user: {
            id: 'system',
            displayName: 'System',
            avatarUrl: undefined,
            isAdmin: false,
            isModerator: false,
          },
        };
      }
      
      // 🚀 PERFORMANCE: Use denormalized data if available (Skips DB Map Layer)
      if (msg.userDisplayName) {
        return {
          ...msg,
          user: {
            id: msg.userId,
            displayName: msg.userDisplayName,
            avatarUrl: msg.userAvatarUrl,
            avatarName: msg.userAvatarName,
            avatarType: msg.userAvatarType,
            isAdmin: msg.userIsAdmin || false,
            isModerator: msg.userIsModerator || false,
          },
        };
      }
      
      // For legacy messages: fallback to profileMap
      const profile = profileMap.get(msg.userId);
      if (profile && profile.displayName) {
        return {
          ...msg,
          user: {
            id: msg.userId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            avatarName: profile.avatarName,
            avatarType: profile.avatarType,
            isAdmin: profile.isAdmin || false,
            isModerator: profile.isModerator || false,
          },
        };
      }
      
      // Fallback for users without profile and legacy
      return {
        ...msg,
        user: {
          id: msg.userId,
          displayName: `Player${String(msg.userId).slice(-4)}`,
          avatarUrl: undefined,
          isAdmin: false,
          isModerator: false,
        },
      };
    });

    return {
      messages: formattedMessages.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].createdAt.toString() : undefined,
    };
  },
});

// Get online users in a room (optimized)
export const getOnlineUsers = query({
  args: {
    roomId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Return empty array if no roomId provided
    if (!args.roomId) {
      return [];
    }

    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    // Query by room and status for better performance
    const presence = await ctx.db
      .query("userPresence")
      .withIndex("by_room_status", (q: any) => 
        q.eq("currentRoomId", args.roomId)
         .eq("status", "online")
         .gte("lastSeen", fiveMinutesAgo)
      )
      .collect();

    // Get unique users (deduplicate by userId, keep most recent)
    const userPresences = new Map();
    presence.forEach(p => {
      const existing = userPresences.get(p.userId);
      if (!existing || p.lastSeen > existing.lastSeen) {
        userPresences.set(p.userId, p);
      }
    });

    // Get user profiles in batch
    const userIds = [...userPresences.keys()];
    const userProfiles = await Promise.all(
      userIds.map(id => ctx.db.get(id))
    );

    const profileMap = new Map();
    userProfiles.forEach(profile => {
      if (profile) {
        profileMap.set(profile._id, profile);
      }
    });

    // Format online users with profile info
    const onlineUsers = Array.from(userPresences.values())
      .map(p => {
        const profile = profileMap.get(p.userId);
        return {
          userId: p.userId,
          status: p.status,
          lastSeen: p.lastSeen,
          isTyping: p.isTyping,
          typingSince: p.typingSince,
          profile: profile ? {
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            avatarName: profile.avatarName,
            avatarType: profile.avatarType,
          } : null,
        };
      })
      .filter(u => u.profile !== null); // Only return users with valid profiles

    return onlineUsers;
  },
});

// Get room configuration
export const getRoomConfig = query({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("chatRooms")
      .filter((q) => q.eq(q.field("_id"), args.roomId))
      .first();

    if (!room) {
      return null;
    }

    return {
      id: room._id,
      name: room.name,
      description: room.description,
      maxUsers: room.maxUsers || 100,
      maxMessagesPerUser: room.maxMessagesPerUser || 3,
    };
  },
});

// Set typing status
export const setTypingStatus = mutation({
  args: {
    userId: v.id("userProfiles"),
    isTyping: v.boolean(),
    roomId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update presence with consistent sessionId
    const sessionId = `session_${String(args.userId)}`;
    await ctx.runMutation(api.auth.updatePresence, {
      status: "online",
      currentRoomId: args.roomId,
      isTyping: args.isTyping,
      userId: args.userId,
      sessionId,
    });

    return true;
  },
});

// Cleanup old presence records (called periodically)
export const cleanupPresence = mutation({
  handler: async (ctx) => {
    const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
    
    // Find stale presence records
    const stalePresence = await ctx.db
      .query("userPresence")
      .withIndex("by_status", (q: any) => 
        q.eq("status", "online").lt("lastSeen", fifteenMinutesAgo)
      )
      .collect();

    // Delete stale records
    for (const presence of stalePresence) {
      await ctx.db.delete(presence._id);
    }

    return { cleaned: stalePresence.length };
  },
});

// Internal mutation for cron job (not callable from client)
export const cleanupPresenceInternal = internalMutation({
  handler: async (ctx) => {
    const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
    
    // Find stale presence records
    const stalePresence = await ctx.db
      .query("userPresence")
      .withIndex("by_status", (q: any) => 
        q.eq("status", "online").lt("lastSeen", fifteenMinutesAgo)
      )
      .collect();

    // Delete stale records
    for (const presence of stalePresence) {
      await ctx.db.delete(presence._id);
    }

    console.log(`🧹 Cron: Cleaned up ${stalePresence.length} stale presence records`);
    return { cleaned: stalePresence.length };
  },
});




// Get chat statistics for the dashboard
export const getChatStats = query({
  args: {
    roomId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Total online users (across all rooms or specific room)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    let onlineUsersQuery = ctx.db
      .query("userPresence")
      .withIndex("by_status", (q: any) => 
        q.eq("status", "online").gte("lastSeen", fiveMinutesAgo)
      );
    
    const onlineUsers = await onlineUsersQuery.collect();
    const totalOnlineUsers = onlineUsers.length;

    // Total messages (all time, for all rooms or specific room)
    let totalMessages;
    if (args.roomId) {
      totalMessages = await ctx.db
        .query("chatMessages")
        .withIndex("by_room_created", (q) => q.eq("roomId", args.roomId!))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
    } else {
      totalMessages = await ctx.db
        .query("chatMessages")
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
    }

    // System messages count
    let systemMessages;
    if (args.roomId) {
      systemMessages = await ctx.db
        .query("chatMessages")
        .withIndex("by_room_created", (q) => q.eq("roomId", args.roomId!))
        .filter((q) => q.and(
          q.eq(q.field("messageType"), "system"),
          q.eq(q.field("isDeleted"), false)
        ))
        .collect();
    } else {
      systemMessages = await ctx.db
        .query("chatMessages")
        .filter((q) => q.and(
          q.eq(q.field("messageType"), "system"),
          q.eq(q.field("isDeleted"), false)
        ))
        .collect();
    }

    // Get tickets sold from active draws
    const activeDraws = await ctx.db
      .query("dailyDraws")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    let totalTicketsSold = 0;
    for (const draw of activeDraws) {
      totalTicketsSold += draw.totalTickets;
    }

    return {
      onlineUsers: totalOnlineUsers,
      totalMessages: totalMessages.length,
      systemMessages: systemMessages.length,
      ticketsSold: totalTicketsSold,
    };
  },
});
// Set admin secret (for initial setup)
export const setAdminSecret = mutation({
  args: {
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin secret already exists
    const existingConfig = await ctx.db
      .query("systemConfig")
      .filter((q) => q.eq(q.field("key"), "adminSecret"))
      .first();

    if (existingConfig) {
      // Update existing
      await ctx.db.patch(existingConfig._id, {
        value: args.adminSecret,
        updatedAt: Date.now(),
      });
    } else {
      // Insert new
      await ctx.db.insert("systemConfig", {
        key: "adminSecret",
        value: args.adminSecret,
        description: "Admin secret for sending admin messages",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

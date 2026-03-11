import { v } from "convex/values";
import { query } from "./_generated/server";

// Get a specific chat room by string ID (for compatibility with string-based room IDs)
export const getRoomByStringId = query({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    // Since we use string room IDs in the chat system, we need to search for rooms
    // This is a fallback - ideally rooms should be created with proper IDs
    const rooms = await ctx.db
      .query("chatRooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Find room by name or ID (this is a workaround for string-based room IDs)
    return rooms.find(r => r.name === args.roomId || r._id.toString() === args.roomId) || null;
  },
});

// Get room configuration (includes maxUsers and maxMessagesPerUser)
export const getRoomConfig = query({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("chatRooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Find room by name or ID
    const foundRoom = room.find(r => r.name === args.roomId || r._id.toString() === args.roomId);
    
    if (!foundRoom) {
      // Room doesn't exist - return default config for now
      // This allows the app to work before rooms are initialized
      return {
        id: args.roomId,
        name: args.roomId,
        description: "Chat room",
        maxUsers: 100,
        maxMessagesPerUser: 3,
      };
    }

    return {
      id: foundRoom._id,
      name: foundRoom.name,
      description: foundRoom.description,
      maxUsers: foundRoom.maxUsers || 100,
      maxMessagesPerUser: foundRoom.maxMessagesPerUser || 3,
    };
  },
});

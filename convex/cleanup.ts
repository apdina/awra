import { internalMutation } from "./_generated/server";
import { CHAT_ROOMS } from "./chat_rooms_config";

/**
 * Initialize chat rooms if they don't exist
 * Run this as a scheduled job on startup
 */
export const initializeChatRooms = internalMutation({
  handler: async (ctx) => {
    const existingRooms = await ctx.db.query("chatRooms").collect();
    
    if (existingRooms.length > 0) {
      console.log("Chat rooms already initialized");
      return { initialized: false, count: existingRooms.length };
    }

    const now = Date.now();
    const roomIds: string[] = [];

    for (const room of CHAT_ROOMS) {
      const roomId = await ctx.db.insert("chatRooms", {
        name: room.name,
        description: room.description,
        type: "global" as const,
        isActive: true,
        maxUsers: room.maxUsers,
        maxMessagesPerUser: room.maxMessagesPerUser,
        createdAt: now,
      });
      roomIds.push(roomId);
    }

    console.log(`✅ Initialized ${roomIds.length} chat rooms`);
    return { initialized: true, count: roomIds.length, roomIds };
  },
});

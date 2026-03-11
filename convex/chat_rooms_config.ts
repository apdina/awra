// Chat room configuration
// 10 rooms with special names, max 100 users each
// Users limited to 3 messages before video ad

export interface ChatRoomConfig {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  maxMessagesPerUser: number;
}

export const CHAT_ROOMS: ChatRoomConfig[] = [
  {
    id: "room_vip",
    name: "👑 VIP Lounge",
    description: "Exclusive chat for high rollers and VIP members",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_highroller",
    name: "💰 High Roller Hub",
    description: "Chat for players betting big",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_newbies",
    name: "👋 Newbie Friendly",
    description: "Welcome area for new players",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_strategies",
    name: "🧠 Strategy Talk",
    description: "Share tips and winning strategies",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_winnings",
    name: "🎉 Winner's Circle",
    description: "Celebrate your wins here",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_general",
    name: "💬 General Chat",
    description: "Casual conversation and socializing",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_tips",
    name: "💡 Advice Corner",
    description: "Get help and advice from experienced players",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_events",
    name: "🎁 Event Hub",
    description: "Chat about special events and promotions",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_feedback",
    name: "📝 Feedback Box",
    description: "Share your thoughts and suggestions",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
  {
    id: "room_offtopic",
    name: "🎮 Off-Topic",
    description: "Everything else - sports, movies, life",
    maxUsers: 100,
    maxMessagesPerUser: 3,
  },
];

// Get room by ID
export function getChatRoom(roomId: string): ChatRoomConfig | undefined {
  return CHAT_ROOMS.find((room) => room.id === roomId);
}

// Get all active rooms
export function getAllChatRooms(): ChatRoomConfig[] {
  return CHAT_ROOMS;
}

// Check if room is full
export function isRoomFull(currentUsers: number, maxUsers: number): boolean {
  return currentUsers >= maxUsers;
}

// Check if user has reached message limit
export function hasUserReachedMessageLimit(
  userMessageCount: number,
  maxMessages: number = 3
): boolean {
  return userMessageCount >= maxMessages;
}

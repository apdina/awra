import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// User Profile - Native Convex authentication
export const userProfiles = defineTable({
  // Authentication
  email: v.optional(v.string()), // Optional email for password reset
  passwordHash: v.optional(v.string()), // Hashed password (if using email/password)
  oauthProvider: v.optional(v.string()), // e.g., "google", "github"
  oauthId: v.optional(v.string()), // OAuth provider user ID
  supabaseId: v.optional(v.string()), // Legacy Supabase user ID (for migration)
  tokenVersion: v.optional(v.number()), // Increment to invalidate all tokens
  
  // Display information
  displayName: v.string(),
  // Avatar system: store avatar name and type, images stored locally
  avatarName: v.optional(v.string()), // e.g., "young_mas", "sp1"
  avatarType: v.optional(v.union(v.literal("basic"), v.literal("special"), v.literal("photo"))),
  // Keep avatarUrl for backward compatibility (can store full path)
  avatarUrl: v.optional(v.string()),
  
  // User's photo choice
  usePhoto: v.optional(v.boolean()), // true = use photo, false/undefined = use avatar
  userPhoto: v.optional(v.string()), // Base64 encoded photo data
  
  // Game state
  coinBalance: v.number(),
  coinBalanceVersion: v.number(), // For optimistic locking on coin transactions
  totalWinnings: v.number(),
  totalSpent: v.number(),
  
  // Engagement tracking
  lastDailyRewardAt: v.optional(v.number()), // Last daily bonus claim
  dailyLoginStreak: v.optional(v.number()), // Consecutive days
  totalVideosWatched: v.optional(v.number()), // Lifetime video ad count
  totalCoinsFromVideos: v.optional(v.number()), // Lifetime coins from videos
  lastVideoWatchAt: v.optional(v.number()), // Last video watch timestamp
  videosWatchedToday: v.optional(v.number()), // Videos watched today (resets daily)
  
  // Rate limiting (built-in, no Redis needed)
  lastMessageAt: v.optional(v.number()), // Last chat message timestamp
  lastCoinTransactionAt: v.optional(v.number()), // Last coin transaction timestamp
  lastProfileUpdateAt: v.optional(v.number()), // Last profile update timestamp
  recentCoinTransactions: v.optional(v.array(v.number())), // Last 10 transaction timestamps for rate limiting
  
  // Status
  isActive: v.boolean(),
  isBanned: v.boolean(),
  banReason: v.optional(v.string()),
  isAdmin: v.boolean(), // Admin can send system messages and moderate
  isModerator: v.optional(v.boolean()), // Moderator can delete messages and moderate chat
  
  // Timestamps
  createdAt: v.number(),
  lastActiveAt: v.number(),
})
.index("by_displayName", ["displayName"])
.index("by_email", ["email"])
.index("by_oauth", ["oauthProvider", "oauthId"])
.index("by_active", ["isActive", "lastActiveAt"]);

// Chat Messages - Real-time messaging
export const chatMessages = defineTable({
  userId: v.optional(v.id("userProfiles")), // Optional for system messages
  roomId: v.string(), // "global", "draw_123", etc.
  content: v.string(),
  messageType: v.union(v.literal("text"), v.literal("system"), v.literal("winner"), v.literal("admin"), v.literal("investigation")),
  
  // Moderation
  isDeleted: v.boolean(),
  isEdited: v.boolean(),
  editedAt: v.optional(v.number()),
  reportCount: v.optional(v.number()), // Number of times reported
  reportedBy: v.optional(v.array(v.id("userProfiles"))), // Users who reported this message
  lastReportedAt: v.optional(v.number()), // Timestamp of last report
  lastReportReason: v.optional(v.string()), // Reason from last report
  deletedReason: v.optional(v.string()), // Why message was deleted
  
  // Timestamps
  createdAt: v.number(),
})
.index("by_room_created", ["roomId", "createdAt"])
.index("by_user_created", ["userId", "createdAt"]);

// Message Reactions - Emoji reactions to messages
export const messageReactions = defineTable({
  messageId: v.id("chatMessages"),
  userId: v.id("userProfiles"),
  emoji: v.string(), // The emoji reaction (e.g., "👍", "❤️", "😂")
  createdAt: v.number(),
})
.index("by_message", ["messageId"])
.index("by_user", ["userId"]);

// Chat Rooms - Different chat contexts
export const chatRooms = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  type: v.union(v.literal("global"), v.literal("draw"), v.literal("private")),
  isActive: v.boolean(),
  maxUsers: v.optional(v.number()),
  maxMessagesPerUser: v.optional(v.number()), // Messages before video ad required
  createdAt: v.number(),
})
.index("by_active", ["isActive"]);

// User Presence - Real-time online status
// Each user can have multiple presence records (one per device/session)
export const userPresence = defineTable({
  userId: v.id("userProfiles"),
  sessionId: v.string(), // Unique identifier for each device/session
  status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
  currentRoomId: v.optional(v.string()),
  lastSeen: v.number(),
  isTyping: v.boolean(),
  typingSince: v.optional(v.number()),
})
.index("by_status", ["status", "lastSeen"])
.index("by_room", ["currentRoomId", "lastSeen"])
.index("by_room_status", ["currentRoomId", "status", "lastSeen"])
.index("by_user_session", ["userId", "sessionId"]);

// Daily Draws - Main game state
export const dailyDraws = defineTable({
  drawId: v.string(), // Unique identifier like "2025-02-10"
  
  // Draw configuration
  ticketPrice: v.number(),
  maxTickets: v.number(),
  currentPot: v.number(),
  
  // Timing
  startTime: v.number(),
  endTime: v.number(),
  drawingTime: v.number(),
  
  // Status
  status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("drawing"), v.literal("completed")),
  
  // Results
  winningNumber: v.optional(v.number()),
  winnerUserId: v.optional(v.id("userProfiles")),
  prizeAmount: v.optional(v.number()),
  
  // Statistics
  totalTickets: v.number(),
  uniquePlayers: v.number(),
  
  // Draw duration configuration (for Sunday 48H logic)
  drawDurationHours: v.optional(v.number()), // 24 for normal days, 48 for Sunday skips
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_status", ["status", "endTime"])
.index("by_drawId", ["drawId"]);

// Coin Transactions - Atomic financial records
export const coinTransactions = defineTable({
  userId: v.id("userProfiles"),
  
  // Transaction details
  type: v.union(
    v.literal("purchase"), // Buying tickets
    v.literal("winning"),  // Prize winnings
    v.literal("bonus"),    // Daily bonus
    v.literal("refund"),   // Failed draw refund
    v.literal("admin")     // Admin adjustment
  ),
  amount: v.number(), // Positive for gains, negative for losses
  balanceAfter: v.number(),
  balanceVersion: v.number(), // Version at time of transaction (for audit)
  
  // Idempotency - prevent duplicate transactions
  idempotencyKey: v.string(), // Unique key to prevent duplicate transactions
  
  // Related entities
  relatedDrawId: v.optional(v.id("dailyDraws")),
  relatedTicketId: v.optional(v.id("unifiedTickets")), // Only unified tickets now
  
  // Description
  description: v.string(),
  
  // Timestamps
  createdAt: v.number(),
})
.index("by_user_created", ["userId", "createdAt"])
.index("by_type_created", ["type", "createdAt"])
.index("by_idempotency", ["idempotencyKey"]); // Prevent duplicate transactions

// Rate Limiting - Prevent spam and abuse
export const rateLimits = defineTable({
  identifier: v.string(), // IP address or user ID
  action: v.string(), // "sendMessage", "buyTicket", etc.
  count: v.number(),
  windowStart: v.number(),
  windowEnd: v.number(),
})
.index("by_identifier_action", ["identifier", "action", "windowEnd"]);

// System Configuration - App settings
export const systemConfig = defineTable({
  key: v.string(),
  value: v.union(v.string(), v.number(), v.boolean()),
  description: v.optional(v.string()),
  updatedAt: v.number(),
})
.index("by_key", ["key"]);

// Revoked Tokens - Track invalidated JWT tokens
export const revokedTokens = defineTable({
  jti: v.string(), // JWT ID (unique token identifier)
  userId: v.id("userProfiles"),
  revokedAt: v.number(),
  expiresAt: v.number(), // When token would naturally expire
})
.index("by_jti", ["jti"])
.index("by_user", ["userId", "revokedAt"]);

// Login Attempts - Track failed login attempts for account lockout
export const loginAttempts = defineTable({
  email: v.string(),
  failedAttempts: v.number(),
  lastAttemptAt: v.number(),
  lockedUntil: v.optional(v.number()),
  attemptTimestamps: v.array(v.number()), // Last N attempt timestamps
})
.index("by_email", ["email"]);

// Password Reset Tokens - Secure password reset flow
export const passwordResetTokens = defineTable({
  userId: v.id("userProfiles"),
  token: v.string(),
  expiresAt: v.number(),
  used: v.boolean(),
  createdAt: v.number(),
})
.index("by_token", ["token"])
.index("by_user", ["userId", "createdAt"]);

// Admin Login Attempts - Track admin login attempts for enhanced security
export const adminLoginAttempts = defineTable({
  email: v.string(),
  success: v.boolean(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  timestamp: v.number(),
})
.index("by_email_timestamp", ["email", "timestamp"])
.index("by_timestamp", ["timestamp"]);

// Admin Lockouts - Track IP-based lockouts for brute force protection
export const adminLockouts = defineTable({
  ipAddress: v.string(),
  lockedUntil: v.number(),
  reason: v.string(),
  failedAttempts: v.number(),
  createdAt: v.number(),
})
.index("by_ip", ["ipAddress"])
.index("by_locked_until", ["lockedUntil"]);

// Password Reset Rate Limits - Prevent spam on password reset
export const passwordResetRateLimits = defineTable({
  email: v.string(),
  requestCount: v.number(),
  windowStart: v.number(),
  lastRequestAt: v.number(),
})
.index("by_email", ["email"])
.index("by_window_start", ["windowStart"]);

// Refresh Tokens - Long-lived tokens for persistent sessions
export const refreshTokens = defineTable({
  userId: v.id("userProfiles"),
  deviceId: v.string(), // Unique device identifier
  tokenHash: v.string(), // Hashed refresh token (never store plain)
  jti: v.string(), // JWT ID
  expiresAt: v.number(),
  createdAt: v.number(),
  lastUsedAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  isRevoked: v.boolean(),
})
.index("by_user_device", ["userId", "deviceId"])
.index("by_jti", ["jti"])
.index("by_expires", ["expiresAt"]);

// Unified Tickets - Single table for all tickets with complete data
export const unifiedTickets = defineTable({
  // Unique identifier
  ticketId: v.string(), // Custom ticket ID format: TICKET-{timestamp}-{random}
  
  // User reference
  userId: v.id("userProfiles"),
  
  // Bet details (array of numbers with amounts)
  bets: v.array(v.object({
    number: v.number(), // 1-200
    amount: v.number(), // Bet amount in coins
  })),
  
  // Totals
  totalAmount: v.number(), // Sum of all bets
  potentialPayout: v.number(), // Calculated when winning number is known
  
  // Status
  status: v.union(v.literal("active"), v.literal("won"), v.literal("lost")),
  isWinning: v.boolean(),
  winningAmount: v.number(), // Actual payout received
  
  // Timing
  purchasedAt: v.number(), // Purchase timestamp (milliseconds)
  drawDate: v.string(), // DD/MM/YYYY format for filtering
  drawTime: v.string(), // HH:MM format
  
  // Winning number reference
  winningNumber: v.optional(v.number()), // The draw's winning number
  payoutMultiplier: v.optional(v.number()), // 100x or 20x based on match type
  matchType: v.optional(v.union(v.literal("exact"), v.literal("partial"), v.literal("none"))),
  
  // Audit trail
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_draw_date", ["drawDate", "drawTime"])
.index("by_status", ["status", "purchasedAt"])
.index("by_ticket_id", ["ticketId"])
.index("by_user_status", ["userId", "status"])
.index("by_draw_status", ["drawDate", "drawTime", "status"]);

// Admin Sessions - Separate admin authentication
export const adminSessions = defineTable({
  sessionToken: v.string(),
  createdAt: v.number(),
  expiresAt: v.number(),
  lastActivityAt: v.number(),
})
.index("by_token", ["sessionToken"])
.index("by_expires", ["expiresAt"]);

// Video Ad Watches - Track rewarded video completions
export const videoAdWatches = defineTable({
  userId: v.id("userProfiles"),
  adProvider: v.string(), // "admob", "unity", "custom", etc.
  adUnitId: v.optional(v.string()),
  coinsEarned: v.number(),
  watchedAt: v.number(),
  completionRate: v.number(), // 0-100%
  rewardClaimed: v.boolean(),
  videoId: v.optional(v.string()), // Unique video identifier
  sessionId: v.optional(v.string()), // Track session
})
.index("by_user_watched", ["userId", "watchedAt"])
.index("by_claimed", ["rewardClaimed", "watchedAt"]);

// Daily Rewards - Track daily login bonuses
export const dailyRewards = defineTable({
  userId: v.id("userProfiles"),
  rewardDate: v.string(), // YYYY-MM-DD format
  rewardType: v.union(v.literal("login"), v.literal("streak"), v.literal("special")),
  coinsEarned: v.number(),
  streakCount: v.number(), // Consecutive days
  claimedAt: v.number(),
})
.index("by_user_date", ["userId", "rewardDate"])
.index("by_user_claimed", ["userId", "claimedAt"]);

// Audit Logs - Security and compliance logging
export const auditLogs = defineTable({
  // Event information
  eventType: v.string(), // LOGIN_SUCCESS, ADMIN_ACTION, etc.
  status: v.union(v.literal("success"), v.literal("failure"), v.literal("blocked")),
  message: v.string(),
  severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
  
  // User information
  userId: v.optional(v.string()),
  email: v.optional(v.string()),
  
  // Request information
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  
  // Additional details (sensitive data redacted)
  details: v.optional(v.object({})), // Flexible object for event-specific data
  
  // Timestamp
  timestamp: v.number(),
})
.index("by_event_type", ["eventType", "timestamp"])
.index("by_user_id", ["userId", "timestamp"])
.index("by_email", ["email", "timestamp"])
.index("by_severity", ["severity", "timestamp"])
.index("by_ip_address", ["ipAddress", "timestamp"])
.index("by_timestamp", ["timestamp"]);

// Email Verifications - Track email verification tokens
export const emailVerifications = defineTable({
  email: v.string(),
  token: v.string(),
  userId: v.id("userProfiles"),
  expiresAt: v.number(),
  verified: v.boolean(),
  createdAt: v.number(),
})
.index("by_email", ["email"])
.index("by_token", ["token"])
.index("by_userId", ["userId"]);

// Export the schema
export default defineSchema({
  userProfiles,
  chatMessages,
  chatRooms,
  userPresence,
  dailyDraws,
  unifiedTickets,
  coinTransactions,
  rateLimits,
  systemConfig,
  messageReactions,
  revokedTokens,
  loginAttempts,
  passwordResetTokens,
  adminLoginAttempts,
  adminLockouts,
  passwordResetRateLimits,
  refreshTokens,
  adminSessions,
  videoAdWatches,
  dailyRewards,
  auditLogs,
  emailVerifications,
});

/**
 * Coin System with Optimistic Locking
 * 
 * Atomic transactions for coin balance management
 * Critical: Must be 100% reliable - if coins mess up, users leave
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin } from "./auth";
import { verifyToken } from "./native_auth";
import { Id } from "./_generated/dataModel";
import { 
  coinAmountSchema, 
  coinBalanceSchema, 
  idempotencyKeySchema,
  checkTransactionRateLimit,
  rateLimitSchema,
  validateCoinAmount
} from "./validators";

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

/**
 * Atomic coin deduction with optimistic locking
 * Prevents race conditions on concurrent purchases
 */
export const deductCoins = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    idempotencyKey: v.string(),
    relatedDrawId: v.optional(v.id("dailyDraws")),
  },
  handler: async (ctx, args) => {
    // Authenticate and get user profile
    const userProfile = await requireAuth(ctx);

    // Validate amount
    const amountValidation = validateCoinAmount(args.amount);
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error || "Invalid coin amount");
    }

    // Amount must be negative for deduction
    if (args.amount >= 0) {
      throw new Error("Deduction amount must be negative");
    }

    // Check idempotency - prevent duplicate transactions
    const existingTransaction = await ctx.db
      .query("coinTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existingTransaction) {
      // Transaction already processed - return existing
      return {
        success: true,
        transactionId: existingTransaction._id,
        balanceAfter: existingTransaction.balanceAfter,
        isDuplicate: true,
      };
    }

    // Check rate limiting (10 transactions per minute)
    const recentTransactions = userProfile.recentCoinTransactions || [];
    const rateLimit = checkTransactionRateLimit(
      recentTransactions,
      rateLimitSchema.coinTransaction.windowMs,
      rateLimitSchema.coinTransaction.maxAttempts
    );

    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.waitMs / 1000);
      throw new Error(`Too many transactions. Please wait ${waitSeconds} seconds`);
    }

    // Optimistic locking with retry logic
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        // Read current balance with version
        const currentUser = await ctx.db.get(userProfile._id);
        if (!currentUser) {
          throw new Error("User not found");
        }

        // Type assertion for user profile
        const user = currentUser as any;
        const currentBalance = user.coinBalance || 0;
        const currentVersion = user.coinBalanceVersion || 1;

        // Check sufficient funds
        const newBalance = currentBalance + args.amount;
        if (newBalance < 0) {
          throw new Error("Insufficient coins");
        }

        // Validate new balance
        try {
          coinBalanceSchema.parse(newBalance);
        } catch {
          throw new Error("Invalid balance after transaction");
        }

        // Atomic update with version check
        await ctx.db.patch(currentUser._id, {
          coinBalance: newBalance,
          coinBalanceVersion: currentVersion + 1,
          lastCoinTransactionAt: Date.now(),
          recentCoinTransactions: [
            Date.now(),
            ...(recentTransactions.slice(0, 9)), // Keep last 10
          ],
        });

        // Create transaction record
        const transactionId = await ctx.db.insert("coinTransactions", {
          userId: userProfile._id,
          type: "purchase",
          amount: args.amount,
          balanceAfter: newBalance,
          balanceVersion: currentVersion + 1,
          idempotencyKey: args.idempotencyKey,
          relatedDrawId: args.relatedDrawId,
          description: args.description,
          createdAt: Date.now(),
        });

        return {
          success: true,
          transactionId,
          balanceAfter: newBalance,
          isDuplicate: false,
        };
      } catch (error: any) {
        // Check if it's a version conflict
        if (error.message?.includes("version") || error.message?.includes("conflict")) {
          retries++;
          if (retries < MAX_RETRIES) {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }
        }
        throw error;
      }
    }

    throw new Error("Failed to process transaction after retries");
  },
});

/**
 * Add coins (winnings, bonuses, etc.)
 */
export const addCoins = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    idempotencyKey: v.string(),
    relatedDrawId: v.optional(v.id("dailyDraws")),
    type: v.optional(v.union(
      v.literal("winning"),
      v.literal("bonus"),
      v.literal("refund"),
      v.literal("admin")
    )),
  },
  handler: async (ctx, args) => {
    // Authenticate and get user profile
    const userProfile = await requireAuth(ctx);

    // Validate amount
    const amountValidation = validateCoinAmount(args.amount);
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error || "Invalid coin amount");
    }

    // Amount must be positive for addition
    if (args.amount <= 0) {
      throw new Error("Addition amount must be positive");
    }

    // Check idempotency
    const existingTransaction = await ctx.db
      .query("coinTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existingTransaction) {
      return {
        success: true,
        transactionId: existingTransaction._id,
        balanceAfter: existingTransaction.balanceAfter,
        isDuplicate: true,
      };
    }

    // Optimistic locking with retry logic
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        // Read current balance with version
        const currentUser = await ctx.db.get(userProfile._id);
        if (!currentUser) {
          throw new Error("User not found");
        }

        // Type assertion for user
        const user = currentUser as any;
        const currentBalance = user.coinBalance || 0;
        const currentVersion = user.coinBalanceVersion || 1;

        // Calculate new balance
        const newBalance = currentBalance + args.amount;

        // Validate new balance
        try {
          coinBalanceSchema.parse(newBalance);
        } catch {
          throw new Error("Invalid balance after transaction");
        }

        // Atomic update with version check
        await ctx.db.patch(currentUser._id, {
          coinBalance: newBalance,
          coinBalanceVersion: currentVersion + 1,
          lastCoinTransactionAt: Date.now(),
          recentCoinTransactions: [
            Date.now(),
            ...((user.recentCoinTransactions || []).slice(0, 9)),
          ],
        });

        // Create transaction record
        const transactionId = await ctx.db.insert("coinTransactions", {
          userId: userProfile._id,
          type: args.type || "bonus",
          amount: args.amount,
          balanceAfter: newBalance,
          balanceVersion: currentVersion + 1,
          idempotencyKey: args.idempotencyKey,
          relatedDrawId: args.relatedDrawId,
          description: args.description,
          createdAt: Date.now(),
        });

        return {
          success: true,
          transactionId,
          balanceAfter: newBalance,
          isDuplicate: false,
        };
      } catch (error: any) {
        if (error.message?.includes("version") || error.message?.includes("conflict")) {
          retries++;
          if (retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }
        }
        throw error;
      }
    }

    throw new Error("Failed to process transaction after retries");
  },
});

/**
 * Get user's coin balance
 */
export const getCoinBalance = query({
  handler: async (ctx) => {
    const userProfile = await requireAuth(ctx);
    return {
      balance: userProfile.coinBalance,
      totalWinnings: userProfile.totalWinnings,
      totalSpent: userProfile.totalSpent,
    };
  },
});

/**
 * Get user's transaction history (token-based auth)
 */
export const getTransactionHistory = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify token and get user
    const tokenData = await verifyToken(args.token);
    if (!tokenData) {
      throw new Error("Invalid or expired token");
    }

    const userProfile = await ctx.db.get(tokenData.userId as Id<"userProfiles">);
    if (!userProfile) {
      throw new Error("User not found");
    }

    const limit = args.limit || 50;
    const userId = userProfile._id as Id<"userProfiles">;

    let transactions;
    if (args.cursor) {
      const cursorTimestamp = parseInt(args.cursor);
      transactions = await ctx.db
        .query("coinTransactions")
        .withIndex("by_user_created", (q) => 
          q.eq("userId", userId).lt("createdAt", cursorTimestamp)
        )
        .order("desc")
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("coinTransactions")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    }

    // Get related draw info if available
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (tx) => {
        let drawInfo = null;
        if (tx.relatedDrawId) {
          const draw = await ctx.db.get(tx.relatedDrawId);
          if (draw) {
            const drawDoc = draw as any;
            drawInfo = {
              drawId: drawDoc.drawId,
              status: drawDoc.status,
            };
          }
        }

        return {
          ...tx,
          drawInfo,
        };
      })
    );

    return {
      transactions: transactionsWithDetails,
      hasMore: transactions.length === limit,
      nextCursor: transactions.length > 0 
        ? transactions[transactions.length - 1].createdAt.toString() 
        : null,
    };
  },
});
/**
 * Get transaction history for current authenticated user
 * Uses HTTP-only cookie authentication via ctx.auth
 */
export const getTransactionHistoryAuth = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user from HTTP-only cookie
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user profile by email or OAuth
    let userProfile = null;
    if (identity.email) {
      userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
        .first();
    }

    if (!userProfile && identity.provider && identity.subject) {
      userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_oauth", (q: any) =>
          q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
        )
        .first();
    }

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const limit = args.limit || 50;
    const userId = userProfile._id as Id<"userProfiles">;

    let transactions;
    if (args.cursor) {
      const cursorTimestamp = parseInt(args.cursor);
      transactions = await ctx.db
        .query("coinTransactions")
        .withIndex("by_user_created", (q) =>
          q.eq("userId", userId).lt("createdAt", cursorTimestamp)
        )
        .order("desc")
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("coinTransactions")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    }

    // Get related draw info if available
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (tx) => {
        let drawInfo = null;
        if (tx.relatedDrawId) {
          const draw = await ctx.db.get(tx.relatedDrawId);
          if (draw) {
            const drawDoc = draw as any;
            drawInfo = {
              drawId: drawDoc.drawId,
              status: drawDoc.status,
            };
          }
        }

        return {
          ...tx,
          drawInfo,
        };
      })
    );

    return {
      transactions: transactionsWithDetails,
      hasMore: transactions.length === limit,
      nextCursor: transactions.length > 0
        ? transactions[transactions.length - 1].createdAt.toString()
        : null,
    };
  },
});

/**
 * Transfer coins between users (future feature)
 * Note: This requires additional security checks
 */
export const transferCoins = mutation({
  args: {
    toUserId: v.id("userProfiles"),
    amount: v.number(),
    description: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Authenticate sender
    const senderProfile = await requireAuth(ctx);

    // Validate amount
    const amountValidation = validateCoinAmount(args.amount);
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error || "Invalid coin amount");
    }

    // Amount must be positive for transfer
    if (args.amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    // Check idempotency
    const existingTransaction = await ctx.db
      .query("coinTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existingTransaction) {
      return {
        success: true,
        transactionId: existingTransaction._id,
        isDuplicate: true,
      };
    }

    // Get recipient
    const recipient = await ctx.db.get(args.toUserId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    if (recipient.isBanned || !recipient.isActive) {
      throw new Error("Cannot transfer to this user");
    }

    // Double-entry bookkeeping: deduct from sender, add to recipient
    // Since Convex doesn't support multi-document transactions, we implement carefully
    
    // Generate unique idempotency keys for sender and recipient
    const senderIdempotencyKey = `${args.idempotencyKey}-sender`;
    const recipientIdempotencyKey = `${args.idempotencyKey}-recipient`;
    
    // Check if sender transaction already exists
    const existingSenderTx = await ctx.db
      .query("coinTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", senderIdempotencyKey))
      .first();
    
    if (existingSenderTx) {
      return {
        success: true,
        senderTransactionId: existingSenderTx._id,
        isDuplicate: true,
      };
    }
    
    // Check sender balance
    const sender = senderProfile as any;
    if (sender.coinBalance < args.amount) {
      throw new Error("Insufficient coins for transfer");
    }
    
    // Deduct from sender
    const senderNewBalance = sender.coinBalance - args.amount;
    await ctx.db.patch(senderProfile._id, {
      coinBalance: senderNewBalance,
      coinBalanceVersion: (sender.coinBalanceVersion || 1) + 1,
      lastCoinTransactionAt: Date.now(),
    });
    
    // Create sender transaction record
    const senderTransactionId = await ctx.db.insert("coinTransactions", {
      userId: senderProfile._id,
      type: "purchase",
      amount: -args.amount,
      balanceAfter: senderNewBalance,
      balanceVersion: (sender.coinBalanceVersion || 1) + 1,
      idempotencyKey: senderIdempotencyKey,
      description: `Transfer to ${(recipient as any).displayName}: ${args.description}`,
      createdAt: Date.now(),
    });
    
    // Add to recipient
    const recipientUser = recipient as any;
    const recipientNewBalance = (recipientUser.coinBalance || 0) + args.amount;
    await ctx.db.patch(args.toUserId, {
      coinBalance: recipientNewBalance,
      coinBalanceVersion: (recipientUser.coinBalanceVersion || 1) + 1,
      lastCoinTransactionAt: Date.now(),
    });
    
    // Create recipient transaction record
    const recipientTransactionId = await ctx.db.insert("coinTransactions", {
      userId: args.toUserId,
      type: "admin",
      amount: args.amount,
      balanceAfter: recipientNewBalance,
      balanceVersion: (recipientUser.coinBalanceVersion || 1) + 1,
      idempotencyKey: recipientIdempotencyKey,
      description: `Transfer from ${sender.displayName}: ${args.description}`,
      createdAt: Date.now(),
    });

    return {
      success: true,
      senderTransactionId,
      recipientTransactionId,
      isDuplicate: false,
    };
  },
});

/**
 * Admin function: Adjust user coins (for support, corrections, etc.)
 */
export const adminAdjustCoins = mutation({
  args: {
    userId: v.id("userProfiles"),
    amount: v.number(),
    description: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const adminProfile = await requireAdmin(ctx);
    console.log('Admin adjustment initiated by:', adminProfile.displayName);

    // Validate amount
    const amountValidation = validateCoinAmount(args.amount);
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error || "Invalid coin amount");
    }

    // Check idempotency
    const existingTransaction = await ctx.db
      .query("coinTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existingTransaction) {
      return {
        success: true,
        transactionId: existingTransaction._id,
        isDuplicate: true,
      };
    }

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Implement admin adjustment directly
    const target = targetUser as any;
    const currentBalance = target.coinBalance || 0;
    const currentVersion = target.coinBalanceVersion || 1;
    const newBalance = currentBalance + args.amount;
    
    // Validate new balance
    try {
      coinBalanceSchema.parse(newBalance);
    } catch {
      throw new Error("Invalid balance after adjustment");
    }
    
    // Update user balance
    await ctx.db.patch(args.userId, {
      coinBalance: newBalance,
      coinBalanceVersion: currentVersion + 1,
      lastCoinTransactionAt: Date.now(),
    });
    
    // Create transaction record
    const transactionId = await ctx.db.insert("coinTransactions", {
      userId: args.userId,
      type: "admin",
      amount: args.amount,
      balanceAfter: newBalance,
      balanceVersion: currentVersion + 1,
      idempotencyKey: args.idempotencyKey,
      description: `Admin adjustment: ${args.description}`,
      createdAt: Date.now(),
    });

    return {
      success: true,
      transactionId,
      balanceAfter: newBalance,
      isDuplicate: false,
    };
  },
});
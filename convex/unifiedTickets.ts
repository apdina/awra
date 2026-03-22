/**
 * Unified Ticket System
 * 
 * Single ticket system with complete data and payout rules:
 * - Exact match (all 3 digits): betAmount × 100
 * - Partial match (last 2 digits): betAmount × 20
 * - No match: 0
 */

import { v } from "convex/values";
import { mutation, query, httpAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { requireAuth } from "./auth";
import { verifyToken } from "./native_auth";
import { Id } from "./_generated/dataModel";

// Constants
const EXACT_MATCH_MULTIPLIER = 100;
const PARTIAL_MATCH_MULTIPLIER = 20;
const MIN_NUMBER = 1;
const MAX_NUMBER = 200;
const MIN_BET_AMOUNT = 1;

/**
 * Calculate payout based on match type
 * @param betNumber The number the user bet on (1-200)
 * @param winningNumber The winning number (1-200)
 * @param betAmount The amount bet in coins
 * @returns Object with payout amount and match type
 */
function calculatePayout(
  betNumber: number, 
  winningNumber: number, 
  betAmount: number
): { payout: number; multiplier: number; matchType: "exact" | "partial" | "none" } {
  // Exact match (all 3 digits): betAmount × 100
  if (betNumber === winningNumber) {
    return {
      payout: betAmount * EXACT_MATCH_MULTIPLIER,
      multiplier: EXACT_MATCH_MULTIPLIER,
      matchType: "exact"
    };
  }
  
  // Partial match (last 2 digits): betAmount × 20
  const betLastTwo = betNumber % 100;
  const winLastTwo = winningNumber % 100;
  if (betLastTwo === winLastTwo) {
    return {
      payout: betAmount * PARTIAL_MATCH_MULTIPLIER,
      multiplier: PARTIAL_MATCH_MULTIPLIER,
      matchType: "partial"
    };
  }
  
  // No match
  return {
    payout: 0,
    multiplier: 0,
    matchType: "none"
  };
}

/**
 * Generate a unique ticket ID
 * Format: TICKET-{timestamp}-{random6chars}
 */
function generateTicketId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TICKET-${timestamp}-${random}`;
}

/**
 * Validate bet data
 */
function validateBets(bets: Array<{ number: number; amount: number }>): void {
  if (!bets || bets.length === 0) {
    throw new Error("At least one bet is required");
  }

  for (const bet of bets) {
    if (bet.number < MIN_NUMBER || bet.number > MAX_NUMBER) {
      throw new Error(`Number must be between ${MIN_NUMBER} and ${MAX_NUMBER}`);
    }
    if (bet.amount < MIN_BET_AMOUNT) {
      throw new Error(`Bet amount must be at least ${MIN_BET_AMOUNT} coin`);
    }
  }
}

/**
 * Calculate which draw a ticket purchase belongs to
 * 
 * ⏰ TIME CRITICAL CODE
 * 
 * Date Format: DD/MM/YYYY (returned)
 * Time Format: HH:MM 24-hour (read from systemConfig.default_draw_time)
 * Timezone: UTC (CRITICAL: Convex runs in West Virginia EST/EDT, must use UTC methods!)
 * 
 * Based on 24-hour window logic: tickets purchased between draw N and draw N+1 belong to draw N+1
 * Skips Sundays - if next draw would be Sunday, moves to Monday
 * 
 * Example: User buys ticket Saturday 21:45 UTC
 * - Saturday's draw (21:40 UTC) has passed
 * - Next would be Sunday, but Sundays are skipped
 * - Ticket is for Monday's draw
 * 
 * ⚠️ IMPORTANT: Convex server is in West Virginia (UTC-5/UTC-4)
 * - NEVER use: getDay(), getHours(), getDate(), setHours(), setDate() - these use local time
 * - ALWAYS use: getUTCDay(), getUTCHours(), getUTCDate(), setUTCHours(), setUTCDate() - these use UTC
 * 
 * ⚠️ DO NOT modify without:
 * 1. Testing Sunday skip logic IN UTC
 * 2. Verifying draw time changes work
 * 3. Testing edge cases (exactly at draw time)
 * 4. Ensuring consistency with frontend countdown
 * 
 * Single Source of Truth: This function calculates draw date/time for tickets IN UTC
 * 
 * @param ctx Database context
 * @param purchaseTimestamp When the ticket was purchased (milliseconds)
 * @returns Object with drawDate (DD/MM/YYYY) and drawTime (HH:MM)
 */
async function calculateDrawForPurchase(
  ctx: any,
  purchaseTimestamp: number
): Promise<{ drawDate: string; drawTime: string }> {
  // Call the SAME query that countdown uses: getOrCreateCurrentDraw
  // This is the single source of truth
  
  // Batch fetch configs at top (same as getOrCreateCurrentDraw)
  const configs = await ctx.db.query("systemConfig").collect();
  const defaultTimeConfig = configs.find((c: any) => c.key === "default_draw_time");
  const defaultDrawTime = (defaultTimeConfig?.value as string) || "21:40";
  
  // Find the most recent active or upcoming draw (same as getOrCreateCurrentDraw)
  const draws = await ctx.db
    .query("dailyDraws")
    .order("desc")
    .take(10);
  
  // Find first draw that hasn't been completed (same as getOrCreateCurrentDraw)
  const activeDraw = draws.find((d: any) => d.status !== "completed");
  
  if (activeDraw) {
    // Extract time from drawingTime using UTC (same as getOrCreateCurrentDraw)
    const d = new Date(activeDraw.drawingTime);
    const drawTime = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    
    return {
      drawDate: activeDraw.drawId,
      drawTime: drawTime
    };
  }
  
  // No active draw - calculate fallback (same as getOrCreateCurrentDraw)
  const excludeSundaysConfig = await ctx.db
    .query("systemConfig")
    .filter((q: any) => q.eq(q.field("key"), "exclude_sundays"))
    .first();
  
  const holidaysConfig = await ctx.db
    .query("systemConfig")
    .filter((q: any) => q.eq(q.field("key"), "holiday_exceptions"))
    .first();
  
  const excludeSundays = excludeSundaysConfig?.value !== false;
  const holidays: string[] = holidaysConfig ? JSON.parse(holidaysConfig.value as string) : [];
  
  // Helper function to check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = date.getUTCFullYear();
    const dateStr = `${d}/${m}/${y}`;
    return holidays.includes(dateStr);
  };
  
  let nextDrawDate = new Date();
  nextDrawDate.setUTCHours(0, 0, 0, 0);
  
  const [hours, minutes] = defaultDrawTime.split(':').map(Number);
  nextDrawDate.setUTCHours(hours, minutes, 0, 0);
  
  if (nextDrawDate.getTime() <= purchaseTimestamp) {
    nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
  }
  
  // Skip Sundays
  while (excludeSundays && nextDrawDate.getUTCDay() === 0) {
    nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
  }
  
  // Skip holidays
  while (isHoliday(nextDrawDate)) {
    nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
    
    // Re-check Sunday after skipping holiday
    if (excludeSundays && nextDrawDate.getUTCDay() === 0) {
      nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
    }
  }
  
  const day = String(nextDrawDate.getUTCDate()).padStart(2, '0');
  const month = String(nextDrawDate.getUTCMonth() + 1).padStart(2, '0');
  const year = nextDrawDate.getUTCFullYear();
  
  return {
    drawDate: `${day}/${month}/${year}`,
    drawTime: defaultDrawTime
  };
}

/**
 * Purchase a unified ticket
 */
export const purchaseUnifiedTicket = mutation({
  args: {
    bets: v.array(v.object({
      number: v.number(),
      amount: v.number(),
    })),
    // drawDate and drawTime removed - calculated server-side
  },
  handler: async (ctx, args) => {
    const userProfile = await requireAuth(ctx);

    // Validate bets
    validateBets(args.bets);

    // Calculate total amount
    const totalAmount = args.bets.reduce((sum, bet) => sum + bet.amount, 0);

    // Check user balance
    const currentBalance = userProfile.coinBalance || 0;
    const currentVersion = userProfile.coinBalanceVersion || 1;

    if (currentBalance < totalAmount) {
      throw new Error("Insufficient balance");
    }

    // Generate ticket ID
    const ticketId = generateTicketId();
    const now = Date.now();

    // Calculate correct draw for this purchase based on timestamp
    const { drawDate, drawTime } = await calculateDrawForPurchase(ctx, now);

    // Create unified ticket
    const ticketDocId = await ctx.db.insert("unifiedTickets", {
      ticketId,
      userId: userProfile._id,
      bets: args.bets,
      totalAmount,
      potentialPayout: 0, // Will be calculated when winning number is known
      status: "active",
      isWinning: false,
      winningAmount: 0,
      purchasedAt: now,
      drawDate, // Calculated server-side
      drawTime, // Calculated server-side
      createdAt: now,
      updatedAt: now,
    });

    // Update user balance with optimistic concurrency
    await ctx.db.patch(userProfile._id, {
      coinBalance: currentBalance - totalAmount,
      coinBalanceVersion: currentVersion + 1,
      totalSpent: (userProfile.totalSpent || 0) + totalAmount,
      lastActiveAt: now,
    });

    // Create purchase transaction record
    const idempotencyKey = `purchase-${ticketId}-${now}`;
    await ctx.db.insert("coinTransactions", {
      userId: userProfile._id,
      type: "purchase",
      amount: -totalAmount,
      balanceAfter: currentBalance - totalAmount,
      balanceVersion: currentVersion + 1,
      idempotencyKey,
      relatedTicketId: ticketDocId,
      description: `Ticket purchase: ${args.bets.length} bet(s) for draw ${drawDate} ${drawTime}`,
      createdAt: now,
    });

    return {
      ticketId,
      ticketDocId,
      totalAmount,
      newBalance: currentBalance - totalAmount,
      drawDate, // Return calculated draw date
      drawTime, // Return calculated draw time
      betCount: args.bets.length,
    };
  },
});

/**
 * Purchase ticket with token authentication (for API routes)
 */
export const purchaseUnifiedTicketWithToken = mutation({
  args: {
    bets: v.array(v.object({
      number: v.number(),
      amount: v.number(),
    })),
    // drawDate and drawTime removed - calculated server-side
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token and get user
    const tokenData = await verifyToken(args.token);
    if (!tokenData) {
      throw new Error("Invalid authentication token");
    }

    const user = await ctx.db.get(tokenData.userId as Id<"userProfiles">) as any;
    if (!user) {
      throw new Error("User not found");
    }

    // Validate that this is actually a user profile
    if (user.coinBalance === undefined) {
      throw new Error("Invalid user data");
    }

    // Validate bets
    validateBets(args.bets);

    // Calculate total amount
    const totalAmount = args.bets.reduce((sum, bet) => sum + bet.amount, 0);

    // Check user balance
    const currentBalance = user.coinBalance || 0;
    const currentVersion = user.coinBalanceVersion || 1;

    if (currentBalance < totalAmount) {
      throw new Error("Insufficient balance");
    }

    // Generate ticket ID
    const ticketId = generateTicketId();
    const now = Date.now();

    // Calculate correct draw for this purchase based on timestamp
    const { drawDate, drawTime } = await calculateDrawForPurchase(ctx, now);

    // Create unified ticket
    const ticketDocId = await ctx.db.insert("unifiedTickets", {
      ticketId,
      userId: user._id as Id<"userProfiles">,
      bets: args.bets,
      totalAmount,
      potentialPayout: 0,
      status: "active",
      isWinning: false,
      winningAmount: 0,
      purchasedAt: now,
      drawDate, // Calculated server-side
      drawTime, // Calculated server-side
      createdAt: now,
      updatedAt: now,
    });

    // Update user balance
    await ctx.db.patch(user._id as Id<"userProfiles">, {
      coinBalance: currentBalance - totalAmount,
      coinBalanceVersion: currentVersion + 1,
      totalSpent: (user.totalSpent || 0) + totalAmount,
      lastActiveAt: now,
    });

    // Create purchase transaction record
    const idempotencyKey = `purchase-${ticketId}-${now}`;
    await ctx.db.insert("coinTransactions", {
      userId: user._id as Id<"userProfiles">,
      type: "purchase",
      amount: -totalAmount,
      balanceAfter: currentBalance - totalAmount,
      balanceVersion: currentVersion + 1,
      idempotencyKey,
      relatedTicketId: ticketDocId,
      description: `Ticket purchase: ${args.bets.length} bet(s) for draw ${drawDate} ${drawTime}`,
      createdAt: now,
    });

    return {
      ticketId,
      ticketDocId,
      totalAmount,
      newBalance: currentBalance - totalAmount,
      drawDate, // Return calculated draw date
      drawTime, // Return calculated draw time
      betCount: args.bets.length,
    };
  },
});

/**
 * Get user's unified tickets with filters
 */
export const getUserUnifiedTickets = query({
  args: {
    userId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("won"), v.literal("lost"))),
    drawDate: v.optional(v.string()),
    drawTime: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If userId is provided, use it (for server-side API calls)
    // Otherwise, get user from authentication (for client-side calls)
    let targetUserId: Id<"userProfiles">;
    
    if (args.userId) {
      targetUserId = args.userId as Id<"userProfiles">;
    } else {
      const userProfile = await requireAuth(ctx);
      targetUserId = userProfile._id;
    }

    // Start building query
    let queryBuilder = ctx.db
      .query("unifiedTickets")
      .filter((q) => q.eq(q.field("userId"), targetUserId));

    // Apply status filter if provided
    if (args.status) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Apply draw date filter if provided
    if (args.drawDate) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("drawDate"), args.drawDate));
    }

    // Apply draw time filter if provided
    if (args.drawTime) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("drawTime"), args.drawTime));
    }

    // Order by purchase date (newest first) and take limit
    const tickets = await queryBuilder
      .order("desc")
      .take(args.limit || 50);

    return tickets;
  },
});
/**
 * Get user's unified tickets with token authentication
 * Used by API routes that use HTTP-only cookies
 */
export const getUserUnifiedTicketsWithToken = query({
  args: {
    token: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("won"), v.literal("lost"))),
    drawDate: v.optional(v.string()),
    drawTime: v.optional(v.string()),
    limit: v.optional(v.number()),
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

    const targetUserId = userProfile._id;

    // Start building query
    let queryBuilder = ctx.db
      .query("unifiedTickets")
      .filter((q) => q.eq(q.field("userId"), targetUserId));

    // Apply status filter if provided
    if (args.status) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Apply draw date filter if provided
    if (args.drawDate) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("drawDate"), args.drawDate));
    }

    // Apply draw time filter if provided
    if (args.drawTime) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("drawTime"), args.drawTime));
    }

    // Order by purchase date (newest first) and take limit
    const tickets = await queryBuilder
      .order("desc")
      .take(args.limit || 50);

    return tickets;
  },
});

/**
 * Get ticket by ID
 */
export const getUnifiedTicketById = query({
  args: {
    ticketId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("unifiedTickets")
      .withIndex("by_ticket_id", (q) => q.eq("ticketId", args.ticketId))
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    return ticket;
  },
});

/**
 * Process draw and calculate winners
 * Admin function to set winning number and calculate payouts
 * 
 * When admin sets winning number for date 20/02/2026 at 21:40:
 * - Processes tickets purchased between 19/02/2026 21:40:01 and 20/02/2026 21:40:00
 * - This is the 24-hour window for that draw
 */
export const processDrawInternal = internalMutation({
  args: {
    drawDate: v.string(), // DD/MM/YYYY
    drawTime: v.optional(v.string()), // HH:MM - optional, fetched from system config if not provided
    winningNumber: v.number(),
    adminSecret: v.optional(v.string()), // Optional admin secret to bypass auth
  },
  handler: async (ctx, args) => {
    // Check for admin secret first, otherwise require user auth
    if (args.adminSecret) {
      // Verify admin secret from database
      const config = await ctx.db
        .query("systemConfig")
        .filter((q) => q.eq(q.field("key"), "adminSecret"))
        .first();
      
      const ADMIN_SECRET = config?.value || "";
      if (args.adminSecret !== ADMIN_SECRET) {
        throw new Error("Invalid admin secret");
      }
    } else {
      // Require user authentication if no admin secret provided
      await requireAuth(ctx);
    }

    // Validate winning number
    if (args.winningNumber < MIN_NUMBER || args.winningNumber > MAX_NUMBER) {
      throw new Error(`Winning number must be between ${MIN_NUMBER} and ${MAX_NUMBER}`);
    }

    // Get drawTime from the actual draw record to ensure consistency
    const drawRecord = await ctx.db
      .query("dailyDraws")
      .withIndex("by_drawId", (q) => q.eq("drawId", args.drawDate))
      .first();
    
    if (!drawRecord) {
      throw new Error(`Draw ${args.drawDate} not found in database`);
    }
    
    // Additional validation: ensure draw record has the correct drawId
    if (drawRecord.drawId !== args.drawDate) {
      throw new Error(`Draw record drawId mismatch: expected ${args.drawDate}, found ${drawRecord.drawId}`);
    }
    
    // Ensure the draw has a winning number set
    if (!drawRecord.winningNumber) {
      throw new Error(`Draw ${args.drawDate} does not have a winning number set`);
    }
    
    // Ensure the winning number matches what was passed
    if (drawRecord.winningNumber !== args.winningNumber) {
      throw new Error(`Winning number mismatch: expected ${args.winningNumber}, draw has ${drawRecord.winningNumber}`);
    }
    
    // Extract drawTime from the draw's drawingTime
    const drawDateTime = new Date(drawRecord.drawingTime);
    const drawTime = `${String(drawDateTime.getUTCHours()).padStart(2, '0')}:${String(drawDateTime.getUTCMinutes()).padStart(2, '0')}`;
    
    console.log(`Using drawTime from draw record: ${drawTime} (drawingTime: ${drawRecord.drawingTime})`);

    // Parse draw date and time to validate and calculate window
    const [day, month, year] = args.drawDate.split('/').map(Number);
    const [hours, minutes] = drawTime.split(':').map(Number);
    
    if (!day || !month || !year || !hours || minutes === undefined) {
      throw new Error("Invalid draw date or time format");
    }
    
    // Calculate draw timestamp (UTC)
    const drawTimestamp = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0)).getTime();
    const now = Date.now();
    
    // Validate that draw time has passed (can't process future draws)
    if (drawTimestamp > now) {
      throw new Error(`Cannot process future draw. Draw time is ${new Date(drawTimestamp).toLocaleString()}, current time is ${new Date(now).toLocaleString()}`);
    }
    
    // Calculate 24-hour window for this draw
    const windowStart = drawTimestamp - (24 * 60 * 60 * 1000); // 24 hours before
    const windowEnd = drawTimestamp; // Up to draw time
    
    const windowStartDate = new Date(windowStart);
    const windowEndDate = new Date(drawTimestamp);
    
    console.log(`Processing draw ${args.drawDate} ${drawTime}`);
    console.log(`24-hour window: ${windowStartDate.toLocaleString()} to ${windowEndDate.toLocaleString()}`);
    console.log(`Winning number: ${args.winningNumber}`);

    // Get all active tickets for this draw
    const activeTickets = await ctx.db
      .query("unifiedTickets")
      .withIndex("by_draw_status", (q) => 
        q.eq("drawDate", args.drawDate)
         .eq("drawTime", drawTime)
         .eq("status", "active")
      )
      .collect();

    console.log(`Found ${activeTickets.length} active tickets for this draw`);

    if (activeTickets.length === 0) {
      return {
        success: true,
        drawDate: args.drawDate,
        drawTime: args.drawTime,
        winningNumber: args.winningNumber,
        totalTickets: 0,
        winningTickets: [],
        totalPayout: 0,
        windowStart: windowStartDate.toISOString(),
        windowEnd: windowEndDate.toISOString(),
        message: "No active tickets for this draw",
      };
    }
    
    // Validate that tickets are within the expected window
    let ticketsOutsideWindow = 0;
    for (const ticket of activeTickets) {
      const ticketData = ticket as any;
      if (ticketData.purchasedAt < windowStart || ticketData.purchasedAt > windowEnd) {
        ticketsOutsideWindow++;
        console.warn(`Ticket ${ticketData.ticketId} purchased at ${new Date(ticketData.purchasedAt).toLocaleString()} is outside the 24-hour window`);
      }
    }
    
    if (ticketsOutsideWindow > 0) {
      console.warn(`Warning: ${ticketsOutsideWindow} tickets are outside the expected 24-hour window`);
    }

    const processingTime = Date.now();
    const winners: any[] = [];
    const nonWinners: any[] = [];
    let totalPayout = 0;

    // Process each ticket
    for (const ticket of activeTickets) {
      const ticketData = ticket as any;
      let ticketWinningAmount = 0;
      let ticketIsWinning = false;
      let bestMatchType: "exact" | "partial" | "none" = "none";
      let bestMultiplier = 0;

      // Calculate payout for each bet in the ticket
      for (const bet of ticketData.bets) {
        const { payout, multiplier, matchType } = calculatePayout(
          bet.number,
          args.winningNumber,
          bet.amount
        );

        if (payout > 0) {
          ticketWinningAmount += payout;
          ticketIsWinning = true;
          
          // Track the best match type for this ticket
          if (matchType === "exact") {
            bestMatchType = "exact";
            bestMultiplier = EXACT_MATCH_MULTIPLIER;
          } else if (matchType === "partial" && bestMatchType !== "exact") {
            bestMatchType = "partial";
            bestMultiplier = PARTIAL_MATCH_MULTIPLIER;
          }
        }
      }

      // Update ticket status based on winning/losing
      const updateData: any = {
        status: ticketIsWinning ? "won" : "no_winning", // 🏷️ Clearly mark non-winning tickets
        isWinning: ticketIsWinning,
        winningAmount: ticketWinningAmount,
        winningNumber: args.winningNumber,
        updatedAt: processingTime,
      };

      if (ticketIsWinning) {
        updateData.payoutMultiplier = bestMultiplier;
        updateData.matchType = bestMatchType;
        updateData.potentialPayout = ticketWinningAmount;
      }

      await ctx.db.patch(ticket._id, updateData);

      // If ticket is winning, award coins to user
      if (ticketIsWinning && ticketWinningAmount > 0) {
        // Get user's current balance
        const user = await ctx.db.get(ticketData.userId);
        if (user) {
          const userData = user as any;
          const currentBalance = userData.coinBalance || 0;
          const currentVersion = userData.coinBalanceVersion || 1;
          const newBalance = currentBalance + ticketWinningAmount;

          // Update user balance
          await ctx.db.patch(ticketData.userId, {
            coinBalance: newBalance,
            coinBalanceVersion: currentVersion + 1,
            totalWinnings: (userData.totalWinnings || 0) + ticketWinningAmount,
            lastActiveAt: processingTime,
          });

          // Create winning transaction record
          const idempotencyKey = `win-${ticketData.ticketId}-${processingTime}`;
          await ctx.db.insert("coinTransactions", {
            userId: ticketData.userId,
            type: "winning",
            amount: ticketWinningAmount,
            balanceAfter: newBalance,
            balanceVersion: currentVersion + 1,
            idempotencyKey,
            relatedTicketId: ticket._id,
            description: `Winning payout for ${bestMatchType} match (${bestMultiplier}x) on draw ${args.drawDate} ${args.drawTime}`,
            createdAt: processingTime,
          });

          winners.push({
            ticketId: ticketData.ticketId,
            userId: ticketData.userId,
            winningAmount: ticketWinningAmount,
            matchType: bestMatchType,
            multiplier: bestMultiplier,
          });

          totalPayout += ticketWinningAmount;
          console.log(`✅ WINNER: Ticket ${ticketData.ticketId} (${bestMatchType} match) - Payout: ${ticketWinningAmount} coins`);
        }
      } else {
        // Track non-winning tickets
        nonWinners.push({
          ticketId: ticketData.ticketId,
          userId: ticketData.userId,
          purchasedAt: new Date(ticketData.purchasedAt).toISOString(),
        });
        console.log(`❌ NO WIN: Ticket ${ticketData.ticketId} marked as no_winning`);
      }
    }

    // Schedule cache invalidation action (must be outside mutation)
    await ctx.scheduler.runAfter(0, internal.draws.invalidateCacheInternal, {
      drawId: args.drawDate
    });

    console.log('✅ Cache invalidation scheduled');
    console.log(`📊 Draw Processing Summary: ${winners.length} winners, ${nonWinners.length} non-winners, Total Payout: ${totalPayout} coins`);

    return {
      success: true,
      drawDate: args.drawDate,
      drawTime: args.drawTime,
      winningNumber: args.winningNumber,
      totalTickets: activeTickets.length,
      winners: winners,
      nonWinners: nonWinners, // 🏷️ Track all non-winning tickets for transparency
      totalPayout,
      windowStart: windowStartDate.toISOString(),
      windowEnd: windowEndDate.toISOString(),
      ticketsOutsideWindow,
      message: `Processed ${activeTickets.length} tickets, ${winners.length} winners. Window: ${windowStartDate.toLocaleString()} to ${windowEndDate.toLocaleString()}`,
    };
  },
});

/**
 * Public wrapper for processDrawInternal - can be called from API routes
 */
export const processDraw = mutation({
  args: {
    drawDate: v.string(), // DD/MM/YYYY
    drawTime: v.optional(v.string()), // HH:MM - optional, fetched from system config if not provided
    winningNumber: v.number(),
    adminSecret: v.optional(v.string()), // Optional admin secret to bypass auth
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    // Call the internal function
    return await ctx.runMutation(internal.unifiedTickets.processDrawInternal, args);
  },
});

/**
 * Get winning tickets for a specific draw
 */
export const getWinningTicketsForDraw = query({
  args: {
    drawDate: v.string(),
    drawTime: v.string(),
    winningNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Start with won tickets for this draw
    let queryBuilder = ctx.db
      .query("unifiedTickets")
      .withIndex("by_draw_status", (q) => 
        q.eq("drawDate", args.drawDate)
         .eq("drawTime", args.drawTime)
         .eq("status", "won")
      );

    // If winning number is provided, filter by it
    if (args.winningNumber) {
      const tickets = await queryBuilder.collect();
      return tickets.filter((ticket: any) => 
        ticket.winningNumber === args.winningNumber
      );
    }

    return await queryBuilder.collect();
  },
});

/**
 * Get ticket statistics for a user
 */
export const getUserTicketStats = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let targetUserId: Id<"userProfiles">;
    
    if (args.userId) {
      targetUserId = args.userId as Id<"userProfiles">;
    } else {
      const userProfile = await requireAuth(ctx);
      targetUserId = userProfile._id;
    }

    // Get all user tickets
    const allTickets = await ctx.db
      .query("unifiedTickets")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();

    // Calculate statistics
    const stats = {
      totalTickets: allTickets.length,
      activeTickets: allTickets.filter((t: any) => t.status === "active").length,
      wonTickets: allTickets.filter((t: any) => t.status === "won").length,
      lostTickets: allTickets.filter((t: any) => t.status === "lost").length,
      totalAmountSpent: allTickets.reduce((sum: number, t: any) => sum + t.totalAmount, 0),
      totalAmountWon: allTickets.reduce((sum: number, t: any) => sum + t.winningAmount, 0),
      exactMatches: allTickets.filter((t: any) => t.matchType === "exact").length,
      partialMatches: allTickets.filter((t: any) => t.matchType === "partial").length,
    };

    return stats;
  },
});
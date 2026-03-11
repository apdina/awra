/**
 * Convex Data Validators
 * 
 * Zod schemas for validating data before mutations
 */

import { z } from "zod";

// User Profile Validators
export const displayNameSchema = z
  .string()
  .min(3, "Display name must be at least 3 characters")
  .max(20, "Display name must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Display name can only contain letters, numbers, underscores, and hyphens");

export const avatarUrlSchema = z
  .string()
  .url("Avatar URL must be a valid URL")
  .optional();

// Chat Message Validators
export const chatMessageSchema = z
  .string()
  .min(1, "Message cannot be empty")
  .max(140, "Message must be at most 140 characters")
  .refine(
    (msg) => msg.trim().length > 0,
    "Message cannot be only whitespace"
  );

export const roomIdSchema = z
  .string()
  .min(1, "Room ID cannot be empty")
  .regex(/^[a-zA-Z0-9_-]+$/, "Room ID can only contain letters, numbers, underscores, and hyphens");

// Coin Transaction Validators
export const coinAmountSchema = z
  .number()
  .int("Coin amount must be an integer")
  .min(-10000, "Transaction amount too large (negative)")
  .max(10000, "Transaction amount too large (positive)");

export const coinBalanceSchema = z
  .number()
  .int("Coin balance must be an integer")
  .min(0, "Coin balance cannot be negative");

export const idempotencyKeySchema = z
  .string()
  .min(1, "Idempotency key cannot be empty")
  .max(100, "Idempotency key too long");

// Draw Validators
export const ticketNumberSchema = z
  .number()
  .int("Ticket number must be an integer")
  .min(1, "Ticket number must be at least 1")
  .max(100, "Ticket number must be at most 100");

export const ticketPriceSchema = z
  .number()
  .int("Ticket price must be an integer")
  .min(1, "Ticket price must be at least 1")
  .max(1000, "Ticket price too high");

// Rate Limiting Validators
export const rateLimitSchema = {
  chatMessage: {
    windowMs: 3000, // 3 seconds between messages
    maxAttempts: 1,
  },
  coinTransaction: {
    windowMs: 60000, // 1 minute
    maxAttempts: 10, // 10 transactions per minute
  },
  profileUpdate: {
    windowMs: 3600000, // 1 hour
    maxAttempts: 5, // 5 updates per hour
  },
};

// Helper function to check rate limit
export function checkRateLimit(
  lastTimestamp: number | undefined,
  windowMs: number
): { allowed: boolean; waitMs: number } {
  if (!lastTimestamp) {
    return { allowed: true, waitMs: 0 };
  }

  const now = Date.now();
  const timeSinceLastAction = now - lastTimestamp;

  if (timeSinceLastAction < windowMs) {
    return {
      allowed: false,
      waitMs: windowMs - timeSinceLastAction,
    };
  }

  return { allowed: true, waitMs: 0 };
}

// Helper function to check transaction rate limit (array-based)
export function checkTransactionRateLimit(
  recentTransactions: number[] | undefined,
  windowMs: number,
  maxAttempts: number
): { allowed: boolean; waitMs: number } {
  if (!recentTransactions || recentTransactions.length === 0) {
    return { allowed: true, waitMs: 0 };
  }

  const now = Date.now();
  const recentCount = recentTransactions.filter(
    (timestamp) => now - timestamp < windowMs
  ).length;

  if (recentCount >= maxAttempts) {
    // Find oldest transaction in window
    const oldestInWindow = Math.min(
      ...recentTransactions.filter((t) => now - t < windowMs)
    );
    const waitMs = windowMs - (now - oldestInWindow);
    return { allowed: false, waitMs };
  }

  return { allowed: true, waitMs: 0 };
}

// Sanitization helpers
export function sanitizeChatMessage(message: string): string {
  // Remove excessive whitespace
  let sanitized = message.trim().replace(/\s+/g, " ");

  // Remove potential XSS patterns (basic)
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");

  return sanitized;
}

export function sanitizeDisplayName(name: string): string {
  // Remove whitespace and convert to lowercase
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

// Validation helper functions
export function validateChatMessage(message: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  try {
    chatMessageSchema.parse(message);
    const sanitized = sanitizeChatMessage(message);
    return { valid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || "Validation error" };
    }
    return { valid: false, error: "Invalid message" };
  }
}

export function validateCoinAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  try {
    coinAmountSchema.parse(amount);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || "Validation error" };
    }
    return { valid: false, error: "Invalid coin amount" };
  }
}

export function validateDisplayName(name: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  try {
    displayNameSchema.parse(name);
    const sanitized = sanitizeDisplayName(name);
    return { valid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || "Validation error" };
    }
    return { valid: false, error: "Invalid display name" };
  }
}

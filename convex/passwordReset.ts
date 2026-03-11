import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Password Reset System
 */

/**
 * Request a password reset (generates a reset token)
 * ✅ FIXED: Now includes rate limiting (3 requests per hour per email)
 */
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      // Return success to prevent email enumeration
      return { success: true, message: "If the email exists, a reset link will be sent." };
    }

    // ✅ NEW: Check rate limit
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const rateLimitRecord = await ctx.db
      .query("passwordResetRateLimits")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (rateLimitRecord && rateLimitRecord.windowStart > oneHourAgo) {
      if (rateLimitRecord.requestCount >= 3) {
        // Rate limit exceeded
        const resetTime = rateLimitRecord.windowStart + (60 * 60 * 1000);
        const minutesRemaining = Math.ceil((resetTime - now) / 60000);
        
        console.log(`⛔ Password reset rate limit exceeded for ${args.email}`);
        
        // Still return success to prevent email enumeration
        return { 
          success: true, 
          message: "If the email exists, a reset link will be sent.",
          rateLimited: true,
          minutesRemaining,
        };
      }
    }

    // Find user by email
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('Password reset requested for non-existent email');
      return { success: true, message: "If the email exists, a reset link will be sent." };
    }

    // Check if user uses OAuth
    if (!user.passwordHash) {
      console.log('Password reset requested for OAuth account');
      return { success: true, message: "If the email exists, a reset link will be sent." };
    }

    // ✅ NEW: Record the reset request for rate limiting
    if (!rateLimitRecord) {
      await ctx.db.insert("passwordResetRateLimits", {
        email: args.email,
        requestCount: 1,
        windowStart: now,
        lastRequestAt: now,
      });
    } else if (rateLimitRecord.windowStart > oneHourAgo) {
      await ctx.db.patch(rateLimitRecord._id, {
        requestCount: rateLimitRecord.requestCount + 1,
        lastRequestAt: now,
      });
    } else {
      // Window expired, reset
      await ctx.db.patch(rateLimitRecord._id, {
        requestCount: 1,
        windowStart: now,
        lastRequestAt: now,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    // Invalidate any existing reset tokens for this user
    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const token of existingTokens) {
      await ctx.db.patch(token._id, { used: true });
    }

    // Store reset token
    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      token: resetToken,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    // Send email with reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // In production, send actual email
    if (process.env.NODE_ENV === 'production' && process.env.EMAIL_PROVIDER) {
      try {
        // Import email service dynamically to avoid issues in Convex
        const emailModule = await import('../lib/email');
        const emailTemplate = emailModule.getPasswordResetEmail(resetLink, 60);
        
        const emailResult = await emailModule.sendEmail({
          to: args.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult.error);
          // Don't fail the request, just log the error
        } else {
          console.log('✅ Password reset email sent successfully');
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
        // Don't fail the request, just log the error
      }
    } else {
      // Development mode - log the link
      console.log('🔐 Password reset token generated');
    }

    return { 
      success: true, 
      message: "If the email exists, a reset link will be sent.",
      // Remove this in production - only for development
      devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      devLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    };
  },
});

/**
 * Verify a password reset token
 */
export const verifyResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const resetRecord = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetRecord) {
      return { valid: false, message: "Invalid reset token" };
    }

    if (resetRecord.used) {
      return { valid: false, message: "Reset token already used" };
    }

    if (resetRecord.expiresAt < Date.now()) {
      return { valid: false, message: "Reset token expired" };
    }

    return { valid: true, userId: resetRecord.userId };
  },
});

/**
 * Reset password using token
 */
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token
    const resetRecord = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetRecord) {
      throw new Error("Invalid reset token");
    }

    if (resetRecord.used) {
      throw new Error("Reset token already used");
    }

    if (resetRecord.expiresAt < Date.now()) {
      throw new Error("Reset token expired");
    }

    // Validate new password
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(args.newPassword)) {
      throw new Error("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(args.newPassword)) {
      throw new Error("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(args.newPassword)) {
      throw new Error("Password must contain at least one number");
    }

    // Hash new password (synchronous for Convex compatibility)
    const bcrypt = await import("bcryptjs");
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(args.newPassword, salt);

    // Update user password
    await ctx.db.patch(resetRecord.userId, {
      passwordHash,
      lastActiveAt: Date.now(),
    });

    // Mark token as used
    await ctx.db.patch(resetRecord._id, {
      used: true,
    });

    // Invalidate all existing tokens for this user
    const user = await ctx.db.get(resetRecord.userId);
    if (user) {
      await ctx.db.patch(resetRecord.userId, {
        tokenVersion: (user.tokenVersion || 0) + 1,
      });
    }

    console.log('🔐 Password reset successful');

    return { success: true };
  },
});

/**
 * Cleanup expired reset tokens (run periodically)
 */
export const cleanupExpiredResetTokens = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredTokens = await ctx.db
      .query("passwordResetTokens")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
    }

    return { deleted: expiredTokens.length };
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth as convexRequireAuth } from "./auth";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { 
  validateChatMessage, 
  checkRateLimit, 
  rateLimitSchema
} from "./validators";
import { CHAT_ROOMS, getChatRoom, isRoomFull, hasUserReachedMessageLimit } from "./chat_rooms_config";
import { verifyToken as unifiedVerifyToken } from "../lib/convex-auth-utils";
import bcrypt from 'bcryptjs';
import { getDefaultAvatar } from './avatar';
import { recordFailedAttemptInternal, isAccountLockedInternal, clearFailedAttemptsInternal } from './loginAttempts';

// Native Convex Authentication System
// Uses Convex-native auth and password hashing

// Secure password hashing using bcrypt (synchronous for Convex compatibility)
function hashPassword(password: string): string {
  const saltRounds = 12;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password: string, hash: string): boolean {
  // Check if this is an old weak hash (SHA-256 or dev_hash)
  if (hash.startsWith('dev_hash_') || (hash.length === 64 && !hash.includes('$'))) {
    console.log('🔐 Old password format detected, reset required');
    throw new Error("Your password needs to be reset for security reasons. Please contact support.");
  }
  
  // Use bcrypt verification (synchronous)
  try {
    const isValid = bcrypt.compareSync(password, hash);
    console.log('🔐 Password verification completed');
    return isValid;
  } catch (error) {
    console.error('🔐 Password verification error:', error);
    return false;
  }
}

// Secure JWT token generation with HMAC signature
async function generateToken(userId: string, tokenVersion?: number): Promise<string> {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32');
  }
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    userId, 
    type: 'access',
    iat: Date.now(),
    exp: Date.now() + (15 * 60 * 1000), // 15 minutes (short-lived)
    jti: crypto.randomUUID(), // Unique token ID for revocation support
    tokenVersion: tokenVersion || 0 // Include tokenVersion for invalidation
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const keyData = encoder.encode(secret);
  
  try {
    // Use Web Crypto API for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureArray = Array.from(new Uint8Array(signature));
    const encodedSignature = btoa(String.fromCharCode(...signatureArray));
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Generate refresh token (long-lived for persistent sessions)
 */
async function generateRefreshToken(userId: string, deviceId: string): Promise<string> {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32');
  }
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    userId,
    deviceId,
    type: 'refresh',
    iat: Date.now(),
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    jti: crypto.randomUUID()
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const encoder = new TextEncoder();
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const keyData = encoder.encode(secret);
  
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureArray = Array.from(new Uint8Array(signature));
    const encodedSignature = btoa(String.fromCharCode(...signatureArray));
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Hash refresh token for secure storage
 */
async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Use unified token verification
export const verifyToken = unifiedVerifyToken;

/**
 * Register a new user with email and password
 */
export const registerWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Validate password strength (must match changePassword requirements)
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(args.password)) {
      throw new Error("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(args.password)) {
      throw new Error("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(args.password)) {
      throw new Error("Password must contain at least one number");
    }

    // Check if email already exists
    const existingEmail = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (existingEmail) {
      throw new Error("Email already registered");
    }

    // Check if displayName already exists
    const existingDisplayName = await ctx.db
      .query("userProfiles")
      .withIndex("by_displayName", (q) => q.eq("displayName", args.displayName))
      .first();

    if (existingDisplayName) {
      throw new Error("Display name already taken");
    }

    // Secure password hash with bcrypt
    const passwordHash = hashPassword(args.password);

    // Get default avatar for new user
    const defaultAvatar = getDefaultAvatar();

    // Create new user with email verification flag
    const userId = await ctx.db.insert("userProfiles", {
      email: args.email,
      passwordHash,
      displayName: args.displayName,
      avatarName: defaultAvatar.avatarName,
      avatarType: defaultAvatar.avatarType,
      avatarUrl: defaultAvatar.imagePath,
      coinBalance: 100, // Starting bonus
      coinBalanceVersion: 1,
      totalWinnings: 0,
      totalSpent: 0,
      isActive: true,
      isBanned: false,
      isAdmin: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return { success: true, userId };
  },
});

/**
 * Login with email and password
 */
export const loginWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    deviceId: v.optional(v.string()), // Client-generated device ID
    rememberMe: v.optional(v.boolean()), // User preference (default: true)
  },
  handler: async (ctx, args): Promise<{ success: boolean; user: any; accessToken: string | null; refreshToken: string | null; error?: string }> => {
    try {
      // Check if account is locked
      const lockStatus = await isAccountLockedInternal(ctx, args.email);

      if (lockStatus.isLocked) {
        const minutesRemaining = Math.ceil(
          ((lockStatus.lockedUntil || 0) - Date.now()) / (60 * 1000)
        );
        return {
          success: false,
          error: `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minutes.`,
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      // Find user by email
      const user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", args.email))
        .first();

      if (!user) {
        // Record failed attempt
        await recordFailedAttemptInternal(ctx, args.email);
        return {
          success: false,
          error: "Invalid email or password",
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: "Account is inactive",
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      // Check if user is banned
      if (user.isBanned) {
        return {
          success: false,
          error: `Account banned: ${user.banReason || 'No reason provided'}`,
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      // Verify password
      if (!user.passwordHash) {
        return {
          success: false,
          error: "Account uses different authentication method",
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      let passwordValid = false;
      try {
        passwordValid = verifyPassword(args.password, user.passwordHash);
      } catch (error: any) {
        // Old hash detected - record failed attempt
        await recordFailedAttemptInternal(ctx, args.email);
        return {
          success: false,
          error: error.message || "Your password needs to be reset for security reasons. Please use the 'Forgot Password' link.",
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }
      
      if (!passwordValid) {
        // Record failed attempt
        const attemptResult = await recordFailedAttemptInternal(ctx, args.email);
        
        if (attemptResult.isLocked) {
          return {
            success: false,
            error: "Too many failed login attempts. Account locked for 15 minutes.",
            user: null,
            accessToken: null,
            refreshToken: null,
          };
        }
        
        return {
          success: false,
          error: `Invalid email or password. ${attemptResult.remainingAttempts} attempts remaining before lockout.`,
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      // Clear failed attempts on successful login
      await clearFailedAttemptsInternal(ctx, args.email);

      // Update last active
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });

      // Generate device ID if not provided
      const deviceId: string = args.deviceId || crypto.randomUUID();
      
      // Generate access token (short-lived)
      const accessToken = await generateToken(user._id.toString(), user.tokenVersion || 0);
      
      // Generate refresh token if rememberMe is true (default: true)
      const rememberMe = args.rememberMe !== false;
      let refreshToken = null;
      
      if (rememberMe) {
        refreshToken = await generateRefreshToken(user._id.toString(), deviceId);
        
        // Store refresh token in database (hashed)
        const tokenHash = await hashRefreshToken(refreshToken);
        
        // Get token payload for jti
        const tokenData = await verifyToken(refreshToken);
        
        if (tokenData) {
          await ctx.db.insert("refreshTokens", {
            userId: user._id,
            deviceId,
            tokenHash,
            jti: tokenData.jti || crypto.randomUUID(),
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
            isRevoked: false,
          });
        }
      }

      // Update user presence to online (with unique sessionId for this session)
      const sessionId = `native_${String(user._id)}_${Date.now()}`;
      try {
        // Update presence directly
        const existingPresence = await ctx.db
          .query("userPresence")
          .withIndex("by_user_session", (q: any) => 
            q.eq("userId", user._id).eq("sessionId", sessionId)
          )
          .first();

        if (existingPresence) {
          await ctx.db.patch(existingPresence._id, {
            status: "online" as const,
            currentRoomId: "global",
            isTyping: false,
            lastSeen: Date.now(),
          });
        } else {
          await ctx.db.insert("userPresence", {
            userId: user._id,
            sessionId,
            status: "online" as const,
            currentRoomId: "global",
            isTyping: false,
            lastSeen: Date.now(),
          });
        }
        console.log('👤 User presence set to online');
      } catch (presenceError: any) {
        console.warn('⚠️ Failed to set user presence:', presenceError.message);
        // Don't fail login if presence update fails
      }

      return { success: true, user, accessToken, refreshToken };
    } catch (error: any) {
      console.error('🔐 Login error:', error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred during login",
        user: null,
        accessToken: null,
        refreshToken: null,
      };
    }
  },
});

/**
 * Register/login with OAuth provider
 */
export const registerWithOAuth = mutation({
  args: {
    provider: v.string(),
    providerId: v.string(),
    email: v.optional(v.string()),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if OAuth account already exists
    const existingOAuth = await ctx.db
      .query("userProfiles")
      .withIndex("by_oauth", (q) => 
        q.eq("oauthProvider", args.provider).eq("oauthId", args.providerId)
      )
      .first();

    if (existingOAuth) {
      // Update last active and return existing user
      await ctx.db.patch(existingOAuth._id, {
        lastActiveAt: Date.now(),
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
      });
      return { success: true, user: existingOAuth, isNew: false };
    }

    // Check if email already exists (for account linking)
    if (args.email) {
      const existingEmail = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", args.email))
        .first();

      if (existingEmail) {
        // Link OAuth to existing email account
        await ctx.db.patch(existingEmail._id, {
          oauthProvider: args.provider,
          oauthId: args.providerId,
          lastActiveAt: Date.now(),
        });
        return { success: true, user: existingEmail, isNew: false };
      }
    }

    // Check if displayName already exists
    let existingDisplayNameCheck = await ctx.db
      .query("userProfiles")
      .withIndex("by_displayName", (q) => q.eq("displayName", args.displayName))
      .first();

    if (existingDisplayNameCheck) {
      // Append a number to make displayName unique
      let uniqueDisplayName = args.displayName;
      let counter = 1;
      while (existingDisplayNameCheck) {
        uniqueDisplayName = `${args.displayName}${counter}`;
        existingDisplayNameCheck = await ctx.db
          .query("userProfiles")
          .withIndex("by_displayName", (q) => q.eq("displayName", uniqueDisplayName))
          .first();
        counter++;
      }
      args.displayName = uniqueDisplayName;
    }

    // Create new OAuth user
    const userId = await ctx.db.insert("userProfiles", {
      email: args.email,
      oauthProvider: args.provider,
      oauthId: args.providerId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      coinBalance: 100, // Starting bonus
      coinBalanceVersion: 1,
      totalWinnings: 0,
      totalSpent: 0,
      isActive: true,
      isBanned: false,
      isAdmin: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    return { success: true, user, isNew: true };
  },
});

/**
 * Get current authenticated user by token
 */
export const getCurrentUserByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) {
      return null;
    }

    const tokenData = await verifyToken(args.token, ctx);
    if (!tokenData) {
      return null;
    }

    try {
      const user = await ctx.db.get(tokenData.userId as Id<"userProfiles">);
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },
});

/**
 * Get current authenticated user (read-only)
 * Uses Convex's built-in authentication
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Try to find user by email first (for email/password users)
    let user = null;
    if (identity.email) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
        .first();
    }

    // If not found by email, try by OAuth
    if (!user && identity.provider && identity.subject) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_oauth", (q: any) => 
          q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
        )
        .first();
    }

    return user;
  },
});

/**
 * Ensure user profile exists (create if needed)
 */
export const ensureUserProfile = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Not authenticated - return null instead of throwing
      return null;
    }

    // Try to find user by email first
    let user = null;
    if (identity.email) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
        .first();
    }

    // If not found by email, try by OAuth
    if (!user && identity.provider && identity.subject) {
      user = await ctx.db
        .query("userProfiles")
        .withIndex("by_oauth", (q: any) => 
          q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
        )
        .first();
    }

    // If still not found, create a new user from identity
    if (!user && identity.name) {
      const userId = await ctx.db.insert("userProfiles", {
        email: identity.email || undefined,
        oauthProvider: (identity.provider as string | undefined),
        oauthId: (identity.subject as string | undefined),
        displayName: identity.name,
        avatarUrl: identity.pictureUrl || undefined,
        coinBalance: 100,
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
    }

    if (user) {
      // Update last active
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });
    }

    return user;
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    token: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarName: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("basic"), v.literal("special"), v.literal("photo"))),
    usePhoto: v.optional(v.boolean()),
    userPhoto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify token
    const tokenData = await verifyToken(args.token, ctx);
    if (!tokenData) {
      throw new Error("Invalid or expired token");
    }

    // Get user
    const userDoc = await ctx.db.get(tokenData.userId as any);
    if (!userDoc) {
      throw new Error("User not found");
    }

    const user = userDoc as any;

    // Check if displayName is being changed and is unique
    if (args.displayName && args.displayName !== user.displayName) {
      const existingDisplayName = await ctx.db
        .query("userProfiles")
        .withIndex("by_displayName", (q: any) => q.eq("displayName", args.displayName || ""))
        .first();

      if (existingDisplayName && existingDisplayName._id !== user._id) {
        throw new Error("Display name already taken");
      }
    }

    // Update user
    const updates: any = {
      lastActiveAt: Date.now(),
      lastProfileUpdateAt: Date.now(),
    };
    
    if (args.displayName) updates.displayName = args.displayName;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.avatarName !== undefined) updates.avatarName = args.avatarName;
    if (args.avatarType !== undefined) updates.avatarType = args.avatarType;
    if (args.usePhoto !== undefined) updates.usePhoto = args.usePhoto;
    // Handle userPhoto - if provided, set it; if not provided, don't update (keeps existing or undefined)
    if (args.userPhoto !== undefined) {
      updates.userPhoto = args.userPhoto;
    }

    await ctx.db.patch(user._id, updates);

    return { success: true, user: await ctx.db.get(user._id) };
  },
});

/**
 * Delete user photo
 * Removes the userPhoto field completely from the database
 */
export const deletePhoto = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token
    const tokenData = await verifyToken(args.token, ctx);
    if (!tokenData) {
      throw new Error("Invalid or expired token");
    }

    // Get user
    const userDoc = await ctx.db.get(tokenData.userId as any);
    if (!userDoc) {
      throw new Error("User not found");
    }

    const user = userDoc as any;

    // Delete photo by setting to undefined
    await ctx.db.patch(user._id, {
      userPhoto: undefined,
      usePhoto: false,
      lastActiveAt: Date.now(),
      lastProfileUpdateAt: Date.now(),
    });

    return { success: true, user: await ctx.db.get(user._id) };
  },
});

/**
 * Change password (Secure JWT token version)
 * Uses JWT token from HTTP-only cookie for authentication
 * NEVER trust userId from frontend - always extract from verified token
 */
export const changePassword = mutation({
  args: {
    token: v.string(), // JWT token from HTTP-only cookie
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🔐 changePassword mutation called');
    
    // 1. Verify the JWT Token (This throws an error if invalid)
    const tokenData = await verifyToken(args.token, ctx);
    if (!tokenData || !tokenData.userId) {
      console.error('❌ Token verification failed');
      throw new Error("Invalid or expired authentication token");
    }

    console.log('✅ Token verified, userId:', tokenData.userId);

    // 2. Get the User using the ID from the VERIFIED TOKEN (not from args)
    const user = await ctx.db.get(tokenData.userId as Id<"userProfiles">);
    if (!user) {
      console.error('❌ User not found:', tokenData.userId);
      throw new Error("User not found");
    }

    console.log('✅ User found:', user.displayName);

    if (!user.passwordHash) {
      console.error('❌ No password hash - OAuth account');
      throw new Error("Account uses OAuth authentication");
    }

    // 3. Verify Current Password
    console.log('🔍 Verifying current password...');
    const passwordValid = verifyPassword(args.currentPassword, user.passwordHash);
    if (!passwordValid) {
      console.error('❌ Current password incorrect');
      throw new Error("Current password is incorrect");
    }

    console.log('✅ Current password verified');

    // 4. Validate new password strength
    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
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

    console.log('✅ New password validation passed');

    // 5. Hash new password with bcrypt
    const newPasswordHash = hashPassword(args.newPassword);

    // 6. Update password and invalidate existing tokens by incrementing tokenVersion
    await ctx.db.patch(user._id, {
      passwordHash: newPasswordHash,
      tokenVersion: (user.tokenVersion || 0) + 1, // Invalidate all existing tokens
      lastActiveAt: Date.now(),
    });

    console.log('✅ Password updated successfully, tokens invalidated');
    return { success: true };
  },
});

/**
 * Change password (Legacy Convex auth version - kept for backward compatibility)
 */
export const changePasswordLegacy = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not available");
    }

    // Find user by email
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.passwordHash) {
      throw new Error("Account uses OAuth authentication");
    }

    // Verify current password
    const passwordValid = verifyPassword(args.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password strength
    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
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

    // Hash new password with bcrypt
    const newPasswordHash = hashPassword(args.newPassword);

    // Update password
    await ctx.db.patch(user._id, {
      passwordHash: newPasswordHash,
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Helper to get authenticated user profile (throws if not found)
 */
export async function requireAuth(ctx: any): Promise<any> {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Find user
  let user = null;
  if (identity.email) {
    user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
      .first();
  }

  if (!user && identity.provider && identity.subject) {
    user = await ctx.db
      .query("userProfiles")
      .withIndex("by_oauth", (q: any) => 
        q.eq("oauthProvider", identity.provider as string).eq("oauthId", identity.subject as string)
      )
      .first();
  }

  if (!user) {
    throw new Error("User profile not found. Please refresh the page.");
  }

  if (user.isBanned) {
    throw new Error(`Account banned: ${user.banReason || 'No reason provided'}`);
  }

  // Update last active
  await ctx.db.patch(user._id, {
    lastActiveAt: Date.now(),
  });

  return user;
}

/**
 * Helper to require admin authentication
 */
export async function requireAdmin(ctx: any): Promise<any> {
  const user = await requireAuth(ctx);
  
  if (!user.isAdmin) {
    throw new Error("Admin access required");
  }
  
  return user;
}

/**
 * Logout - sets user presence to offline and revokes token
 */
export const logout = mutation({
  args: {
    userId: v.id("userProfiles"),
    sessionId: v.optional(v.string()),
    jti: v.optional(v.string()), // Token ID to revoke
    refreshTokenJti: v.optional(v.string()), // Refresh token ID to revoke
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Revoke access token if provided
    if (args.jti) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        await ctx.db.insert("revokedTokens", {
          jti: args.jti,
          userId: args.userId,
          revokedAt: Date.now(),
          expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        });
      }
    }
    
    // Revoke refresh token if provided
    if (args.refreshTokenJti) {
      const refreshToken = await ctx.db
        .query("refreshTokens")
        .withIndex("by_jti", (q: any) => q.eq("jti", args.refreshTokenJti))
        .first();
      
      if (refreshToken) {
        await ctx.db.patch(refreshToken._id, {
          isRevoked: true,
        });
      }
    }
    
    // Revoke all refresh tokens for this device
    if (args.deviceId) {
      const deviceTokens = await ctx.db
        .query("refreshTokens")
        .withIndex("by_user_device", (q: any) => 
          q.eq("userId", args.userId).eq("deviceId", args.deviceId)
        )
        .collect();
      
      for (const token of deviceTokens) {
        await ctx.db.patch(token._id, {
          isRevoked: true,
        });
      }
    }

    // Update presence to offline (use provided sessionId or delete all for this user)
    if (args.sessionId) {
      const presence = await ctx.db
        .query("userPresence")
        .withIndex("by_user_session", (q: any) => 
          q.eq("userId", args.userId).eq("sessionId", args.sessionId)
        )
        .first();
      
      if (presence) {
        await ctx.db.patch(presence._id, {
          status: "offline" as const,
          currentRoomId: undefined,
          isTyping: false,
          lastSeen: Date.now(),
        });
      }
    } else {
      // Delete all presence records for this user
      const presences = await ctx.db
        .query("userPresence")
        .withIndex("by_user_session", (q: any) => 
          q.eq("userId", args.userId)
        )
        .collect();
      
      for (const presence of presences) {
        await ctx.db.delete(presence._id);
      }
    }

    return { success: true };
  },
});

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = mutation({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Verify refresh token
      const tokenData = await verifyToken(args.refreshToken);
      
      if (!tokenData) {
        return {
          success: false,
          error: 'Invalid refresh token',
          accessToken: null,
        };
      }
      
      // Check token type
      const payload = JSON.parse(atob(args.refreshToken.split('.')[1]));
      if (payload.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid token type',
          accessToken: null,
        };
      }
      
      // Hash the refresh token to look it up
      const tokenHash = await hashRefreshToken(args.refreshToken);
      
      // Find refresh token in database
      const storedToken = await ctx.db
        .query("refreshTokens")
        .withIndex("by_jti", (q: any) => q.eq("jti", tokenData.jti))
        .first();
      
      if (!storedToken) {
        return {
          success: false,
          error: 'Refresh token not found',
          accessToken: null,
        };
      }
      
      // Check if token is revoked
      if (storedToken.isRevoked) {
        return {
          success: false,
          error: 'Refresh token has been revoked',
          accessToken: null,
        };
      }
      
      // Check if token is expired
      if (storedToken.expiresAt < Date.now()) {
        return {
          success: false,
          error: 'Refresh token expired',
          accessToken: null,
        };
      }
      
      // Verify token hash matches
      if (storedToken.tokenHash !== tokenHash) {
        return {
          success: false,
          error: 'Token verification failed',
          accessToken: null,
        };
      }
      
      // Get user
      const user = await ctx.db.get(storedToken.userId);
      
      if (!user || !user.isActive || user.isBanned) {
        return {
          success: false,
          error: 'User account is not active',
          accessToken: null,
        };
      }
      
      // Generate new access token first (before any writes)
      const newAccessToken = await generateToken(user._id.toString(), user.tokenVersion || 0);
      
      // Update last used timestamp (non-critical, allow to fail silently)
      // Skip if updated within last 5 minutes to reduce write conflicts
      const timeSinceLastUsed = Date.now() - (storedToken.lastUsedAt || 0);
      if (timeSinceLastUsed > 300000) { // 5 minutes
        try {
          await ctx.db.patch(storedToken._id, {
            lastUsedAt: Date.now(),
          });
        } catch (e) {
          // Ignore write conflicts - lastUsedAt is just metadata
        }
      }
      
      console.log('✅ Access token refreshed');
      
      return {
        success: true,
        accessToken: newAccessToken,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Token refresh failed',
        accessToken: null,
      };
    }
  },
});
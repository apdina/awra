/**
 * Avatar System
 * 
 * 9 basic avatars: 3 genders × 3 age groups
 * 10 special avatars: sp1 to sp10
 * 
 * Images stored locally in /public/avatars/
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Available avatars
export const AVAILABLE_AVATARS = {
  basic: [
    'young_mas', 'young_fem', 'young_between',
    'middle_mas', 'middle_fem', 'middle_between', 
    'old_mas', 'old_fem', 'old_between'
  ] as const,
  
  special: [
    'sp1', 'sp2', 'sp3', 'sp4', 'sp5',
    'sp6', 'sp7', 'sp8', 'sp9', 'sp10'
  ] as const
};

// Avatar metadata for display
export const AVATAR_METADATA: Record<string, { label: string; description: string }> = {
  // Basic avatars
  'young_mas': { label: 'Young Male', description: 'Young male avatar' },
  'young_fem': { label: 'Young Female', description: 'Young female avatar' },
  'young_between': { label: 'Young Neutral', description: 'Young gender-neutral avatar' },
  'middle_mas': { label: 'Middle-Aged Male', description: 'Middle-aged male avatar' },
  'middle_fem': { label: 'Middle-Aged Female', description: 'Middle-aged female avatar' },
  'middle_between': { label: 'Middle-Aged Neutral', description: 'Middle-aged gender-neutral avatar' },
  'old_mas': { label: 'Elder Male', description: 'Elder male avatar' },
  'old_fem': { label: 'Elder Female', description: 'Elder female avatar' },
  'old_between': { label: 'Elder Neutral', description: 'Elder gender-neutral avatar' },
  
  // Special avatars
  'sp1': { label: 'Special 1', description: 'Special avatar 1' },
  'sp2': { label: 'Special 2', description: 'Special avatar 2' },
  'sp3': { label: 'Special 3', description: 'Special avatar 3' },
  'sp4': { label: 'Special 4', description: 'Special avatar 4' },
  'sp5': { label: 'Special 5', description: 'Special avatar 5' },
  'sp6': { label: 'Special 6', description: 'Special avatar 6' },
  'sp7': { label: 'Special 7', description: 'Special avatar 7' },
  'sp8': { label: 'Special 8', description: 'Special avatar 8' },
  'sp9': { label: 'Special 9', description: 'Special avatar 9' },
  'sp10': { label: 'Special 10', description: 'Special avatar 10' },
};

// Helper to get image path for an avatar
export function getAvatarImagePath(avatarName: string, avatarType: 'basic' | 'special'): string {
  return `/avatars/${avatarType}/${avatarName}.png`;
}

// Helper to validate avatar selection
export function isValidAvatar(avatarName: string, avatarType: 'basic' | 'special'): boolean {
  const avatars = AVAILABLE_AVATARS[avatarType];
  return (avatars as readonly string[]).includes(avatarName);
}

/**
 * Get all available avatars with metadata
 */
export const getAvailableAvatars = query({
  handler: async (ctx) => {
    const result = {
      basic: AVAILABLE_AVATARS.basic.map(name => ({
        name,
        type: 'basic' as const,
        label: AVATAR_METADATA[name]?.label || name,
        description: AVATAR_METADATA[name]?.description || '',
        imagePath: getAvatarImagePath(name, 'basic')
      })),
      special: AVAILABLE_AVATARS.special.map(name => ({
        name,
        type: 'special' as const,
        label: AVATAR_METADATA[name]?.label || name,
        description: AVATAR_METADATA[name]?.description || '',
        imagePath: getAvatarImagePath(name, 'special')
      }))
    };
    
    return result;
  },
});

/**
 * Get user's current avatar
 */
export const getUserAvatar = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    
    return {
      avatarName: user.avatarName,
      avatarType: user.avatarType,
      avatarUrl: user.avatarUrl,
      // Calculate image path if not already set
      imagePath: user.avatarName && user.avatarType 
        ? getAvatarImagePath(user.avatarName, user.avatarType)
        : null
    };
  },
});

/**
 * Update user's avatar
 */
export const updateUserAvatar = mutation({
  args: {
    avatarName: v.string(),
    avatarType: v.union(v.literal("basic"), v.literal("special")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    // Validate avatar selection
    if (!isValidAvatar(args.avatarName, args.avatarType)) {
      throw new Error(`Invalid avatar selection: ${args.avatarType}/${args.avatarName}`);
    }
    
    // Calculate image path
    const imagePath = getAvatarImagePath(args.avatarName, args.avatarType);
    
    // Update user profile in Convex
    await ctx.db.patch(user._id, {
      avatarName: args.avatarName,
      avatarType: args.avatarType,
      avatarUrl: imagePath, // Store full path for backward compatibility
      lastProfileUpdateAt: Date.now(),
    });
    
    return {
      success: true,
      avatarName: args.avatarName,
      avatarType: args.avatarType,
      imagePath,
    };
  },
});

/**
 * Set default avatar for new users
 */
export function getDefaultAvatar(): { avatarName: string; avatarType: 'basic'; imagePath: string } {
  const defaultAvatar = 'young_between';
  return {
    avatarName: defaultAvatar,
    avatarType: 'basic',
    imagePath: getAvatarImagePath(defaultAvatar, 'basic')
  };
}

/**
 * Check if user has an avatar set
 */
export function hasAvatar(user: any): boolean {
  return !!(user.avatarName && user.avatarType);
}
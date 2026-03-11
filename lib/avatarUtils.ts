/**
 * Avatar utility functions for frontend
 */

export interface UserAvatar {
  avatarUrl?: string;
  avatarName?: string;
  avatarType?: 'basic' | 'special';
}

/**
 * Get the display avatar URL for a user
 * Priority: local avatar > external URL > undefined
 */
export function getUserAvatarUrl(user: UserAvatar | null | undefined): string | undefined {
  if (!user) return undefined;
  
  // Priority 1: Local avatar system
  if (user.avatarName && user.avatarType) {
    return `/avatars/${user.avatarType}/${user.avatarName}.png`;
  }
  
  // Priority 2: External URL (OAuth)
  if (user.avatarUrl) {
    return user.avatarUrl;
  }
  
  return undefined;
}

/**
 * Get initials from display name for avatar fallback
 */
export function getInitials(displayName: string): string {
  if (!displayName) return '?';
  
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

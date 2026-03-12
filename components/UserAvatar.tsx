"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getUserAvatarUrl, getInitials } from "@/lib/avatarUtils";

interface UserAvatarProps {
  user: {
    displayName: string;
    avatarUrl?: string;
    avatarName?: string;
    avatarType?: 'basic' | 'special' | 'photo';
    usePhoto?: boolean;
    userPhoto?: string;
  } | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const avatarUrl = getUserAvatarUrl(user);
  const initials = user ? getInitials(user.displayName) : '?';
  const sizeClass = sizeClasses[size];

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage 
        src={avatarUrl} 
        alt={user?.displayName || 'User'} 
      />
      <AvatarFallback className={`${sizeClass} bg-blue-100 text-blue-600 flex items-center justify-center rounded-full`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

"use client";

import { useAuth } from "@/components/ConvexAuthProvider";
import { Navigation } from "@/app/components/ui/Navigation";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { User as GameUser } from "@/types/game";
import { useMemo, useCallback } from 'react';

export default function NavigationWrapper() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { addNotification } = useNotification();
  const { t } = useTranslationsFromPath();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const locale = params.locale as string;

  // Memoize gameUser conversion to prevent unnecessary re-renders
  const gameUser: GameUser | undefined = useMemo(() => {
    if (!user) return undefined;
    
    return {
      id: String(user._id),
      username: user.displayName || 'User',
      email: user.email || '',
      awra_coins: user.coinBalance || 0,
      is_verified: true,
      is_active: user.isActive !== false,
      role: user.isAdmin ? 'ADMIN' : 'USER',
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      updated_at: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : new Date().toISOString(),
      avatarUrl: user.avatarUrl,
      avatarName: user.avatarName,
      avatarType: user.avatarType,
    };
  }, [user]);

  // Memoize session object
  const session = useMemo(() => {
    if (!user || !gameUser) return null;
    return {
      user: gameUser,
      token: 'convex-session',
    };
  }, [user, gameUser]);

  // Memoize callbacks
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleNavigateHome = useCallback(() => {
    router.push(`/${locale}/`);
  }, [router, locale]);

  return (
    <div data-auth-state={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
      <Navigation
        isAuthenticated={isAuthenticated}
        user={gameUser}
        session={session}
        loading={isLoading}
        onLogout={handleLogout}
        onNavigateHome={handleNavigateHome}
      />
    </div>
  );
}

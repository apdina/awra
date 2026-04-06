"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { logger } from '@/lib/logger';

interface User {
  _id: Id<"userProfiles">;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  avatarName?: string;
  avatarType?: 'basic' | 'special' | 'photo';
  usePhoto?: boolean;
  userPhoto?: string;
  coinBalance: number;
  isAdmin: boolean;
  isModerator?: boolean;
  isActive: boolean;
  isBanned: boolean;
  totalWinnings: number;
  totalSpent: number;
  createdAt: number;
  lastActiveAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatarUrl?: string; avatarName?: string; avatarType?: 'basic' | 'special' | 'photo'; usePhoto?: boolean; userPhoto?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Mutations for auth operations
  const loginMutation = useMutation(api.native_auth.loginWithEmail);
  const registerMutation = useMutation(api.native_auth.registerWithEmail);
  const updateProfileMutation = useMutation(api.native_auth.updateProfile);

  // Fetch user from HTTP-only cookie ONLY on mount - no periodic polling
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          const convexUser: User = {
            _id: userData.id as Id<"userProfiles">,
            email: userData.email,
            displayName: userData.username,
            avatarUrl: userData.avatar_url,
            avatarName: userData.avatar_name,
            avatarType: userData.avatar_type,
            usePhoto: userData.use_photo,
            userPhoto: userData.user_photo,
            coinBalance: userData.awra_coins || 0,
            isAdmin: userData.role === 'ADMIN',
            isModerator: userData.role === 'MODERATOR',
            isActive: userData.is_active,
            isBanned: userData.is_banned || false,
            totalWinnings: userData.total_winnings || 0,
            totalSpent: userData.total_spent || 0,
            createdAt: new Date(userData.created_at).getTime(),
            lastActiveAt: new Date(userData.updated_at).getTime(),
          };
          setUser(convexUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    // No periodic polling - only fetch on mount
  }, []);


  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      logger.log('🔐 Attempting login via API');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      
      logger.log('📡 Login response status:', response.status);
      
      const result = await response.json();
      
      if (response.ok && result.user) {
        // Convert API user format to Convex user format
        const convexUser: User = {
          _id: result.user.id,
          email: result.user.email,
          displayName: result.user.username,
          avatarUrl: result.user.avatar_url,
          avatarName: result.user.avatar_name,
          avatarType: result.user.avatar_type,
          usePhoto: result.user.use_photo,
          userPhoto: result.user.user_photo,
          coinBalance: result.user.awra_coins || 0,
          isAdmin: result.user.role === 'ADMIN',
          isModerator: result.user.role === 'MODERATOR',
          isActive: result.user.is_active,
          isBanned: result.user.is_banned || false,
          totalWinnings: result.user.total_winnings || 0,
          totalSpent: result.user.total_spent || 0,
          createdAt: new Date(result.user.created_at).getTime(),
          lastActiveAt: new Date(result.user.updated_at).getTime(),
        };
        setUser(convexUser);
        logger.log('✅ Login successful, user state updated:', convexUser.displayName);
        logger.log('✅ Login successful, session stored in HTTP-only cookie');
        
        // Refresh user data immediately to ensure latest avatar/profile
        await refreshUser();
        
        return { success: true };
      } else {
        const errorMessage = result.error || 'Invalid email or password';
        logger.log('❌ Login failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      logger.error('Login error:', error);
      const errorMessage = error.message || error.toString() || 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      logger.log('📝 Attempting registration via API');
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedDisplayName = displayName.trim();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password, username: normalizedDisplayName }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Auto-login after successful registration
        const loginResult = await login(normalizedEmail, password);
        if (loginResult.success) {
          logger.log('✅ Registration successful, auto-logged in');
          // Refresh after auto-login
          await refreshUser();
          return { success: true };
        }
        return { success: true, error: 'Registration successful. Please log in manually.' };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error: any) {
      logger.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      logger.log('🚪 Logging out via API');
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      logger.log('🚪 Logged out, HTTP-only cookies cleared');
    } catch (error) {
      logger.error('Logout error:', error);
      // Clear user state even if API call fails
      setUser(null);
    }
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string; avatarName?: string; avatarType?: 'basic' | 'special' | 'photo'; usePhoto?: boolean; userPhoto?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Profile update failed' };
      }
    } catch (error: any) {
      logger.error('Profile update error:', error);
      return { success: false, error: error.message || 'Profile update failed' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call the Next.js API route instead of Convex directly
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include', // Include HTTP-only cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Password change failed' };
      }
      
      return { success: true };
    } catch (error: any) {
      logger.error('Password change error:', error);
      return { success: false, error: error.message || 'Password change failed' };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      logger.log('🔄 Refreshing user data...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      logger.log('📡 Refresh user response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        logger.log('✅ User data refreshed:', userData.email);
        const convexUser: User = {
          _id: userData.id as Id<"userProfiles">,
          email: userData.email,
          displayName: userData.username,
          avatarUrl: userData.avatar_url,
          avatarName: userData.avatar_name,
          avatarType: userData.avatar_type,
          usePhoto: userData.use_photo,
          userPhoto: userData.user_photo,
          coinBalance: userData.awra_coins || 0,
          isAdmin: userData.role === 'ADMIN',
          isModerator: userData.role === 'MODERATOR',
          isActive: userData.is_active,
          isBanned: userData.is_banned || false,
          totalWinnings: userData.total_winnings || 0,
          totalSpent: userData.total_spent || 0,
          createdAt: new Date(userData.created_at).getTime(),
          lastActiveAt: new Date(userData.updated_at).getTime(),
        };
        setUser(convexUser);
        logger.log('✅ User data refreshed successfully');
      } else {
        logger.warn('⚠️ Failed to refresh user data, status:', response.status);
      }
    } catch (error) {
      logger.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    accessToken,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

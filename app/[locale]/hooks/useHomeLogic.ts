/**
 * Unified Home Logic Hook - ENHANCED
 * 
 * Shared business logic for unified home component
 * Handles ALL duplicated logic from mobile/desktop versions
 */

import { useState, useEffect, useCallback } from 'react';
import { Draw } from '@/types/game';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useCurrentDrawShared } from '@/hooks/useCurrentDrawShared';

export interface UseHomeLogicReturn {
  t: any;
  user: any;
  isAuthenticated: boolean;
  currentDraw: Draw | null;
  timeUntilDraw: string;
  countdown: { hours: number; minutes: number; seconds: number };
  chatStats: any;
  recentMessages: any;
  drawHistory: any;
  isMounted: boolean;
}

export function useHomeLogic(initialDraw: Draw): UseHomeLogicReturn {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslationsFromPath();
  const { draw: fetchedDraw } = useCurrentDrawShared(300000); // Refresh every 5 minutes
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(initialDraw);
  const [timeUntilDraw, setTimeUntilDraw] = useState<string>('');
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  // Update currentDraw with fetched data
  useEffect(() => {
    if (fetchedDraw) {
      setCurrentDraw(fetchedDraw);
    }
  }, [fetchedDraw]);

  // Get real-time data from Convex
  const chatStats = useQuery(api.chat.getChatStats, {}) ?? {
    onlineUsers: 0,
    ticketsSold: 0,
    totalMessages: 0,
  };
  const recentMessages = useQuery(api.chat.getMessages, { roomId: 'global', limit: 6 });
  const drawHistory = useQuery(api.draws.getDrawHistory, { limit: 5 });

  // Calculate next draw time (UTC consistent)
  const getNextDrawTime = useCallback((drawDate?: string, drawTime?: string) => {
    if (!drawDate || !drawTime) {
      const now = new Date();
      let nextDraw = new Date();
      nextDraw.setUTCHours(21, 40, 0, 0);
      if (nextDraw <= now) {
        nextDraw.setUTCDate(nextDraw.getUTCDate() + 1);
      }
      if (nextDraw.getUTCDay() === 0) {
        nextDraw.setUTCDate(nextDraw.getUTCDate() + 1);
      }
      return nextDraw;
    }
    const [day, month, year] = drawDate.split('/').map(Number);
    const [hours, minutes] = drawTime.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  }, []);

  // Countdown effect
  useEffect(() => {
    setIsMounted(true);
    const calculateCountdown = () => {
      const drawDate = getNextDrawTime(currentDraw?.draw_date, currentDraw?.draw_time);
      const now = new Date();
      const difference = drawDate.getTime() - now.getTime();
      if (difference > 0) {
        const hrs = Math.floor(difference / (1000 * 60 * 60));
        const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ hours: hrs, minutes: mins, seconds: secs });
        setTimeUntilDraw(`${hrs}h ${mins}m ${secs}s`);
      } else {
        setTimeUntilDraw('Draw in progress');
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
      }
    };
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentDraw, getNextDrawTime]);

  return {
    t,
    user,
    isAuthenticated,
    currentDraw,
    timeUntilDraw,
    countdown,
    chatStats,
    recentMessages,
    drawHistory,
    isMounted,
  };
}


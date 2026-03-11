/**
 * Unified Home Logic Hook
 * 
 * Shared business logic for both mobile and desktop home components
 * Handles:
 * - Countdown timer calculation
 * - Draw data management
 * - Chat stats
 * - Draw history
 */

import { useState, useEffect, useCallback } from 'react';
import { Draw } from '@/types/game';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export interface UseHomeLogicReturn {
  currentDraw: Draw | null;
  timeUntilDraw: string;
  countdown: { hours: number; minutes: number; seconds: number };
  chatStats: any;
  recentMessages: any;
  drawHistory: any;
  isMounted: boolean;
}

export function useHomeLogic(initialDraw: Draw): UseHomeLogicReturn {
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(initialDraw);
  const [timeUntilDraw, setTimeUntilDraw] = useState<string>('');
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  // Get real-time data from Convex
  const chatStats = useQuery(api.chat.getChatStats, {}) ?? {
    onlineUsers: 0,
    ticketsSold: 0,
    totalMessages: 0,
  };
  const recentMessages = useQuery(api.chat.getMessages, { roomId: 'global', limit: 6 });
  const drawHistory = useQuery(api.draws.getDrawHistory, { limit: 5 });

  // Calculate next draw time from API data
  const getNextDrawTime = useCallback((drawDate?: string, drawTime?: string) => {
    if (!drawDate || !drawTime) {
      // Fallback: calculate next valid date (UTC)
      const now = new Date();
      let nextDraw = new Date();
      nextDraw.setUTCHours(21, 40, 0, 0);

      if (nextDraw <= now) {
        nextDraw.setUTCDate(nextDraw.getUTCDate() + 1);
      }

      // Skip Sundays (UTC)
      if (nextDraw.getUTCDay() === 0) {
        nextDraw.setUTCDate(nextDraw.getUTCDate() + 1);
      }

      return nextDraw;
    }

    // Parse the draw date and time from API (DD/MM/YYYY and HH:MM in UTC)
    const [day, month, year] = drawDate.split('/').map(Number);
    const [hours, minutes] = drawTime.split(':').map(Number);

    // Create date object from API data (UTC)
    const drawDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

    return drawDateTime;
  }, []);

  // Countdown timer effect
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

    // Calculate immediately
    calculateCountdown();

    // Update every second
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentDraw, getNextDrawTime]);

  return {
    currentDraw,
    timeUntilDraw,
    countdown,
    chatStats,
    recentMessages,
    drawHistory,
    isMounted,
  };
}

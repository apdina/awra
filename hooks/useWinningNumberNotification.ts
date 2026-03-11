/**
 * Real-time notification hook for winning number announcements
 * Uses Convex subscriptions to push updates instead of polling
 * 
 * This eliminates the need for users to refresh constantly
 */

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { updateCurrentDrawCache } from '@/lib/currentDrawCache';

export function useWinningNumberNotification() {
  const [notification, setNotification] = useState<{
    show: boolean;
    winningNumber: number | null;
    drawDate: string;
  }>({
    show: false,
    winningNumber: null,
    drawDate: '',
  });

  // Subscribe to current draw changes in real-time
  const currentDraw = useQuery(api.draws.getCurrentDraw);

  useEffect(() => {
    if (!currentDraw) return;

    // If winning number is announced, show notification
    if (currentDraw.winningNumber && !notification.show) {
      console.log('🎉 Winning number announced:', currentDraw.winningNumber);
      
      // Update cache optimistically
      updateCurrentDrawCache({
        winning_number: currentDraw.winningNumber,
        is_processed: true,
      });

      // Show notification
      setNotification({
        show: true,
        winningNumber: currentDraw.winningNumber,
        drawDate: currentDraw.drawId,
      });

      // Play notification sound (optional)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Winning Number Announced!', {
            body: `The winning number is ${currentDraw.winningNumber}`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
          });
        }
      }
    }
  }, [currentDraw, notification.show]);

  const dismissNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return {
    notification,
    dismissNotification,
  };
}

/**
 * Request notification permission on mount
 */
export function useNotificationPermission() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);
}

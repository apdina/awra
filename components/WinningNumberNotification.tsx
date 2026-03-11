/**
 * Real-time notification banner for winning number announcements
 * Shows when winning number is announced via Convex subscription
 */

'use client';

import { useWinningNumberNotification } from '@/hooks/useWinningNumberNotification';
import { Trophy, X } from 'lucide-react';
import { useTranslationsFromPath } from '@/i18n/translation-context';

export function WinningNumberNotification() {
  const { notification, dismissNotification } = useWinningNumberNotification();
  const { t } = useTranslationsFromPath();

  if (!notification.show || !notification.winningNumber) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-md">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg">
            {t('notifications.winning_number_announced') || 'Winning Number Announced!'}
          </h3>
          <p className="text-sm opacity-90">
            {t('notifications.number_is') || 'The winning number is'}{' '}
            <span className="font-bold text-xl">{notification.winningNumber}</span>
          </p>
          <p className="text-xs opacity-75 mt-1">
            {notification.drawDate}
          </p>
        </div>

        <button
          onClick={dismissNotification}
          className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

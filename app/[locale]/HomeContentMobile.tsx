'use client';

import { useEffect, useState } from 'react';
import { Draw } from '@/types/game';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useHomeLogic } from './hooks/useHomeLogic';

interface HomeContentMobileProps {
  locale: string;
  initialDraw: Draw;
}

export default function HomeContentMobile({ locale, initialDraw }: HomeContentMobileProps) {
  const { user } = useAuth();
  const { t } = useTranslationsFromPath();
  const { currentDraw, timeUntilDraw, countdown, chatStats, recentMessages, isMounted } = useHomeLogic(initialDraw);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4 space-y-6">
      {/* Draw Countdown */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
        <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">Next Draw</h2>
        <div className="text-4xl font-mono text-center font-bold text-blue-400 mb-2">
          {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
        </div>
        <p className="text-lg text-center text-gray-300">Draw Date: {currentDraw?.draw_date || 'Loading...'}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-xl font-bold text-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all">
          Buy Tickets
        </button>
        <button className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-xl font-bold text-lg shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all">
          My Tickets
        </button>
      </div>

      {/* Chat Preview */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Live Chat</h3>
          <span className="text-sm text-green-400">{chatStats.online} online</span>
        </div>
{recentMessages.slice(0, 3).map((msg: any, i: number) => (
          <div key={i} className="text-sm mb-1 truncate">
            <span className="font-semibold text-blue-400">{msg.user}:</span> {msg.text}
          </div>
        ))}
        {recentMessages.length > 3 && (
          <p className="text-xs text-gray-500 mt-2">...and {recentMessages.length - 3} more</p>
        )}
      </div>

      {/* Recent Draws */}
      <div className="space-y-2">
        <h3 className="font-bold text-lg">Recent Draws</h3>
        {currentDraw ? (
          <div className="text-sm text-gray-400">Last Draw: {currentDraw.draw_date}</div>
        ) : null}
      </div>
    </div>
  );
}


/**
 * Unified Play Content Component
 * 
 * Single component that works for both mobile and desktop
 * Uses responsive rendering to show appropriate UI
 * All business logic is shared via usePlayLogic hook
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { usePlayLogic } from './hooks/usePlayLogic';
import { PlayGrid } from './components/PlayGrid';
import { PlayForm } from './components/PlayForm';

export default function PlayContentUnified() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslationsFromPath();
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Get all logic from shared hook
  const {
    bets,
    totalBet,
    error,
    isSubmitting,
    isMounted,
    addBet,
    removeBet,
    clearBets,
    submitBets,
  } = usePlayLogic();

  // Detect mobile on mount
  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading state
  if (!isClient || !isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">{t('play.login_required')}</h2>
          <p className="text-gray-300 mb-8">{t('play.login_desc')}</p>
          <div className="space-y-3">
            <Link
              href={`/${locale}/login`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {t('auth.login.sign_in')}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {t('auth.register.create_account')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate UI based on device
  return (
    <div className={isMobile ? 'min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4' : ''}>
      <div className={isMobile ? 'max-w-md mx-auto' : 'max-w-6xl mx-auto'}>
        {isMobile && <h1 className="text-3xl font-bold text-white mb-8">{t('play.title')}</h1>}

        {isMobile ? (
          <PlayForm
            bets={bets}
            totalBet={totalBet}
            error={error}
            isSubmitting={isSubmitting}
            onAddBet={addBet}
            onRemoveBet={removeBet}
            onSubmit={submitBets}
            onClear={clearBets}
            t={t}
          />
        ) : (
          <PlayGrid
            bets={bets}
            totalBet={totalBet}
            error={error}
            isSubmitting={isSubmitting}
            onAddBet={addBet}
            onRemoveBet={removeBet}
            onSubmit={submitBets}
            onClear={clearBets}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

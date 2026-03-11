/**
 * Unified Home Content Component
 * 
 * Single component that works for both mobile and desktop
 * Uses responsive rendering to show appropriate UI
 * All business logic is shared via useHomeLogic hook
 */

'use client';

import { useEffect, useState } from 'react';
import { Draw } from '@/types/game';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useHomeLogic } from './hooks/useHomeLogic';
import HomeContentMobile from './HomeContentMobile';
import HomeContent from './HomeContent';

interface HomeContentUnifiedProps {
  locale: string;
  initialDraw: Draw;
}

export default function HomeContentUnified({ locale, initialDraw }: HomeContentUnifiedProps) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslationsFromPath();
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Get all logic from shared hook
  const { currentDraw, timeUntilDraw, countdown, chatStats, recentMessages, drawHistory, isMounted } =
    useHomeLogic(initialDraw);

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
  if (!isClient || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Render appropriate UI based on device
  return isMobile ? (
    <HomeContentMobile locale={locale} initialDraw={initialDraw} />
  ) : (
    <HomeContent locale={locale} initialDraw={initialDraw} />
  );
}

/**
 * Unified Tickets Content Component
 * 
 * Responsive component that uses shared logic and switches between
 * mobile and desktop UI based on screen size
 */

"use client";

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTicketsLogic } from './hooks/useTicketsLogic';
import { TicketsList } from './components/TicketsList';
import { TicketsTable } from './components/TicketsTable';
import PageWithSidebarAds from '@/components/layout/PageWithSidebarAds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket as TicketIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function TicketsContentUnified() {
  const { locale } = useTranslationsFromPath();
  const { t } = useTranslationsFromPath();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Use shared logic hook
  const {
    tickets,
    loading,
    error,
    calculateTotalWinnings,
    summaryStats,
  } = useTicketsLogic();

  const [displayLimit, setDisplayLimit] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit(prev => prev + 3);
      setLoadingMore(false);
    }, 300);
  };

  const hasMoreTickets = tickets.length > displayLimit;

  // Show loading state
  if (authLoading || loading) {
    return (
      <PageWithSidebarAds>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="space-y-6">
              <div className="h-12 w-64 mx-auto bg-gray-800 rounded animate-pulse" />
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                    <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
                    <div className="h-24 w-full bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageWithSidebarAds>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <PageWithSidebarAds>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-0 shadow-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <TicketIcon className="h-10 w-10 text-black" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">{t('tickets.access_denied')}</CardTitle>
              <CardDescription className="text-gray-400">
                {t('tickets.please_login')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-6 rounded-xl shadow-lg shadow-yellow-500/20 transition-all duration-300 hover:scale-[1.02]">
                <Link href={`/${locale}/login`}>{t('tickets.login')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageWithSidebarAds>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <PageWithSidebarAds>
        <TicketsList
          tickets={tickets}
          loading={loading}
          error={error}
          calculateTotalWinnings={calculateTotalWinnings}
          t={t}
          locale={locale}
        />
      </PageWithSidebarAds>
    );
  }

  // Desktop view
  return (
    <PageWithSidebarAds>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-yellow-300/10 rounded-full blur-xl animate-pulse animation-delay-500"></div>
        </div>

        <main className="relative container mx-auto px-4 py-6 z-10 max-w-5xl">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">{t('tickets.my_tickets')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-yellow-100 to-yellow-200 bg-clip-text text-transparent mb-2">
              {t('tickets.ticket_history')}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {tickets.length > 0 
                ? t('tickets.track_your_journey', { count: tickets.length })
                : t('tickets.start_your_journey')
              }
            </p>
          </div>

          {/* Tickets Table Component */}
          <TicketsTable
            tickets={tickets}
            loading={loading}
            error={error}
            displayLimit={displayLimit}
            hasMoreTickets={hasMoreTickets}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            calculateTotalWinnings={calculateTotalWinnings}
            summaryStats={summaryStats}
            t={t}
            locale={locale}
          />
        </main>
      </div>
    </PageWithSidebarAds>
  );
}

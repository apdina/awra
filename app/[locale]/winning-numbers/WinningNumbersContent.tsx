"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Draw, WinningNumberEntry } from "@/types/game";
import { useAuth } from "@/components/ConvexAuthProvider";
import OptimizedWinningNumbersSearch from "@/app/components/ui/OptimizedWinningNumbersSearch";
import WinningNumbersTable from "@/app/components/ui/WinningNumbersTable";
import { WinningNumberDisplay } from "@/components/WinningNumberDisplay";
import { type Locale } from "@/lib/numberNames";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";
import RefreshVideoAd from "@/components/RefreshVideoAd";

interface WinningNumbersContentProps {
  locale: string;
  initialCurrentDraw: Draw;
  initialWinningNumbers: Draw[];
}

export default function WinningNumbersContent({ 
  locale, 
  initialCurrentDraw, 
  initialWinningNumbers 
}: WinningNumbersContentProps) {
  const { t } = useTranslationsFromPath();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Video ad state
  const [videoAdCompleted, setVideoAdCompleted] = useState(true);
  
  // Helper function to get day of week from DD/MM/YYYY format (UTC)
  const getDayOfWeek = (dateString: string): string => {
    const [day, month, year] = dateString.split('/');
    // Use UTC to ensure consistent timezone regardless of user's local timezone
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    const dayIndex = date.getUTCDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return t(`days.${dayKeys[dayIndex]}`);
  };

  // State management
  const [currentDraw, setCurrentDraw] = useState<Draw>(initialCurrentDraw);
  const [winningNumbers, setWinningNumbers] = useState<WinningNumberEntry[]>(
    initialWinningNumbers.map(draw => ({
      day: getDayOfWeek(draw.draw_date),
      date: draw.draw_date,
      number: draw.winning_number || 0
    }))
  );
  const [filteredNumbers, setFilteredNumbers] = useState<WinningNumberEntry[]>(
    initialWinningNumbers.map(draw => ({
      day: getDayOfWeek(draw.draw_date),
      date: draw.draw_date,
      number: draw.winning_number || 0
    }))
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Handle video ad completion
  const handleVideoAdComplete = () => {
    setVideoAdCompleted(true);
  };

  // Fetch winning numbers from API with sophisticated caching
  const fetchWinningNumbers = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      // Use sophisticated cache with 48-hour duration
      const { fetchWinningNumbersWithCache } = await import('@/lib/winningNumbersCache');
      const response = await fetchWinningNumbersWithCache();
      
      // Extract data from cached response
      const result = response;
      
      // Update state with API data
      const entries: WinningNumberEntry[] = result.data.map((entry: any) => ({
        day: entry.day,
        date: entry.date,
        number: entry.number
      }));
      
      setWinningNumbers(entries);
      setFilteredNumbers(entries);
      setCurrentPage(result.pagination?.currentPage || 1);
      setTotalPages(result.pagination?.totalPages || 1);
      setHasMore(result.pagination?.hasNextPage || false);
      
      console.log('✅ Winning numbers fetched with sophisticated cache:', entries.length);
    } catch (error) {
      console.error('❌ Error fetching winning numbers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current draw with optimized caching
  const fetchCurrentDraw = useCallback(async () => {
    try {
      // Use optimized cache with request deduplication
      const { fetchCurrentDrawWithCache } = await import('@/lib/currentDrawCache');
      const draw = await fetchCurrentDrawWithCache();
      setCurrentDraw(draw);
      
      console.log('✅ Current draw fetched:', draw);
    } catch (error) {
      console.error('❌ Error fetching current draw:', error);
    }
  }, []);

  // Refresh all data with cache-aware refresh
  const handleRefresh = useCallback(() => {
    fetchCurrentDraw();
    // Use sophisticated cache refresh for winning numbers
    import('@/lib/winningNumbersCache').then(({ refreshWinningNumbersCache }) => {
      refreshWinningNumbersCache().then(() => {
        fetchWinningNumbers(currentPage);
      });
    });
  }, [fetchCurrentDraw, fetchWinningNumbers, currentPage]);

  // Load more (pagination)
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchWinningNumbers(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchWinningNumbers]);

  // Load previous page
  const handleLoadPrevious = useCallback(() => {
    if (!loading && currentPage > 1) {
      fetchWinningNumbers(currentPage - 1);
    }
  }, [loading, currentPage, fetchWinningNumbers]);

  // History pagination handlers
  const handleHistoryLoadMore = useCallback(() => {
    const maxPages = Math.ceil(winningNumbers.length / ITEMS_PER_PAGE);
    if (historyPage < maxPages) {
      setHistoryPage(historyPage + 1);
    }
  }, [historyPage, winningNumbers.length]);

  const handleHistoryLoadPrevious = useCallback(() => {
    if (historyPage > 1) {
      setHistoryPage(historyPage - 1);
    }
  }, [historyPage]);

  // Get paginated history numbers
  const getHistoryNumbers = useCallback(() => {
    const startIndex = (historyPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return winningNumbers.slice(startIndex, endIndex);
  }, [historyPage, winningNumbers]);

  const historyMaxPages = Math.ceil(winningNumbers.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* Refresh Video Ad - Shows on page refresh */}
      <RefreshVideoAd 
        onComplete={handleVideoAdComplete} 
      />
      
      {/* Main Content - Only show if video ad is completed or not triggered */}
      {videoAdCompleted && (
        <PageWithSidebarAds>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Refresh Button */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="gradient-text-yellow text-4xl font-bold">{t('winning_numbers.title')}</h1>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg 
                className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
          <p className="text-xl text-gray-300">{t('winning_numbers.subtitle')}</p>
        </div>

        {/* Current Draw Highlight - Yellow gradient */}
        <div className="gradient-bg-yellow backdrop-blur-sm rounded-2xl p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">{t('winning_numbers.todays_winning_number')}</h2>
          <div className="flex justify-center items-center mb-4">
            <WinningNumberDisplay 
              number={currentDraw.winning_number || (winningNumbers.length > 0 ? winningNumbers[0].number : null) || 142} 
              size="lg"
              locale={locale as Locale}
            />
          </div>
          <div className="text-gray-300 text-lg">
            {currentDraw.winning_number ? currentDraw.draw_date : (winningNumbers.length > 0 ? winningNumbers[0].date : currentDraw.draw_date)}
          </div>
        </div>

        {/* Play Now CTA */}
        <div className="text-center mb-8">
          <Link
            href={`/${locale}/play`}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-lg rounded-xl shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105 transition-all duration-200 group"
          >
            <svg 
              className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            {t('home.play_now')}
          </Link>
        </div>

        {/* Search Component - Blue gradient wrapper */}
        <div className="gradient-bg-blue backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-blue-400 mb-4 text-center">{t('search.title')}</h3>
          <OptimizedWinningNumbersSearch 
            winningNumbers={winningNumbers}
            onFilteredChange={setFilteredNumbers}
          />
        </div>

        {/* Results Table - Purple gradient wrapper */}
        <div className="gradient-bg-purple backdrop-blur-sm rounded-2xl p-6 mb-8">
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <p className="mt-2 text-gray-400">Loading...</p>
            </div>
          )}
          
          <WinningNumbersTable 
            winningNumbers={filteredNumbers.length !== winningNumbers.length ? filteredNumbers : getHistoryNumbers()}
            title={filteredNumbers.length !== winningNumbers.length ? t('winning_numbers.search_results') : t('winning_numbers.winning_numbers_history')}
          />
          
          {/* Pagination Controls */}
          {!loading && filteredNumbers.length === winningNumbers.length && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={handleHistoryLoadPrevious}
                disabled={historyPage === 1}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {t('winning_numbers.previous')}
              </button>
              
              <span className="text-gray-300">
                Page {historyPage} of {historyMaxPages}
              </span>
              
              <button
                onClick={handleHistoryLoadMore}
                disabled={historyPage === historyMaxPages}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {t('winning_numbers.next')}
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Draw Schedule - Green gradient */}
          <div className="gradient-bg-green backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <div className="icon-circle-green mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-green-400">{t('winning_numbers.draw_schedule')}</h4>
            </div>
            <ul className="text-gray-300 space-y-2">
              <li>• {t('winning_numbers.daily_draws')}</li>
              <li>• {t('winning_numbers.numbers_range')}</li>
              <li>• {t('winning_numbers.results_available')}</li>
              <li>• <span className="text-blue-400">{t('winning_numbers.sunday_no_draws')}</span></li>
              <li>• {t('winning_numbers.one_number_per_day')}</li>
            </ul>
          </div>

          {/* Official Results - Blue gradient */}
          <div className="gradient-bg-blue backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <div className="icon-circle-blue mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-blue-400">{t('winning_numbers.official_results')}</h4>
            </div>
            <ul className="text-gray-300 space-y-2">
              <li>• {t('winning_numbers.official_game_results')}</li>
              <li>• {t('winning_numbers.verified_trusted_sources')}</li>
              <li>• {t('winning_numbers.manual_entry_admin')}</li>
              <li>• {t('winning_numbers.one_number_play_day')}</li>
            </ul>
          </div>
        </div>

        {/* Number System Link - Yellow gradient */}
        <div className="mt-6 gradient-bg-yellow backdrop-blur-sm rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h4 className="text-lg font-bold text-yellow-400">{t('winning_numbers.number_meanings') || 'Discover Number Meanings'}</h4>
          </div>
          <p className="text-gray-300 mb-4">
            {t('winning_numbers.number_meanings_desc') || 'Each number has a unique name and symbolic meaning. Explore the complete AWRA number system.'}
          </p>
          <a 
            href={`/${locale}/numbers`}
            className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-6 py-3 rounded-lg transition-colors"
          >
            {t('winning_numbers.view_all_numbers') || 'View All 100 Numbers'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link
            href={`/${locale}/`}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black px-8 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 inline-block mr-4"
          >
            {t('winning_numbers.back_to_home')}
          </Link>
          <Link
            href={`/${locale}/how-to-play`}
            className="glass-card hover:bg-gray-700/70 text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 inline-block border border-gray-600/50"
          >
            {t('winning_numbers.how_to_play')}
          </Link>
        </div>
      </main>
      </div>
    </PageWithSidebarAds>
      )}
    </>
  );
}
"use client";

import Link from "next/link";
import { Play, Trophy, MessageSquare, HelpCircle, Coins, LogIn, BookOpen } from "lucide-react";
import SimpleCountdown from "@/components/SimpleCountdown";
import { useHomeLogic } from "./hooks/useHomeLogic";
import { Draw } from "@/types/game";

interface HomeContentProps {
  locale: string;
  initialDraw: Draw;
}

/**
 * UNIFIED RESPONSIVE Home Content Component
 * Works on both mobile and desktop using Tailwind responsive prefixes
 * All logic extracted to useHomeLogic hook
 * Eliminated HomeContentMobile.tsx duplication
 */

export default function HomeContent({ locale, initialDraw }: HomeContentProps) {
  const {
    t,
    user,
    isAuthenticated,
    isMounted,
  } = useHomeLogic(initialDraw);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Simple Countdown Timer Card */}
        <SimpleCountdown />
        
        {/* Row 1: Play Now & Check Winning Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/play`}
            className="group bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-center hover:shadow-lg md:hover:shadow-2xl md:hover:shadow-green-500/25 hover:scale-105 transition-all duration-300 md:motion-preset-slide-up md:motion-delay-100 overflow-hidden relative"
          >
            <Play className="w-8 h-8 text-white mx-auto mb-2 group-hover:rotate-12 md:group-hover:rotate-12 transition-transform duration-300" />
            <h3 className="text-white font-bold text-sm">{t('home.play_now')}</h3>
            <p className="text-green-100 text-xs mt-1">{t('home.buy_tickets')}</p>
          </Link>

          <Link
            href={`/${locale}/winning-numbers`}
            className="group bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-center hover:shadow-lg md:hover:shadow-2xl md:hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 md:motion-preset-slide-up md:motion-delay-200 overflow-hidden relative"
          >
            <Trophy className="w-8 h-8 text-white mx-auto mb-2 group-hover:rotate-12 md:group-hover:rotate-12 transition-transform duration-300" />
            <h3 className="text-white font-bold text-sm">{t('home.winning_numbers')}</h3>
            <p className="text-purple-100 text-xs mt-1">{t('home.check_results')}</p>
          </Link>
        </div>

        {/* Row 2: Chat & Numbers Meaning */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/chat`}
            className="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-center hover:shadow-lg md:hover:shadow-2xl md:hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 md:motion-preset-slide-up md:motion-delay-300 overflow-hidden relative"
          >
            <MessageSquare className="w-8 h-8 text-white mx-auto mb-2 group-hover:rotate-12 md:group-hover:rotate-12 transition-transform duration-300" />
            <h3 className="text-white font-bold text-sm">{t('home.chat')}</h3>
            <p className="text-blue-100 text-xs mt-1">{t('home.community')}</p>
          </Link>

          <Link
            href={`/${locale}/numbers`}
            className="group bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-6 text-center hover:shadow-lg md:hover:shadow-2xl md:hover:shadow-orange-500/25 hover:scale-105 transition-all duration-300 md:motion-preset-slide-up md:motion-delay-400 overflow-hidden relative"
          >
            <HelpCircle className="w-8 h-8 text-white mx-auto mb-2 group-hover:rotate-12 transition-transform duration-300" />
            <h3 className="text-white font-bold text-sm">{t('home.numbers')}</h3>
            <p className="text-orange-100 text-xs mt-1">{t('home.meaning')}</p>
          </Link>
        </div>

        {/* Row 3: Conditional Auth Links */}
        {!isAuthenticated ? (
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/${locale}/register`}
              className="group bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl p-6 text-center hover:shadow-lg md:hover:shadow-2xl md:hover:shadow-yellow-500/25 hover:scale-105 transition-all duration-300 md:motion-preset-slide-up md:motion-delay-500 overflow-hidden relative"
            >
              <Coins className="w-8 h-8 text-white mx-auto mb-2 group-hover:rotate-12 md:group-hover:rotate-12 transition-transform duration-300" />
              <h3 className="text-white font-bold text-sm">{t('home.get_coins')}</h3>
              <p className="text-yellow-100 text-xs mt-1">{t('home.register_free')}</p>
            </Link>

            <Link
              href={`/${locale}/register`}
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
            >
              <LogIn className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-white font-bold text-sm">{t('home.my_account')}</h3>
              <p className="text-indigo-100 text-xs mt-1">{t('home.create_account')}</p>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/${locale}/account`}
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
            >
              <BookOpen className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-white font-bold text-sm">{t('home.my_account')}</h3>
              <p className="text-indigo-100 text-xs mt-1">{t('home.profile')}</p>
            </Link>

            <Link
              href={`/${locale}/how-to-play`}
              className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all border border-slate-600"
            >
              <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-bold text-sm">{t('home.how_to_play')}</h3>
              <p className="text-slate-300 text-xs mt-1">{t('home.learn_rules')}</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


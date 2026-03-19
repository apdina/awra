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

interface IconProps {
  children: React.ReactNode;
  label: string;
  className?: string;
}

function EnhancedIcon({ children, label, className = "" }: IconProps) {
  return (
    <div 
      className={`relative p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg group-hover:shadow-2xl transition-all duration-300 will-change-transform ${className}`} 
      aria-label={label} 
      role="img" 
      aria-hidden="true"
    >
      <div className="relative z-10">
        <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mx-auto mb-2">
          {children}
        </div>
      </div>
      {/* Lighter glow for perf */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 via-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-70 transition-all duration-300 blur-sm -z-10" />
    </div>
  );
}

/**
 * UNIFIED RESPONSIVE Home Content Component - Optimized for mobile perf
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20 select-none">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 py-6 space-y-6">
        <SimpleCountdown />
        
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/play`}
            className="group bg-gradient-to-br from-green-500/90 to-green-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-green-400/50 transition-all duration-300 relative border border-green-400/20 hover:border-green-400/40 select-none will-change-transform"
          >
            <EnhancedIcon label="Play game">
              <Play className="w-full h-full text-green-400 mx-auto group-hover:animate-bounce transition-transform duration-300" />
            </EnhancedIcon>
            <h3 className="text-white font-bold text-sm mt-2">{t('home.play_now')}</h3>
            <p className="text-green-100 text-xs">{t('home.buy_tickets')}</p>
          </Link>

          <Link
            href={`/${locale}/winning-numbers`}
            className="group bg-gradient-to-br from-purple-500/90 to-purple-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-purple-400/50 transition-all duration-300 relative border border-purple-400/20 hover:border-purple-400/40 select-none will-change-transform"
          >
            <EnhancedIcon label="Winning numbers">
              <Trophy className="w-full h-full text-purple-400 mx-auto group-hover:scale-110 transition-transform duration-300" />
            </EnhancedIcon>
            <h3 className="text-white font-bold text-sm mt-2">{t('home.winning_numbers')}</h3>
            <p className="text-purple-100 text-xs">{t('home.check_results')}</p>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/chat`}
            className="group bg-gradient-to-br from-blue-500/90 to-blue-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-all duration-300 relative border border-blue-400/20 hover:border-blue-400/40 select-none will-change-transform"
          >
            <EnhancedIcon label="Chat room">
              <MessageSquare className="w-full h-full text-blue-400 mx-auto group-hover:animate-pulse transition-transform duration-300" />
            </EnhancedIcon>
            <h3 className="text-white font-bold text-sm mt-2">{t('home.chat')}</h3>
            <p className="text-blue-100 text-xs">{t('home.community')}</p>
          </Link>

          <Link
            href={`/${locale}/numbers`}
            className="group bg-gradient-to-br from-orange-500/90 to-orange-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-400/50 transition-all duration-300 relative border border-orange-400/20 hover:border-orange-400/40 select-none will-change-transform"
          >
            <EnhancedIcon label="Numbers meaning">
              <HelpCircle className="w-full h-full text-orange-400 mx-auto group-hover:rotate-6 transition-transform duration-300" />
            </EnhancedIcon>
            <h3 className="text-white font-bold text-sm mt-2">{t('home.numbers')}</h3>
            <p className="text-orange-100 text-xs">{t('home.meaning')}</p>
          </Link>
        </div>

        {!isAuthenticated ? (
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/${locale}/register`}
              className="group bg-gradient-to-br from-yellow-500/90 to-yellow-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-yellow-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all duration-300 relative border border-yellow-400/20 hover:border-yellow-400/40 select-none will-change-transform"
            >
              <EnhancedIcon label="Get free coins">
                <Coins className="w-full h-full text-yellow-400 mx-auto group-hover:animate-ping transition-transform duration-300" />
              </EnhancedIcon>
              <h3 className="text-white font-bold text-sm mt-2">{t('home.get_coins')}</h3>
              <p className="text-yellow-100 text-xs">{t('home.register_free')}</p>
            </Link>

            <Link
              href={`/${locale}/register`}
              className="group bg-gradient-to-br from-indigo-500/90 to-indigo-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-indigo-400/50 transition-all duration-300 relative border border-indigo-400/20 hover:border-indigo-400/40 select-none will-change-transform"
            >
              <EnhancedIcon label="Create account">
                <LogIn className="w-full h-full text-indigo-400 mx-auto group-hover:rotate-180 transition-transform duration-300" />
              </EnhancedIcon>
              <h3 className="text-white font-bold text-sm mt-2">{t('home.my_account')}</h3>
              <p className="text-indigo-100 text-xs">{t('home.create_account')}</p>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/${locale}/account`}
              className="group bg-gradient-to-br from-indigo-500/90 to-indigo-700/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-indigo-400/50 transition-all duration-300 relative border border-indigo-400/20 hover:border-indigo-400/40 select-none will-change-transform"
            >
              <EnhancedIcon label="My profile">
                <BookOpen className="w-full h-full text-indigo-400 mx-auto group-hover:animate-pulse transition-transform duration-300" />
              </EnhancedIcon>
              <h3 className="text-white font-bold text-sm mt-2">{t('home.my_account')}</h3>
              <p className="text-indigo-100 text-xs">{t('home.profile')}</p>
            </Link>

            <Link
              href={`/${locale}/how-to-play`}
              className="group bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:shadow-xl hover:shadow-slate-500/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-slate-400/50 transition-all duration-300 relative border border-slate-500/30 hover:border-slate-400/50 select-none will-change-transform"
            >
              <EnhancedIcon label="How to play">
                <BookOpen className="w-full h-full text-blue-400 mx-auto group-hover:animate-bounce transition-transform duration-300" />
              </EnhancedIcon>
              <h3 className="text-white font-bold text-sm mt-2">{t('home.how_to_play')}</h3>
              <p className="text-slate-300 text-xs">{t('home.learn_rules')}</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


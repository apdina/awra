"use client";

import { useEffect, useState } from "react";
import { Draw } from "@/types/game";
import { useAuth } from "@/components/ConvexAuthProvider";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useCurrentDrawShared } from '@/hooks/useCurrentDrawShared';
import Link from "next/link";
import { Play, Trophy, MessageSquare, HelpCircle, Coins, LogIn, BookOpen } from "lucide-react";
import SimpleCountdown from "@/components/SimpleCountdown";

interface HomeContentProps {
  locale: string;
  initialDraw: Draw;
}

export default function HomeContent({ locale, initialDraw }: HomeContentProps) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslationsFromPath();
  const { draw: currentDraw } = useCurrentDrawShared(300000); // Refresh every 5 minutes

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Simple Countdown Timer Card */}
        <SimpleCountdown />
        
        {/* Row 1: Play Now & Check Winning Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/play`}
            className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
          >
            <Play className="w-8 h-8 text-white mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">{t('home.play_now')}</h3>
            <p className="text-green-100 text-xs mt-1">{t('home.buy_tickets')}</p>
          </Link>

          <Link
            href={`/${locale}/winning-numbers`}
            className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
          >
            <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">{t('home.winning_numbers')}</h3>
            <p className="text-purple-100 text-xs mt-1">{t('home.check_results')}</p>
          </Link>
        </div>

        {/* Row 2: Chat & Numbers Meaning */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/chat`}
            className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
          >
            <MessageSquare className="w-8 h-8 text-white mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">{t('home.chat')}</h3>
            <p className="text-blue-100 text-xs mt-1">{t('home.community')}</p>
          </Link>

          <Link
            href={`/${locale}/numbers`}
            className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
          >
            <HelpCircle className="w-8 h-8 text-white mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">{t('home.numbers')}</h3>
            <p className="text-orange-100 text-xs mt-1">{t('home.meaning')}</p>
          </Link>
        </div>

        {/* Row 3: Get 100 Coins & My Account / Profile & How to Play */}
        {!isAuthenticated ? (
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/${locale}/register`}
              className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all"
            >
              <Coins className="w-8 h-8 text-white mx-auto mb-2" />
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

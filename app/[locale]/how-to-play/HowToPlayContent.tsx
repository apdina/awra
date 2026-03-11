"use client";

import Link from "next/link";
import { useAuth } from "@/components/ConvexAuthProvider";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";

export default function HowToPlayContent() {
  const { user, isAuthenticated } = useAuth();
  const { t, locale } = useTranslationsFromPath();
  
  return (
    <PageWithSidebarAds>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text mb-4">
            {t('how_to_play.title')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('how_to_play.subtitle')}
          </p>
        </div>

        {/* How to Play Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12">
          <h2 className="text-3xl font-bold text-yellow-500 mb-8 text-center">
            {t('how_to_play.how_to_play_title')}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('how_to_play.get_coins')}</h3>
              <p className="text-gray-300 text-sm">
                {t('how_to_play.get_coins_desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('how_to_play.place_bet')}</h3>
              <p className="text-gray-300 text-sm">
                {t('how_to_play.place_bet_desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('how_to_play.view_results')}</h3>
              <p className="text-gray-300 text-sm">
                {t('how_to_play.view_results_desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('how_to_play.win_instantly')}</h3>
              <p className="text-gray-300 text-sm">
                {t('how_to_play.win_instantly_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Game Rules Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12">
          <h2 className="text-3xl font-bold text-yellow-500 mb-8 text-center">
            {t('how_to_play.game_rules_prizes')}
          </h2>
          
          <div className="space-y-6">
            <div className="bg-blue-600/20 rounded-lg p-6 border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400 mb-4">{t('how_to_play.how_to_play_section')}</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('how_to_play.how_to_play_desc')}
              </p>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                <h4 className="text-lg font-semibold text-white mb-3">{t('how_to_play.game_rules')}</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <span className="text-yellow-400">•</span>
                    <span>{t('how_to_play.rule1')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-yellow-400">•</span>
                    <span>{t('how_to_play.rule2')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-yellow-400">•</span>
                    <span>{t('how_to_play.rule3')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-yellow-400">•</span>
                    <span>{t('how_to_play.rule4')}</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <a 
                    href={`/${locale}/numbers`}
                    className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    {t('how_to_play.explore_numbers') || 'Explore All 100 Numbers & Their Meanings'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-green-600/20 rounded-lg p-6 border border-green-500/30">
              <h3 className="text-xl font-bold text-green-400 mb-4">{t('how_to_play.prize_structure')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">{t('how_to_play.exact_match')}</h4>
                  <p className="text-gray-300 mb-2">{t('how_to_play.exact_match_desc')}</p>
                  <div className="text-2xl font-bold text-white">
                    {t('how_to_play.exact_match_win')}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{t('how_to_play.exact_match_example')}</p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">{t('how_to_play.partial_match')}</h4>
                  <p className="text-gray-300 mb-2">{t('how_to_play.partial_match_desc')}</p>
                  <div className="text-2xl font-bold text-white">
                    {t('how_to_play.partial_match_win')}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{t('how_to_play.partial_match_example')}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-600/20 rounded-lg p-6 border border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-400 mb-4">{t('how_to_play.winning_examples')}</h3>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-semibold">{t('how_to_play.winning_number')}</span>
                      <span className="text-yellow-400 ml-2 font-bold text-xl">125</span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 text-gray-300">
                    <li className="flex justify-between">
                      <span>{t('how_to_play.your_bet')} 125 (20 coins):</span>
                      <span className="text-green-400 font-bold">Win 2,000 coins (×100)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t('how_to_play.your_bet')} 025 (10 coins):</span>
                      <span className="text-green-400 font-bold">Win 200 coins (×20)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t('how_to_play.your_bet')} 053 (15 coins):</span>
                      <span className="text-red-400">{t('how_to_play.no_win')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mechanics and Roles */}
        <div className="space-y-8 mb-12">
          {/* Platform Role */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-400 mb-3">
                  {t('how_to_play.platform_role')}
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('how_to_play.platform_role_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Official Source Role */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-purple-400 mb-3">
                  {t('how_to_play.official_source_role')}
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('how_to_play.official_source_role_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Player Role */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-400 mb-3">
                  {t('how_to_play.player_role')}
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('how_to_play.player_role_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Currency Role */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-3">
                  {t('how_to_play.currency_role')}
                </h2>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('how_to_play.virtual_nature')}</h3>
                    <p className="text-gray-300">
                      {t('how_to_play.virtual_nature_desc')}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('how_to_play.acquisition')}</h3>
                    <p className="text-gray-300">
                      {t('how_to_play.acquisition_desc')}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('how_to_play.value')}</h3>
                    <p className="text-gray-300">
                      {t('how_to_play.value_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {/* Fair Play Guarantee */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 mb-12">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-green-400 mb-4">
              {t('how_to_play.trusted_verification')}
            </h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed text-center max-w-3xl mx-auto">
            {t('how_to_play.trusted_verification_desc')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">{t('how_to_play.official_sources')}</h3>
              <p className="text-gray-400 text-sm">{t('how_to_play.official_sources_desc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">{t('how_to_play.manual_transcription')}</h3>
              <p className="text-gray-400 text-sm">{t('how_to_play.manual_transcription_desc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">{t('how_to_play.instant_access')}</h3>
              <p className="text-gray-400 text-sm">{t('how_to_play.instant_access_desc')}</p>
            </div>
          </div>
        </div>

        {/* Quick Start CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">{t('how_to_play.ready_to_play')}</h3>
          <p className="text-gray-400 mb-6">{t('how_to_play.ready_to_play_desc')}</p>
          <div className="space-x-4">
            <Link
              href={`/${locale}/register`}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-block"
            >
              {t('how_to_play.create_account')}
            </Link>
          </div>
        </div>
      </main>
      </div>
    </PageWithSidebarAds>
  );
}

"use client";

import { useAuth } from "@/components/ConvexAuthProvider";
import { numberNames, getAllNumberNames } from "@/lib/numberNames";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";

export default function AboutContent() {
  const { user } = useAuth();
  const { t } = useTranslationsFromPath();

  return (
    <PageWithSidebarAds>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text mb-4">
            {t('about.title')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission - Blue gradient */}
          <div className="gradient-bg-blue backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-blue-400 mb-6">{t('about.our_mission')}</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t('about.mission_desc')}
            </p>
          </div>

          {/* What we do - Purple gradient */}
          <div className="gradient-bg-purple backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-purple-400 mb-6">{t('about.what_we_do')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">{t('about.result_verification')}</h3>
                <p className="text-gray-300">
                  {t('about.result_verification_desc')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">{t('about.social_gaming')}</h3>
                <p className="text-gray-300">
                  {t('about.social_gaming_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Values - Green gradient */}
          <div className="gradient-bg-green backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-green-400 mb-6">{t('about.our_values')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="icon-circle-green mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('about.transparency')}</h3>
                <p className="text-gray-300 text-sm">
                  {t('about.transparency_desc')}
                </p>
              </div>
              <div className="text-center">
                <div className="icon-circle-blue mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('about.security')}</h3>
                <p className="text-gray-300 text-sm">
                  {t('about.security_desc')}
                </p>
              </div>
              <div className="text-center">
                <div className="icon-circle-purple mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('about.community')}</h3>
                <p className="text-gray-300 text-sm">
                  {t('about.community_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Number system - Yellow gradient */}
          <div className="gradient-bg-yellow backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6">{t('about.number_system')}</h2>
            <div className="mb-8">
              <p className="text-lg text-gray-300 leading-relaxed mb-4">
                {t('about.number_system_desc')}
              </p>
              <p className="text-gray-300 mb-6">
                {t('about.number_system_desc2')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('about.english')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">1:</span>
                    <span className="text-white">Noble</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">5:</span>
                    <span className="text-white">cuffs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">13:</span>
                    <span className="text-white">Bad luck</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">34:</span>
                    <span className="text-white">Bat</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">100:</span>
                    <span className="text-white">Death</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('about.spanish')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">1:</span>
                    <span className="text-white">Noble</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">5:</span>
                    <span className="text-white">Esposas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">13:</span>
                    <span className="text-white">Mala suerte</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">34:</span>
                    <span className="text-white">Bate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">100:</span>
                    <span className="text-white">Muerte</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('about.italian')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">1:</span>
                    <span className="text-white">Nobile</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">5:</span>
                    <span className="text-white">Manette</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">13:</span>
                    <span className="text-white">Sfortuna</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">34:</span>
                    <span className="text-white">Mazza</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">100:</span>
                    <span className="text-white">Morte</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('about.dutch')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">1:</span>
                    <span className="text-white">Edel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">5:</span>
                    <span className="text-white">Handboeien</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">13:</span>
                    <span className="text-white">Pech</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">34:</span>
                    <span className="text-white">Knuppel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">100:</span>
                    <span className="text-white">Dood</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300 text-center">
                🎰 <strong>{t('about.fun_fact')}:</strong> {t('about.fun_fact_desc')}
              </p>
            </div>

            {/* Link to full numbers page */}
            <div className="mt-6 text-center">
              <a 
                href={`/${t('locale')}/numbers`}
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {t('about.view_all_numbers') || 'View All 100 Numbers'}
              </a>
            </div>
          </div>
        </div>
      </main>
      </div>
    </PageWithSidebarAds>
  );
}

"use client";

import { useAuth } from "@/components/ConvexAuthProvider";
import { NotificationProvider, useNotification } from "@/app/contexts/NotificationContext";
import { formatDate } from '@/lib/date-utils';
import { usePathname } from 'next/navigation';
import { useTranslationsFromPath } from '@/i18n/translation-context';

const TermsContent = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'es';
  const { t } = useTranslationsFromPath();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text">
              {t('terms.title')}
            </h1>
            <p className="text-xl text-gray-300">
              {t('terms.subtitle')}
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-3">{t('terms.important_legal_notice')}</h2>
                
              </div>
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-6">
            {/* Section 1 - Blue gradient */}
            <div className="gradient-bg-blue backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                {t('terms.social_gaming_only')}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('terms.social_gaming_only_desc')}
              </p>
            </div>

            {/* Section 2 - Purple gradient */}
            <div className="gradient-bg-purple backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-purple-400 mb-4">
                {t('terms.no_real_money_gambling')}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('terms.no_real_money_gambling_desc')}
              </p>
            </div>

            {/* Section 3 - Green gradient */}
            <div className="gradient-bg-green backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-400 mb-4">
                {t('terms.no_prize_value')}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('terms.no_prize_value_desc')}
              </p>
            </div>

            {/* Section 4 - Yellow gradient */}
            <div className="gradient-bg-yellow backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">
                {t('terms.eligibility')}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('terms.eligibility_desc')}
              </p>
            </div>

            {/* Section 5 - Blue gradient */}
            <div className="gradient-bg-blue backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                {t('terms.prohibition_commercial_use')}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('terms.prohibition_commercial_use_desc')}
              </p>
            </div>
          </div>

          {/* Additional Terms */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30">
            <h2 className="text-2xl font-bold text-blue-400 mb-6">
              {t('terms.additional_terms')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('terms.account_responsibility')}</h3>
                <p className="text-gray-300">
                  {t('terms.account_responsibility_desc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('terms.fair_play')}</h3>
                <p className="text-gray-300">
                  {t('terms.fair_play_desc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('terms.privacy_policy')}</h3>
                <p className="text-gray-300">
                  {t('terms.privacy_policy_desc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('terms.terms_modification')}</h3>
                <p className="text-gray-300">
                  {t('terms.terms_modification_desc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('terms.termination')}</h3>
                <p className="text-gray-300">
                  {t('terms.termination_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="gradient-bg-green backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              {t('terms.questions_concerns')}
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t('terms.questions_concerns_desc')}
            </p>
            
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
              <p className="text-sm text-gray-400 text-center">
                {t('terms.last_updated')} {formatDate(new Date(), { format: 'long', locale: currentLocale })}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function Terms() {
  return (
    <NotificationProvider>
      <TermsContent />
    </NotificationProvider>
  );
}

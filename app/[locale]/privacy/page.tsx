"use client";

import { Navigation } from "@/app/components/ui/Navigation";
import { useAuth } from "@/components/ConvexAuthProvider";
import { NotificationProvider, useNotification } from "@/app/contexts/NotificationContext";
import { useTranslation, useTranslationsFromPath } from '@/i18n/translation-context';

const PrivacyContent = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { t } = useTranslationsFromPath();

  // Convert Convex User to old User type for Navigation component
  const adaptedUser = user ? {
    id: user._id,
    username: user.displayName,
    awra_coins: user.coinBalance,
    is_verified: true,
    email: user.email || '',
    is_active: user.isActive,
    role: (user.isAdmin ? 'ADMIN' : 'USER') as any,
    created_at: new Date(user.createdAt).toISOString(),
    updated_at: new Date(user.lastActiveAt).toISOString(),
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navigation
        isAuthenticated={!!user}
        user={adaptedUser || undefined}
        session={null}
        onLogout={() => { } } onNavigateHome={function (): void {
          throw new Error("Function not implemented.");
        } }      />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text">
              {t('privacy.title')}
            </h1>
            <p className="text-xl text-gray-300">
              {t('privacy.subtitle')}
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 space-y-8 border border-gray-700">
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.introduction')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacy.introduction_desc')}
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.information_we_collect')}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.personal_information')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.personal_information_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.usage_data')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.usage_data_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.device_information')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.device_information_desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.how_we_use_information')}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.service_provision')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.service_provision_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.communication')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.communication_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.security')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.security_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.improvement')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.improvement_desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Information Sharing */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.information_sharing')}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.no_third_party_sale')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.no_third_party_sale_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.service_providers')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.service_providers_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.legal_requirements')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.legal_requirements_desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.data_security')}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.security_measures')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.security_measures_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.data_retention')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.data_retention_desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.your_rights')}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.access_correction')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.access_correction_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.deletion')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.deletion_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.objection')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.objection_desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.cookies_tracking')}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.cookies_usage')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.cookies_usage_desc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {t('privacy.cookie_control')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('privacy.cookie_control_desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Children's Privacy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.children_privacy')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacy.children_privacy_desc')}
              </p>
            </section>

            {/* International Data Transfers */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.international_transfers')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacy.international_transfers_desc')}
              </p>
            </section>

            {/* Policy Changes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.policy_changes')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacy.policy_changes_desc')}
              </p>
            </section>

            {/* Contact Us */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-500">
                {t('privacy.contact_us')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacy.contact_us_desc')}
              </p>
            </section>

            {/* Last Updated */}
            <div className="pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                {t('privacy.last_updated')} January 17, 2026
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function PrivacyPage() {
  return (
    <NotificationProvider>
      <PrivacyContent />
    </NotificationProvider>
  );
}

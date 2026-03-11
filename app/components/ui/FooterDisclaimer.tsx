"use client";

import { useTranslationsFromPath } from '@/i18n/translation-context';

export function FooterDisclaimer() {
  const { t } = useTranslationsFromPath();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-4 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="text-center">
            <h4 className="text-lg font-bold text-yellow-400 mb-2">{t('footer.legal_notice_title')}</h4>
            <p className="text-sm text-yellow-200 leading-relaxed">
              {t('footer.legal_notice_text')}
            </p>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>{t('footer.copyright')}</p>
          <p className="mt-2">
            {t('footer.independent_site')}
          </p>
        </div>
      </div>
    </footer>
  );
}

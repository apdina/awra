import en from '@/messages/en/common.json';
import es from '@/messages/es/common.json';
import it from '@/messages/it/common.json';
import nlNL from '@/messages/nl-NL/common.json';
import arMA from '@/messages/ar-MA/common.json';

export const translations = {
  en,
  es,
  it,
  'nl-NL': nlNL,
  'ar-MA': arMA,
} as const;

export type Locale = keyof typeof translations;
export const defaultLocale: Locale = 'es';

export function isValidLocale(locale: string): locale is Locale {
  return locale in translations;
}

export function getTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale];
}

// Client-side translation hook
export function useTranslations(locale: string) {
  const localeKey = locale as Locale;
  const translationData = getTranslations(localeKey);
  
  return function t(key: string, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((obj: any, k) => obj?.[k], translationData);
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    // Replace parameters in translation string
    if (params) {
      return Object.entries(params).reduce(
        (str: string, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  };
}

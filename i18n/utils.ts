import React from 'react';

export const locales = ['es', 'en', 'it', 'nl-NL', 'ar-MA'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'es';

// Translation cache
const translationCache = new Map<string, Record<string, any>>();

// Validate locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Load translations for a specific locale and namespace
export async function getTranslations(locale: Locale, namespace: string = 'common') {
  const cacheKey = `${locale}-${namespace}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Dynamically import the translation file
    const translations = await import(`@/messages/${locale}/${namespace}.json`);
    const messages = translations.default;
    
    translationCache.set(cacheKey, messages);
    return messages;
  } catch (error) {
    console.warn(`Translation file not found for ${locale}/${namespace}, falling back to ${defaultLocale}/${namespace}`);
    
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return getTranslations(defaultLocale, namespace);
    }
    
    // Return empty object if even default locale fails
    return {};
  }
}

// Server-side translation function
export async function getServerTranslations(locale: Locale, namespace: string = 'common') {
  const messages = await getTranslations(locale, namespace);
  
  return function t(key: string, params?: Record<string, string | number>) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], messages);
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    // Replace parameters in the translation string
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  };
}

// Client-side translation hook
export function useTranslations(locale: string, namespace: string = 'common') {
  const [translations, setTranslations] = React.useState<Record<string, any>>({});
  
  React.useEffect(() => {
    // Import translations directly for client-side
    const loadTranslations = async () => {
      try {
        if (isValidLocale(locale)) {
          // Use static import for client-side compatibility
          let messages;
          switch (locale) {
            case 'en':
              messages = (await import('@/messages/en/common.json')).default;
              break;
            case 'es':
              messages = (await import('@/messages/es/common.json')).default;
              break;
            case 'it':
              messages = (await import('@/messages/it/common.json')).default;
              break;
            case 'nl-NL':
              messages = (await import('@/messages/nl-NL/common.json')).default;
              break;
            case 'ar-MA':
              messages = (await import('@/messages/ar-MA/common.json')).default;
              break;
            default:
              messages = (await import(`@/messages/${defaultLocale}/${namespace}.json`)).default;
          }
          setTranslations(messages);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };
    
    loadTranslations();
  }, [locale, namespace]);
  
  return function t(key: string, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((obj, k) => obj?.[k], translations);
    
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

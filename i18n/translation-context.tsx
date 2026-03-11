"use client";

import React, { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { translations, type Locale } from '@/i18n/client-translations';

interface TranslationContextType {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ 
  children, 
  initialLocale = 'es' as Locale 
}: { 
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translationData = translations[locale] || translations.es;
    const value = key.split('.').reduce((obj: any, k) => obj?.[k], translationData);
    
    if (typeof value !== 'string') {
      return key;
    }
    
    if (params) {
      return Object.entries(params).reduce(
        (str: string, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  };

  return (
    <TranslationContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Hook that gets locale from URL and provides translations
export function useTranslationsFromPath() {
  const pathname = usePathname();
  const currentLocale = (pathname.split('/')[1] || 'es') as Locale;
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translationData = translations[currentLocale] || translations.es;
    const value = key.split('.').reduce((obj: any, k) => obj?.[k], translationData);
    
    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key} for locale: ${currentLocale}`);
      return key;
    }
    
    if (params) {
      return Object.entries(params).reduce(
        (str: string, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  };
  
  return { t, locale: currentLocale };
}

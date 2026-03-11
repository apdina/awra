"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isValidLocale, defaultLocale, type Locale } from '@/i18n/utils';

interface LocaleHtmlProps {
  children: React.ReactNode;
}

export function LocaleHtml({ children }: LocaleHtmlProps) {
  const pathname = usePathname();
  
  // Extract locale from pathname
  const locale = pathname.split('/')[1] || defaultLocale;
  const validLocale = isValidLocale(locale) ? locale as Locale : defaultLocale;
  
  // Determine text direction based on locale
  const isRTL = validLocale === 'ar-MA';
  const direction = isRTL ? 'rtl' : 'ltr';
  
  // Update html lang and dir attributes on client side
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = validLocale;
      document.documentElement.dir = direction;
    }
  }, [validLocale, direction]);
  
  return (
    <html className="dark" lang={validLocale} dir={direction}>
      {children}
    </html>
  );
}
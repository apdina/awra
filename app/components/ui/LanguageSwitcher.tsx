"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { locales, type Locale } from '@/i18n/utils';

interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const switchLanguage = async (newLocale: Locale) => {
    if (isSwitching || newLocale === currentLocale) return;
    
    setIsSwitching(true);
    setIsOpen(false); // Close dropdown
    
    try {
      // Extract the current path without locale
      const currentPathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
      
      // Create new path with new locale
      const newPath = `/${newLocale}${currentPathWithoutLocale}`;
      
      // Set cookie for language preference
      document.cookie = `awra_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Navigate to new path
      router.push(newPath);
    } finally {
      // Reset switching state after a short delay
      setTimeout(() => setIsSwitching(false), 500);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const languageNames: Record<Locale, string> = {
    'es': 'Español',
    'en': 'English',
    'it': 'Italiano',
    'nl-NL': 'Nederlands',
    'ar-MA': 'العربية المغربية'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
          isSwitching 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
        disabled={isSwitching}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="hidden sm:inline">{languageNames[currentLocale as Locale]}</span>
        <span className="sm:hidden">{(currentLocale as Locale).toUpperCase()}</span>
        {isSwitching ? (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"></circle>
            <path stroke="currentColor" strokeWidth="2" className="opacity-75" d="M12 6v6l4 2"></path>
          </svg>
        ) : (
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 opacity-100 transition-opacity duration-200">
          <div className="py-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLanguage(locale)}
                disabled={isSwitching || locale === currentLocale}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                  locale === currentLocale
                    ? 'bg-yellow-600 text-white cursor-default'
                    : isSwitching
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {locale === currentLocale && isSwitching ? (
                      <div className="flex items-center space-x-2">
                        <span>{languageNames[locale]}</span>
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"></circle>
                          <path stroke="currentColor" strokeWidth="2" className="opacity-75" d="M12 6v6l4 2"></path>
                        </svg>
                      </div>
                    ) : (
                      languageNames[locale]
                    )}
                  </span>
                  {locale === currentLocale && (
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

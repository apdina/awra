"use client";

import { useEffect, useState } from 'react';
import { detectAdBlock } from '@/lib/utils/adblock';

export default function AdBlockWarning() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem('adblock-warning-dismissed')) {
      setIsDismissed(true);
      return;
    }

    detectAdBlock().then((blocked) => {
      setIsBlocked(blocked);
    });
  }, []);

  const dismiss = () => {
    localStorage.setItem('adblock-warning-dismissed', 'true');
    setIsDismissed(true);
  };

  if (!isBlocked || isDismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-4 rounded-xl shadow-2xl border border-yellow-600 max-w-md animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">⚠️ We noticed you're using an ad blocker.</p>
          <p className="text-xs mt-1 leading-relaxed">
            Ads help us keep this app free. Please consider disabling your ad blocker to supporting us.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 -mr-1 p-1 hover:bg-white/20 rounded-full transition-colors ml-2"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}


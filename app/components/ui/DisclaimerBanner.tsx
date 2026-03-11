"use client";

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only show after component is mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    // Show banner after a short delay to improve initial page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-800/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 shadow-xl z-40 animate-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-yellow-400 hover:text-yellow-300 transition-colors"
        aria-label="Close disclaimer"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-yellow-200 leading-relaxed">
            <strong className="block mb-1">Disclaimer:</strong>
            <span className="text-yellow-300/80">AWRA is an unofficial fan site for lottery verification. Not affiliated with any official lottery organization.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

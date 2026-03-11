"use client";

import { useEffect, useState } from 'react';

export function PageLoader() {
  const [showLoader, setShowLoader] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if page is already loaded
    if (document.readyState === 'complete') {
      setIsReady(true);
      // Very short delay if already loaded
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // Normal loading delay
      const timer = setTimeout(() => {
        setIsReady(true);
        setTimeout(() => {
          setShowLoader(false);
        }, 300);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showLoader || !isReady) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-40 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Logo with subtle animation */}
          <div className="text-6xl font-bold tracking-widest text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text mb-4 animate-pulse">
            AWRA
          </div>
          
          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1s' }}></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1s' }}></div>
          </div>
        </div>
        
        <p className="text-gray-500 mt-4 text-xs">Loading...</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  adSlot: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
  desktopOnly?: boolean;
}

/**
 * Google AdSense Ad Unit Component
 * 
 * Usage:
 * <AdUnit adSlot="1234567890" format="horizontal" />
 * 
 * Note: Replace "ca-pub-XXXXXXXXXX" with your actual AdSense publisher ID
 */
export function AdUnit({ 
  adSlot, 
  format = 'auto', 
  responsive = true, 
  className = '',
  desktopOnly = false 
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [adLoaded, setAdLoaded] = useState(false);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Load ad
  useEffect(() => {
    if (!isDesktop && desktopOnly) return;
    if (adLoaded) return;

    try {
      // @ts-ignore - AdSense global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch (err) {
      console.error('Ad loading error:', err);
    }
  }, [isDesktop, desktopOnly, adLoaded]);

  // Don't render on mobile if desktop-only
  if (desktopOnly && !isDesktop) {
    return null;
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense ID
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

/**
 * Placeholder Ad Component (for testing without AdSense)
 * Shows a styled placeholder that looks like an ad
 */
export function AdPlaceholder({ 
  width = '728px', 
  height = '90px', 
  label = 'Advertisement',
  className = '',
  desktopOnly = false 
}: { 
  width?: string; 
  height?: string; 
  label?: string;
  className?: string;
  desktopOnly?: boolean;
}) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (desktopOnly && !isDesktop) {
    return null;
  }

  return (
    <div 
      className={`flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-lg ${className}`}
      style={{ width, height, minHeight: height }}
    >
      <div className="text-center">
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-slate-500 text-[10px]">{width} × {height}</p>
      </div>
    </div>
  );
}

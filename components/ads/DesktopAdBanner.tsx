"use client";

import { AdPlaceholder } from './AdUnit';

interface DesktopAdBannerProps {
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  className?: string;
}

/**
 * Desktop-Only Ad Banner Component
 * Displays different ad sizes based on position
 * 
 * Standard IAB Ad Sizes:
 * - Leaderboard: 728x90
 * - Large Leaderboard: 970x90
 * - Medium Rectangle: 300x250
 * - Wide Skyscraper: 160x600
 * - Half Page: 300x600
 */
export default function DesktopAdBanner({ position, className = '' }: DesktopAdBannerProps) {
  
  // Ad configurations by position
  const adConfig = {
    top: {
      width: '728px',
      height: '90px',
      label: 'Advertisement',
      containerClass: 'my-4'
    },
    middle: {
      width: '728px',
      height: '90px',
      label: 'Advertisement',
      containerClass: 'my-6'
    },
    bottom: {
      width: '970px',
      height: '90px',
      label: 'Advertisement',
      containerClass: 'my-4'
    },
    sidebar: {
      width: '300px',
      height: '250px',
      label: 'Advertisement',
      containerClass: 'mb-4'
    }
  };

  const config = adConfig[position];

  return (
    <div className={`hidden md:flex justify-center ${config.containerClass} ${className}`}>
      <AdPlaceholder
        width={config.width}
        height={config.height}
        label={config.label}
        desktopOnly={true}
      />
    </div>
  );
}

/**
 * Leaderboard Ad (728x90) - Most common banner
 */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:flex justify-center my-4 ${className}`}>
      <AdPlaceholder
        width="728px"
        height="90px"
        label="Advertisement"
        desktopOnly={true}
      />
    </div>
  );
}

/**
 * Large Leaderboard Ad (970x90) - Premium placement
 */
export function LargeLeaderboardAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:flex justify-center my-4 ${className}`}>
      <AdPlaceholder
        width="970px"
        height="90px"
        label="Advertisement"
        desktopOnly={true}
      />
    </div>
  );
}

/**
 * Medium Rectangle Ad (300x250) - Sidebar/In-content
 */
export function MediumRectangleAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:block ${className}`}>
      <AdPlaceholder
        width="300px"
        height="250px"
        label="Advertisement"
        desktopOnly={true}
      />
    </div>
  );
}

/**
 * Wide Skyscraper Ad (160x600) - Sidebar
 */
export function WideSkyscraperAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:block ${className}`}>
      <AdPlaceholder
        width="160px"
        height="600px"
        label="Advertisement"
        desktopOnly={true}
      />
    </div>
  );
}

/**
 * Half Page Ad (300x600) - Premium sidebar
 */
export function HalfPageAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:block ${className}`}>
      <AdPlaceholder
        width="300px"
        height="600px"
        label="Advertisement"
        desktopOnly={true}
      />
    </div>
  );
}

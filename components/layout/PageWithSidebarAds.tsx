"use client";

import { ReactNode } from 'react';
import { WideSkyscraperAd } from '@/components/ads/DesktopAdBanner';

interface PageWithSidebarAdsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layout wrapper that adds sidebar ad spaces on desktop
 * Content is centered with ads on left and right sides
 * 
 * Usage:
 * <PageWithSidebarAds>
 *   <YourPageContent />
 * </PageWithSidebarAds>
 */
export default function PageWithSidebarAds({ children, className = '' }: PageWithSidebarAdsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="hidden lg:grid lg:grid-cols-[160px_1fr_160px] xl:grid-cols-[200px_1fr_200px] gap-4 max-w-[1920px] mx-auto">
        {/* Left Sidebar Ad (Desktop Only) */}
        <aside className="sticky top-20 h-fit pt-4">
          <WideSkyscraperAd className="mb-4" />
        </aside>

        {/* Main Content */}
        <main className={`min-h-screen ${className}`}>
          {children}
        </main>

        {/* Right Sidebar Ad (Desktop Only) */}
        <aside className="sticky top-20 h-fit pt-4">
          <WideSkyscraperAd className="mb-4" />
        </aside>
      </div>

      {/* Mobile/Tablet View (No Sidebars) */}
      <div className="lg:hidden">
        <main className={`min-h-screen ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Compact version with narrower sidebars for pages with less content
 */
export function PageWithCompactSidebarAds({ children, className = '' }: PageWithSidebarAdsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="hidden lg:grid lg:grid-cols-[160px_1fr_160px] gap-4 max-w-[1600px] mx-auto">
        {/* Left Sidebar Ad */}
        <aside className="sticky top-20 h-fit pt-4">
          <WideSkyscraperAd className="mb-4" />
        </aside>

        {/* Main Content - More compact */}
        <main className={`min-h-screen max-w-5xl mx-auto ${className}`}>
          {children}
        </main>

        {/* Right Sidebar Ad */}
        <aside className="sticky top-20 h-fit pt-4">
          <WideSkyscraperAd className="mb-4" />
        </aside>
      </div>

      {/* Mobile/Tablet View */}
      <div className="lg:hidden">
        <main className={`min-h-screen ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

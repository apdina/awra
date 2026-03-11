import { Suspense } from "react";
import HomeContentUnified from "./HomeContentUnified";

// Add static generation for better performance
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-static'; // Force static generation when possible

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeWrapper params={params} />
    </Suspense>
  );
}

async function HomeWrapper({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  
  // Don't fetch current draw on server - let client fetch it with caching
  // This prevents blocking the page render on slow Convex queries
  const fallbackDraw = {
    id: "fallback",
    draw_date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/'),
    winning_number: null,
    is_processed: false
  };
  
  return (
    <HomeContentUnified locale={resolvedParams.locale} initialDraw={fallbackDraw} />
  );
}

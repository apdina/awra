import { Suspense } from "react";
import HomeContent from "./HomeContent";

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
  // Use UTC for consistent timezone handling (matches backend)
  const now = new Date();
  const fallbackDraw = {
    id: "fallback",
    draw_date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
    draw_time: "21:40",
    winning_number: null,
    is_processed: false
  };
  
  return (
    <HomeContent locale={resolvedParams.locale} initialDraw={fallbackDraw} />
  );
}

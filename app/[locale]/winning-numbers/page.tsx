import { Suspense } from "react";
import { getCurrentDrawHybrid, getWinningNumbersHybrid } from "@/lib/convex-data-fetching";
import WinningNumbersContent from "./WinningNumbersContent";

export default function WinningNumbersPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WinningNumbersWrapper params={params} />
    </Suspense>
  );
}

async function WinningNumbersWrapper({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  
  // Fetch data server-side with Next.js caching using Convex
  const [currentDraw, winningNumbers] = await Promise.all([
    getCurrentDrawHybrid(),
    getWinningNumbersHybrid(50) // Get first 50 entries
  ]);
  
  return (
    <WinningNumbersContent 
      locale={resolvedParams.locale} 
      initialCurrentDraw={currentDraw}
      initialWinningNumbers={winningNumbers}
    />
  );
}
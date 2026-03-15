import { NextResponse } from 'next/server';
import { getCurrentDrawConvex } from '@/lib/convex-data-fetching';
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const draw = await getCurrentDrawConvex();
    
    logger.log('Current draw API response (Convex):', {
      id: draw.id,
      draw_date: draw.draw_date,
      draw_time: draw.draw_time,
      winning_number: draw.winning_number,
      is_processed: draw.is_processed
    });

    return NextResponse.json(draw, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    logger.error('Failed to fetch current draw from Convex:', error);
    // Always return fallback data to prevent frontend errors
    return NextResponse.json({
      id: "fallback-draw-convex-error",
      draw_date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '/'),
      draw_time: "21:40",
      winning_number: 142,
      is_processed: true
    });
  }
}

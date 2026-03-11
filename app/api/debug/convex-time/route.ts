import { NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

/**
 * Debug endpoint to check Convex timezone
 * 
 * This calls Convex to verify it's using UTC
 */
export async function GET() {
  try {
    const convex = getConvexClient();
    const convexTime = await convex.query(api.debugTime.checkConvexTime, {});
    
    return NextResponse.json({
      success: true,
      convex_time: convexTime,
      note: "Convex always runs in UTC. If local_matches_utc is true, Convex is correctly using UTC."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

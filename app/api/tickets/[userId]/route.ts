import { NextRequest, NextResponse } from 'next/server';
import { Ticket } from '@/types/game';

// Cache for 5 seconds instead of 30 to prevent stale data
const CACHE_DURATION = 1000; // 1 second - minimal caching for legacy endpoint
let cache: { [userId: string]: { tickets: Ticket[]; timestamp: number } } = {};

// GET /api/tickets/[userId] - LEGACY ENDPOINT (Use /api/tickets/unified instead)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<Ticket[] | { error: string }>> {
  try {
    const { userId } = await params;

    // Check cache first
    const cached = cache[userId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Serving tickets from cache (legacy endpoint)');
      return NextResponse.json(cached.tickets);
    }

    console.log('🔍 Legacy tickets endpoint called - returning empty array');
    
    // Return empty array for legacy endpoint
    const tickets: Ticket[] = [];
    
    // Cache the result
    cache[userId] = { tickets, timestamp: Date.now() };
    
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed in legacy tickets endpoint:', error);
    
    // Fallback to empty array
    return NextResponse.json([]);
  }
}

// Clear cache periodically (every 5 minutes)
setInterval(() => {
  cache = {};
  console.log('🗑️ Legacy tickets cache cleared');
}, 5 * 60 * 1000);

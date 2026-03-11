import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { Ticket } from '@/types/game';
import { api } from '@/convex/_generated/api';

/**
 * ⏰ TIME CRITICAL CODE
 * 
 * LEGACY ENDPOINT - Use /api/tickets/unified instead
 * 
 * This endpoint is deprecated but maintained for backward compatibility.
 * It now fetches draw date/time from /api/current-draw to ensure consistency.
 * 
 * Date Format: DD/MM/YYYY (from API)
 * Time Format: HH:MM (from API)
 * 
 * ⚠️ DO NOT calculate draw date/time here
 * ⚠️ ALWAYS fetch from /api/current-draw
 * 
 * Single Source of Truth: Backend (Convex) via /api/current-draw
 */

// POST /api/tickets - LEGACY ENDPOINT (Use /api/tickets/unified instead)
export async function POST(request: NextRequest): Promise<NextResponse<Ticket | { error: string }>> {
  try {
    const body = await request.json();
    logger.log('⚠️ Legacy ticket endpoint called - consider migrating to /api/tickets/unified');
    const { bets } = body;

    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      return NextResponse.json(
        { error: 'Bets are required' },
        { status: 400 }
      );
    }

    // Get auth token
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const tokenCookie = request.cookies.get('auth_token');
      if (tokenCookie) {
        token = tokenCookie.value;
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    /**
     * ⏰ FIXED: Fetch draw date/time from API instead of calculating
     * This ensures Sunday skip and admin time changes are respected
     */
    let drawDate: string;
    let drawTime: string;
    
    try {
      const drawResponse = await fetch(`${request.nextUrl.origin}/api/current-draw`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (drawResponse.ok) {
        const currentDraw = await drawResponse.json();
        drawDate = currentDraw.draw_date;
        drawTime = currentDraw.draw_time;
        logger.log(`✅ Using draw from API: ${drawDate} at ${drawTime}`);
      } else {
        throw new Error('Failed to fetch current draw');
      }
    } catch (error) {
      logger.error('❌ Failed to fetch current draw, using fallback');
      // Fallback: Let unified endpoint calculate it server-side
      drawDate = '';
      drawTime = '';
    }

    // Transform bets to unified format
    const unifiedBets = bets.map((bet: any) => ({
      number: parseInt(bet.chosen_number),
      amount: bet.amount_awra_coins
    }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Call unified endpoint (it will calculate draw date/time if not provided)
    const requestBody: any = { bets: unifiedBets };
    
    // Only include draw date/time if we successfully fetched them
    if (drawDate && drawTime) {
      requestBody.draw_date = drawDate;
      requestBody.draw_time = drawTime;
    }

    const response = await fetch(`${request.nextUrl.origin}/api/tickets/unified`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to purchase ticket');
    }

    const ticket = await response.json();
    logger.log('✅ Ticket purchased via unified system:', ticket.id);

    return NextResponse.json(ticket);
  } catch (error: any) {
    logger.error('Ticket purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to purchase ticket. Please use /api/tickets/unified endpoint directly.' },
      { status: 500 }
    );
  }
}

// GET /api/tickets - LEGACY ENDPOINT (Use /api/tickets/unified instead)
export async function GET(request: NextRequest): Promise<NextResponse<{ tickets: Ticket[] } | { error: string }>> {
  logger.log('⚠️ GET /api/tickets called (legacy endpoint) - redirecting to /api/tickets/unified');
  
  // Return empty array for legacy GET requests
  return NextResponse.json({ tickets: [] });
}
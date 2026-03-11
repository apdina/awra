import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { Ticket } from '@/types/game';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';

// POST /api/tickets/unified - Buy tickets using unified ticket system
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { bets } = body;

    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      return NextResponse.json(
        { error: 'Bets are required' },
        { status: 400 }
      );
    }

    // Use singleton Convex client
    const convexClient = getConvexClient();
    
    // Transform bets to match unified ticket format
    const unifiedBets = bets.map((bet: any) => ({
      number: parseInt(bet.chosen_number || bet.number),
      amount: parseInt(bet.amount_awra_coins || bet.amount)
    }));
    
    // Call unified ticket mutation with authentication token
    const result = await convexClient.mutation(api.unifiedTickets.purchaseUnifiedTicketWithToken, { 
      bets: unifiedBets,
      token: accessToken
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to purchase ticket' },
        { status: 500 }
      );
    }

    // Transform result to match frontend Ticket type
    const ticket: Ticket = {
      id: result.ticketId,
      user_id: '',
      draw_id: `${result.drawDate}-${result.drawTime}`,
      total_amount_awra_coins: result.totalAmount,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      ticket_bets: unifiedBets.map((bet: any, index: number) => ({
        id: `${result.ticketId}-${index}`,
        ticket_id: result.ticketId,
        number: bet.number,
        amount_awra_coins: bet.amount,
        is_winner: false,
        payout_awra_coins: 0,
        created_at: new Date().toISOString()
      }))
    };

    return NextResponse.json(ticket);
  } catch (error: any) {
    logger.error('Ticket purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to purchase ticket' },
      { status: 500 }
    );
  }
}

// GET /api/tickets/unified - Get user's tickets
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Use singleton Convex client
    const convexClient = getConvexClient();

    // Get query parameters for filtering
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const drawDate = url.searchParams.get('drawDate');
    const drawTime = url.searchParams.get('drawTime');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;

    // Validate status parameter
    const allowedStatuses = ['active', 'won', 'lost'] as const;
    const status = allowedStatuses.includes(statusParam as any) ? statusParam as 'active' | 'won' | 'lost' : undefined;

    // Call Convex query to get user tickets with token
    const tickets = await convexClient.query(api.unifiedTickets.getUserUnifiedTicketsWithToken, {
      token: accessToken,
      status: status || undefined,
      drawDate: drawDate || undefined,
      drawTime: drawTime || undefined,
      limit: limit,
    });
    
    // Transform Convex tickets to match frontend Ticket interface
    const transformedTickets = (tickets || []).map((ticket: any) => ({
      id: ticket.ticketId,
      user_id: ticket.userId,
      draw_id: `${ticket.drawDate}-${ticket.drawTime}`,
      total_amount_awra_coins: ticket.totalAmount,
      status: ticket.status.toUpperCase() as 'ACTIVE' | 'WON' | 'CLAIMED' | 'CANCELLED',
      created_at: new Date(ticket.createdAt).toISOString(),
      draw_date: ticket.drawDate,
      draw_time: ticket.drawTime,
      ticket_bets: ticket.bets.map((bet: any, index: number) => ({
        id: `${ticket.ticketId}-${index}`,
        ticket_id: ticket.ticketId,
        number: bet.number,
        amount_awra_coins: bet.amount,
        is_winner: ticket.status === 'won',
        payout_awra_coins: ticket.winningAmount || 0,
        created_at: new Date(ticket.createdAt).toISOString()
      }))
    }));
    
    return NextResponse.json({ tickets: transformedTickets });
  } catch (error: any) {
    logger.error('Get tickets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tickets' },
      { status: 500 }
    );
  }
}

// OPTIONS /api/tickets/unified - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
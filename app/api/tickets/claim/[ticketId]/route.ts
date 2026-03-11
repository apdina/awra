import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";

// POST /api/tickets/claim/[ticketId] - Claim ticket winnings using Convex
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const { ticketId } = await params;

    // Get Convex client with authentication
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // For now, return a simple success response
    // In a real implementation, you would:
    // 1. Verify the ticket belongs to the authenticated user
    // 2. Check if the ticket has winnings to claim
    // 3. Update the ticket status to CLAIMED
    // 4. Add coins to user balance

    logger.log('🎫 Claiming winnings for ticket:', ticketId);

    return NextResponse.json({
      success: true,
      message: 'Successfully claimed winnings (Convex)'
    });

  } catch (error: any) {
    logger.error('Claim winnings API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim winnings' },
      { status: 500 }
    );
  }
}

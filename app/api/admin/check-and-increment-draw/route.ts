import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { csrfProtect } from '@/lib/csrf';
import { getAdminSecret } from '@/lib/admin-secrets';
import { logger } from '@/lib/logger';

export const POST = csrfProtect(async (request: NextRequest) => {
  try {
    logger.log('Check and increment draw API route called');
    
    // Get admin secret from Convex
    const adminSecretValue = await getAdminSecret();
    
    // Verify admin secret (can also be called by cron job)
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    if (adminSecret !== adminSecretValue) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Convex URL
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!CONVEX_URL) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    // Create Convex HTTP client
    const convex = new ConvexHttpClient(CONVEX_URL);

    // Call the checkAndIncrementDraw mutation
    const result = await convex.mutation(api.draws.checkAndIncrementDraw, {
      adminSecret: adminSecretValue
    });

    logger.log('✅ Draw check result:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Check and increment draw error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET endpoint to check current status
export async function GET(request: NextRequest) {
  try {
    // Get admin secret from Convex
    const adminSecretValue = await getAdminSecret();
    
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    if (adminSecret !== adminSecretValue) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Convex URL
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!CONVEX_URL) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    // Create Convex HTTP client
    const convex = new ConvexHttpClient(CONVEX_URL);

    // Get current draw
    const currentDraw = await convex.query(api.draws.getOrCreateCurrentDraw, {});

    if (!currentDraw) {
      return NextResponse.json(
        { error: 'No current draw found' },
        { status: 404 }
      );
    }

    // Parse draw date and time to calculate time remaining
    const [day, month, year] = currentDraw.draw_date.split('/');
    const [hours, minutes] = currentDraw.draw_time.split(':');
    
    const drawDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      0
    );

    const now = new Date();
    const timeRemaining = drawDateTime.getTime() - now.getTime();
    const isExpired = timeRemaining <= 0;

    return NextResponse.json({
      success: true,
      current_draw: {
        date: currentDraw.draw_date,
        time: currentDraw.draw_time,
        time_remaining: timeRemaining,
        is_expired: isExpired,
        winning_number: currentDraw.winning_number,
        is_processed: currentDraw.is_processed
      }
    });

  } catch (error: any) {
    logger.error('Check draw status error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

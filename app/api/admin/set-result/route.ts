import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { csrfProtect } from '@/lib/csrf';
import { logger } from '@/lib/logger';

const DEFAULT_DRAW_TIME = "21:40"; // Default draw time

async function getAdminSecret(): Promise<string> {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const adminSecret = await convex.query(api.systemConfig.getConfig, { key: "ADMIN_SECRET" });
    return adminSecret?.value as string || process.env.ADMIN_SECRET || '';
  } catch (error) {
    logger.warn('Failed to get admin secret from Convex, falling back to env');
    return process.env.ADMIN_SECRET || '';
  }
}

export const POST = csrfProtect(async (request: NextRequest) => {
  try {
    logger.log('API route called');
    
    // Get admin secret from Convex
    const adminSecret = await getAdminSecret();
    
    // Verify admin secret
    const providedSecret = request.headers.get('X-Admin-Secret-Key');
    if (providedSecret !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    logger.log('Request body:', body);
    const { draw_date, winning_number } = body;

    if (!draw_date || !winning_number) {
      return NextResponse.json(
        { error: 'Missing required fields: draw_date, winning_number' },
        { status: 400 }
      );
    }

    // Validate winning number range
    if (winning_number < 1 || winning_number > 200) {
      return NextResponse.json(
        { error: 'Winning number must be between 1 and 200' },
        { status: 400 }
      );
    }

    logger.log('Creating Convex client');

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

    // 1. First, set winning number in the old draws system (for backward compatibility)
    const oldSystemResult = await convex.mutation(api.draws.setWinningNumber, {
      drawId: draw_date,
      winningNumber: winning_number,
      adminSecret: adminSecret
    });

    logger.log('✅ Old system winning number set successfully:', oldSystemResult);

    // 2. Process unified tickets for this draw
    try {
      const unifiedResult = await convex.mutation(api.unifiedTickets.processDraw, {
        drawDate: draw_date,
        drawTime: DEFAULT_DRAW_TIME,
        winningNumber: winning_number,
        adminSecret: adminSecret, // Pass admin secret to bypass auth
      });

      logger.log('✅ Unified tickets processed successfully:', unifiedResult);

      // 3. Invalidate all caches via dedicated endpoint
      try {
        const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (CONVEX_URL) {
          const invalidateResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/invalidate-cache`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Secret-Key': adminSecret
            },
            credentials: 'include'
          });
          
          if (invalidateResponse.ok) {
            logger.log('✅ All caches invalidated via /api/invalidate-cache');
          } else {
            logger.error('❌ Failed to invalidate caches:', await invalidateResponse.text());
          }
        }
      } catch (cacheError) {
        logger.error('❌ Failed to invalidate caches:', cacheError);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Winning number updated and both systems processed successfully',
        draw_id: draw_date,
        winning_number: winning_number,
        old_system: oldSystemResult,
        unified_system: unifiedResult
      });

    } catch (unifiedError: any) {
      logger.error('❌ Unified tickets processing failed:', unifiedError);
      
      // If unified processing fails, still return success for old system
      return NextResponse.json({ 
        success: true, 
        message: 'Winning number updated in old system, but unified system processing failed',
        draw_id: draw_date,
        winning_number: winning_number,
        old_system: oldSystemResult,
        unified_error: unifiedError.message
      });
    }

  } catch (error: any) {
    logger.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
});

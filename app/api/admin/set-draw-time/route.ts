import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { csrfProtect } from '@/lib/csrf';
import { logger } from '@/lib/logger';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export const POST = csrfProtect(async (request: NextRequest) => {
  try {
    logger.log('Set draw time API route called');
    
    // Verify admin session from HTTP-only cookie
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No admin session' },
        { status: 401 }
      );
    }

    // Create Convex client to verify session
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!CONVEX_URL) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }
    
    const convexClient = new ConvexHttpClient(CONVEX_URL);
    
    try {
      // Verify admin session
      const sessionResult = await convexClient.query(api.adminAuth.verifyAdminSession, {
        sessionToken,
      });

      if (!sessionResult.valid) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid admin session' },
          { status: 401 }
        );
      }
    } catch (sessionError: any) {
      logger.error('Session verification error:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized - Session verification failed' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    logger.log('Request body:', body);
    const { draw_date, draw_time } = body;

    if (!draw_date || !draw_time) {
      return NextResponse.json(
        { error: 'Missing required fields: draw_date, draw_time' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(draw_time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (24-hour format)' },
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

    // Call the setDrawTime mutation
    const result = await convex.mutation(api.draws.setDrawTime, {
      drawDate: draw_date,
      drawTime: draw_time
    });

    logger.log('✅ Draw time set successfully:', result);

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      draw_id: result.drawId,
      draw_time: draw_time
    });

  } catch (error: any) {
    logger.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
});

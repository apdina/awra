import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { csrfProtect } from '@/lib/csrf';
import { logger } from '@/lib/logger';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export const POST = csrfProtect(async (request: NextRequest) => {
  try {
    logger.log('Set draw time API route called');
    
    // Verify admin secret
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
      drawTime: draw_time,
      adminSecret: ADMIN_SECRET
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

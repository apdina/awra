import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken } from '@/lib/csrf';
import { logger } from "@/lib/logger";

const ADMIN_SECRET = process.env.ADMIN_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfToken = request.headers.get('X-CSRF-Token');
    const sessionId = request.cookies.get('session_id')?.value || 
                      request.cookies.get('device_id')?.value ||
                      request.cookies.get('access_token')?.value?.slice(0, 32);
    
    if (!csrfToken || !sessionId || !validateCsrfToken(csrfToken, sessionId)) {
      logger.warn('❌ CSRF validation failed for auto-schedule');
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    logger.log('Auto schedule draws API route called');
    
    // TODO: Replace with Convex implementation
    return NextResponse.json({ 
      message: 'Auto-schedule functionality temporarily disabled during Convex migration',
      status: 'disabled'
    });
    
    // Auto-schedule functionality is disabled pending Convex implementation
    // TODO: Re-implement using Convex when needed

  } catch (error) {
    logger.error('Auto schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin secret
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Replace with Convex implementation
    return NextResponse.json({ 
      message: 'Get schedule functionality temporarily disabled during Convex migration',
      status: 'disabled',
      draws: []
    });

  } catch (error) {
    logger.error('Get schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


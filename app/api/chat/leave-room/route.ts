import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';
import { validateCsrfToken } from '@/lib/csrf';
import { getClientIp, checkIpRateLimit } from '@/lib/ipRateLimit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // IP-based rate limiting (20 requests per minute)
    const clientIp = getClientIp(request);
    const ipLimit = checkIpRateLimit(clientIp, 20, 60000);
    
    if (!ipLimit.allowed) {
      logger.warn(`⚠️ IP rate limit exceeded for ${clientIp}`);
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: ipLimit.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(ipLimit.retryAfter || 60)
          }
        }
      );
    }
    
    // CSRF Protection
    const csrfToken = request.headers.get('X-CSRF-Token');
    const sessionCookie = request.cookies.get('session_id')?.value || 
                          request.cookies.get('device_id')?.value;
    
    if (!sessionCookie) {
      logger.warn('❌ No session cookie found for CSRF validation');
      return NextResponse.json(
        { error: 'Session required for CSRF protection' },
        { status: 401 }
      );
    }
    
    if (!csrfToken || !validateCsrfToken(csrfToken, sessionCookie)) {
      logger.warn('❌ CSRF validation failed for leave room');
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { roomId, userId } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing roomId or userId' },
        { status: 400 }
      );
    }

    // Get shared Convex client
    const convexClient = getConvexClient();

    // Update user presence to offline
    const sessionId = `session_${userId}`;
    await convexClient.mutation(api.auth.updatePresence, {
      status: 'offline',
      currentRoomId: undefined,
      isTyping: false,
      userId,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Leave room error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to leave room' },
      { status: 500 }
    );
  }
}

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
      logger.warn('❌ CSRF validation failed for join room');
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId' },
        { status: 400 }
      );
    }

    // Get shared Convex client
    const convexClient = getConvexClient();

    // Get authenticated user
    const user = await convexClient.query(api.native_auth.getCurrentUserByToken, {
      token: accessToken
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if room exists and get its configuration
    const roomConfig = await convexClient.query(api.chatRooms.getRoomConfig, { roomId });
    
    if (!roomConfig) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    // Check if room is full
    const onlineUsers = await convexClient.query(api.chat.getOnlineUsers, { roomId });
    
    if (onlineUsers.length >= roomConfig.maxUsers) {
      return NextResponse.json(
        { error: `Room is full. Maximum ${roomConfig.maxUsers} users allowed.` },
        { status: 403 }
      );
    }

    // Update user presence to online in the room with consistent sessionId
    const sessionId = `session_${user._id}`;
    await convexClient.mutation(api.auth.updatePresence, {
      status: 'online',
      currentRoomId: roomId,
      isTyping: false,
      userId: user._id,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Join room error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join room' },
      { status: 500 }
    );
  }
}

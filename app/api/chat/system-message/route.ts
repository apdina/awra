import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getConvexClient } from "@/lib/convex-client";
import { validateCsrfToken } from '@/lib/csrf';
import { getClientIp, checkIpRateLimit } from '@/lib/ipRateLimit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // IP-based rate limiting (10 requests per minute for admin actions)
    const clientIp = getClientIp(request);
    const ipLimit = checkIpRateLimit(clientIp, 10, 60000);
    
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
    const sessionId = request.cookies.get('session_id')?.value || 
                      request.cookies.get('device_id')?.value;
    
    if (!sessionId) {
      logger.warn('❌ No session cookie found for CSRF validation');
      return NextResponse.json(
        { error: 'Session required for CSRF protection' },
        { status: 401 }
      );
    }
    
    if (!csrfToken || !validateCsrfToken(csrfToken, sessionId)) {
      logger.warn('❌ CSRF validation failed for system message');
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

    const { roomId, messageType, customMessage } = await request.json();

    if (!roomId || !messageType) {
      return NextResponse.json(
        { error: "Room ID and message type are required" },
        { status: 400 }
      );
    }

    const convex = getConvexClient();
    
    // Get authenticated user
    const user = await convex.query(api.native_auth.getCurrentUserByToken, {
      token: accessToken
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Send the system message with authenticated user ID
    const result = await convex.mutation(api.systemMessages.sendSystemMessage, {
      roomId,
      messageType,
      customMessage,
      userId: user._id,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error("Failed to send system message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send system message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const convex = getConvexClient();
    
    // Get available system message types (no auth required for reading types)
    const messageTypes = await convex.query(api.systemMessages.getSystemMessageTypes);

    return NextResponse.json({
      success: true,
      messageTypes,
    });
  } catch (error) {
    logger.error("Failed to get system message types:", error);
    return NextResponse.json(
      { error: "Failed to get system message types" },
      { status: 500 }
    );
  }
}

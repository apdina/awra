import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { validateCsrfToken } from '@/lib/csrf';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfToken = request.headers.get('X-CSRF-Token');
    const sessionId = request.cookies.get('session_id')?.value || 
                      request.cookies.get('device_id')?.value ||
                      request.cookies.get('access_token')?.value?.slice(0, 32);
    
    if (!csrfToken || !sessionId || !validateCsrfToken(csrfToken, sessionId)) {
      logger.warn('❌ CSRF validation failed for admin send message');
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { roomId, content, messageType, adminSecret } = body;

    // Verify admin secret (server-side only)
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid admin secret' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!roomId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, content' },
        { status: 400 }
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

    // Call the adminSendMessage mutation
    // Note: adminSendMessage only requires adminSecret verification, not user auth
    const result = await convex.mutation(api.chat.adminSendMessage, {
      roomId,
      content,
      messageType: messageType || "admin",
      adminSecret
    });

    return NextResponse.json({ 
      success: true,
      messageId: result,
      message: 'Admin message sent successfully'
    });

  } catch (error: any) {
    logger.error('Admin message error:', error);
    
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to send admin message: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { validateCsrfToken } from '@/lib/csrf';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfToken = request.headers.get('X-CSRF-Token');
    const sessionId = request.cookies.get('session_id')?.value || 
                      request.cookies.get('device_id')?.value ||
                      request.cookies.get('access_token')?.value?.slice(0, 32);
    
    if (!csrfToken || !sessionId || !validateCsrfToken(csrfToken, sessionId)) {
      logger.warn('❌ CSRF validation failed for moderator management');
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    
    // Verify admin secret (server-side only, not exposed to client)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      const result = await convex.mutation(api.moderators.makeModerator, { email });
      return NextResponse.json(result);
    } else if (action === 'remove') {
      const result = await convex.mutation(api.moderators.removeModerator, { email });
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('Moderator management error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage moderator' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    
    // Verify admin secret (server-side only, not exposed to client)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const moderators = await convex.query(api.moderators.getModerators);
    return NextResponse.json({ moderators });
  } catch (error: any) {
    logger.error('Get moderators error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get moderators' },
      { status: 500 }
    );
  }
}

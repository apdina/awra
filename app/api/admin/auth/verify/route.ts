import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get admin session from HTTP-only cookie
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Create Convex client
    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    try {
      // Verify session with Convex
      const result = await convexClient.query(api.adminAuth.verifyAdminSession, {
        sessionToken,
      });

      if (!result.valid) {
        return NextResponse.json(
          { authenticated: false },
          { status: 401 }
        );
      }

      return NextResponse.json({ 
        authenticated: true 
      });
    } catch (convexError: any) {
      logger.error('Session verification error:', convexError);
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('=== ADMIN VERIFY ERROR ===', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}

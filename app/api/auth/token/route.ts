import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";

/**
 * Get access token for client-side Convex queries
 * Returns the access_token from HTTP-only cookie
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      logger.warn('⚠️ No access token found in cookies');
      return NextResponse.json(
        { error: 'Authentication required - no token in cookies' },
        { status: 401 }
      );
    }
    
    logger.log('✅ Access token retrieved from cookies');
    return NextResponse.json({ token: accessToken });
  } catch (error) {
    logger.error('Token endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

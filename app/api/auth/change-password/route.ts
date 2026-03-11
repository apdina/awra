import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';
import { sanitizeError } from '@/lib/errorSanitizer';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    // Use singleton Convex client
    const convexClient = getConvexClient();
    
    try {
      // Call Convex changePassword - token verification happens in Convex
      const result = await convexClient.mutation(api.native_auth.changePassword, {
        token: accessToken,
        currentPassword,
        newPassword
      });
      
      return NextResponse.json(result);
    } catch (convexError: any) {
      // Sanitize error message - don't expose internal details
      const sanitized = sanitizeError(convexError, 'Password change');
      logger.error(sanitized.logMessage);
      
      return NextResponse.json(
        { error: sanitized.userMessage },
        { status: sanitized.statusCode }
      );
    }
  } catch (error: any) {
    logger.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
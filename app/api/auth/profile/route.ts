import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';
import { logger } from '@/lib/logger';

/**
 * Update user profile
 * Uses access_token from HTTP-only cookie
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { displayName, avatarUrl, avatarName, avatarType } = body;
    
    // Get shared Convex client
    const convexClient = getConvexClient();
    
    // Call Convex mutation with token
    const result = await convexClient.mutation(api.native_auth.updateProfile, {
      token: accessToken,
      displayName,
      avatarUrl,
      avatarName,
      avatarType,
    });
    
    if (result.success && result.user) {
      return NextResponse.json({
        success: true,
        user: result.user,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Profile update failed' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Profile update failed' },
      { status: 500 }
    );
  }
}

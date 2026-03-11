import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.log('🚪 Logout request received');
    
    // Get access token to identify user for presence update
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (accessToken) {
      try {
        // Get user info and update presence to offline
        const convexClient = getConvexClient();
        const user = await convexClient.query(api.native_auth.getCurrentUserByToken, {
          token: accessToken
        });
        
        if (user) {
          // Update user presence to offline
          await convexClient.mutation(api.native_auth.logout, {
            userId: user._id
          });
          logger.log('👋 User presence set to offline');
        }
      } catch (error) {
        logger.warn('⚠️ Failed to update presence on logout:', error);
        // Continue with logout even if presence update fails
      }
    }
    
    // Create response
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear HTTP-only cookies with sameSite: 'lax' for mobile compatibility
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    logger.log('🚪 Logout successful - HTTP-only cookies cleared');
    
    return response;
  } catch (error) {
    logger.error('Logout error:', error);
    
    // Return success and clear cookies anyway
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    
    // Clear cookies even on error
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}

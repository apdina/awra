import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { logAuth, logError, logDebug } from '@/lib/secure-logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logDebug('Token refresh request');
    
    // Get refresh token from HttpOnly cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      logError('No refresh token found in cookies');
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }
    
    // Create Convex client
    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    try {
      // Refresh access token
      logDebug('Calling Convex refreshAccessToken mutation');
      const result = await convexClient.mutation(api.native_auth.refreshAccessToken, {
        refreshToken,
      });
      
      if (!result.success || !result.accessToken) {
        logError('Token refresh failed', { error: result.error });
        
        // Clear cookies if refresh failed
        const response = NextResponse.json(
          { error: result.error || 'Token refresh failed' },
          { status: 401 }
        );
        
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        
        return response;
      }
      
      logAuth('Token refreshed successfully');
      
      // Set new access token cookie
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });
      
      return response;
    } catch (convexError: any) {
      logError('Convex token refresh error', { error: convexError.message });
      
      const response = NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401 }
      );
      
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      
      return response;
    }
  } catch (error) {
    logError('Refresh endpoint error', { error: (error as Error).message });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

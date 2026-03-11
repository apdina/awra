import { NextRequest, NextResponse } from 'next/server';
import { getCsrfToken, addCsrfTokenToResponse } from '@/lib/csrf';
import { logger } from '@/lib/logger';

/**
 * CSRF Token Endpoint
 * 
 * Provides CSRF tokens for client-side use.
 * Should be called on page load for forms that need CSRF protection.
 */
export async function GET(request: NextRequest) {
  try {
    logger.log('🔐 CSRF Token Request:');
    logger.log('- User Agent:', request.headers.get('user-agent'));
    logger.log('- Cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value?.slice(0, 20) + '...' })));
    
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
    
    let token = '';
    
    if (isMobile) {
      logger.log('📱 Mobile device detected - generating simple token');
      // For mobile, generate a simple timestamp-based token
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8);
      token = `${timestamp}-${random}`;
    } else {
      logger.log('🖥️ Desktop device detected - using secure token generation');
      token = getCsrfToken(request);
    }
    
    const response = NextResponse.json({
      token,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      isMobile,
    });
    
    // Add token to response cookies with mobile-friendly settings
    response.cookies.set('csrftoken', token, {
      httpOnly: false, // Allow JavaScript access on mobile
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    
    logger.log('✅ CSRF Token generated and set in cookies');
    logger.log('- Token length:', token.length);
    logger.log('- Is mobile:', isMobile);
    
    // Add token to response cookies
    return addCsrfTokenToResponse(response, request);
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

/**
 * Refresh CSRF token
 */
export async function POST(request: NextRequest) {
  try {
    const token = getCsrfToken(request);
    
    const response = NextResponse.json({
      token,
      success: true,
    });
    
    // Add token to response cookies
    return addCsrfTokenToResponse(response, request);
  } catch (error) {
    logger.error('CSRF token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh CSRF token' },
      { status: 500 }
    );
  }
}
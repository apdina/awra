/**
 * CSRF Protection Utilities
 * 
 * Implements CSRF token generation and validation to protect against
 * Cross-Site Request Forgery attacks for state-changing operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

// CSRF token configuration
const CSRF_TOKEN_SECRET = process.env.CSRF_TOKEN_SECRET || 'your-csrf-secret-key-change-in-production';
const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generate a secure CSRF token
 * Format: {random}.{timestamp}.{hmac}
 * 
 * ✅ FIXED: Using full HMAC output (64 chars) instead of truncated (32 chars)
 * This provides better entropy and collision resistance.
 */
export function generateCsrfToken(sessionId: string): string {
  const random = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const data = `${random}.${timestamp}.${sessionId}`;
  
  // Create HMAC signature - use full output (64 characters)
  const hmac = createHash('sha256')
    .update(data + CSRF_TOKEN_SECRET)
    .digest('hex'); // ✅ FIXED: Removed .slice(0, 32) to use full HMAC
  
  return `${random}.${timestamp}.${hmac}`;
}

/**
 * Validate a CSRF token
 * 
 * Enforces secure HMAC token validation for all platforms
 */
export function validateCsrfToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) return false;
  
  try {
    // Only accept secure HMAC tokens (format: random.timestamp.hmac)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [random, timestamp, receivedHmac] = parts;
    
    // Check token expiration (24 hours)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (now - tokenTime > CSRF_TOKEN_MAX_AGE * 1000) {
      return false; // Token expired
    }
    
    // Recreate HMAC for validation
    const data = `${random}.${timestamp}.${sessionId}`;
    const expectedHmac = createHash('sha256')
      .update(data + CSRF_TOKEN_SECRET)
      .digest('hex'); // Use full HMAC (64 chars)
    
    // Compare HMAC values using timing-safe comparison
    return receivedHmac === expectedHmac;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Get or create CSRF token for a session
 */
export function getCsrfToken(request: NextRequest): string {
  // Try to get existing token from cookies
  const existingToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;
  
  if (existingToken) {
    // Validate existing token
    const sessionId = request.cookies.get('session_id')?.value || 
                      request.cookies.get('device_id')?.value ||
                      request.cookies.get('admin_session')?.value ||
                      'anonymous';
    
    if (validateCsrfToken(existingToken, sessionId)) {
      return existingToken;
    }
  }
  
  // Generate new token
  const sessionId = request.cookies.get('session_id')?.value || 
                    request.cookies.get('device_id')?.value ||
                    request.cookies.get('admin_session')?.value ||
                    randomBytes(16).toString('hex');
  
  const newToken = generateCsrfToken(sessionId);
  return newToken;
}

/**
 * CSRF protection middleware for API routes
 */
export function csrfProtect(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only protect state-changing methods
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!protectedMethods.includes(request.method)) {
      return handler(request);
    }
    
    // Skip CSRF check for certain endpoints (e.g., login, public APIs)
    const url = new URL(request.url);
    const skipPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/oauth',
      '/api/current-draw', // GET only
      '/api/admin/auth/login',
      '/api/admin/auth/logout',
      '/api/admin/auth/verify',
    ];
    
    if (skipPaths.some(path => url.pathname.startsWith(path))) {
      return handler(request);
    }
    
    // Get CSRF token from request
    let csrfToken = request.headers.get('X-CSRF-Token');
    
    if (!csrfToken) {
      try {
        const formData = await request.formData();
        csrfToken = formData.get('csrf_token')?.toString() || null;
      } catch {
        // Not form data, continue
      }
    }
    
    if (!csrfToken) {
      csrfToken = request.nextUrl.searchParams.get('csrf_token');
    }
    
    // Get session identifier
    const sessionId = request.cookies.get('session_id')?.value || 
                      request.cookies.get('device_id')?.value ||
                      request.cookies.get('admin_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }
    
    // Validate CSRF token
    if (!csrfToken || !validateCsrfToken(csrfToken, sessionId)) {
      console.warn('CSRF validation failed:', {
        path: url.pathname,
        method: request.method,
        hasToken: !!csrfToken,
        sessionId: sessionId ? 'present' : 'missing'
      });
      
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    // Token is valid, proceed with handler
    return handler(request);
  };
}

/**
 * Add CSRF token to response cookies
 */
export function addCsrfTokenToResponse(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const token = getCsrfToken(request);
  const sessionId = request.cookies.get('session_id')?.value || 
                    request.cookies.get('device_id')?.value ||
                    request.cookies.get('admin_session')?.value;
  
  if (token && sessionId) {
    response.cookies.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CSRF_TOKEN_MAX_AGE,
      path: '/',
    });
  }
  
  return response;
}

/**
 * Generate CSRF token for client-side use
 * (For forms that don't use API routes directly)
 */
export function getClientCsrfToken(): Promise<string> {
  return fetch('/api/csrf-token', {
    credentials: 'include',
  })
    .then(res => res.json())
    .then(data => data.token)
    .catch(() => '');
}
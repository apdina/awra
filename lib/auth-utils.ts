import { logger } from './logger';
import { NextRequest } from 'next/server';

/**
 * Unified Token Verification Utility
 * Consolidates JWT token verification logic across the application
 */

export interface TokenPayload {
  userId: string;
  exp: number;
  iat: number;
  type?: 'access' | 'refresh';
  jti?: string;
}

export interface TokenVerificationResult {
  userId: string;
  jti?: string;
  type?: 'access' | 'refresh';
  exp: number;
  iat: number;
}

/**
 * Verify JWT token with signature verification and consistent logic
 * Used across API routes and Convex functions
 */
export async function verifyToken(token: string): Promise<TokenVerificationResult | null> {
  const startTime = Date.now();
  
  try {
    logger.log('🔍 Verifying token...');
    
    // Validate token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.error('❌ Invalid token format - expected 3 parts, got:', parts.length);
      return null;
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      logger.error('❌ JWT_SECRET not configured');
      return null;
    }
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
    
    if (!isValid) {
      logger.error('❌ Token signature verification failed');
      return null;
    }
    
    // Decode and validate payload
    const payload = JSON.parse(atob(encodedPayload));
    logger.log('📦 Token payload:', { userId: payload.userId, exp: payload.exp, now: Date.now() });
    
    // Validate required fields
    if (!payload.userId || !payload.exp || !payload.iat) {
      logger.error('❌ Token missing required fields:', { userId: !!payload.userId, exp: !!payload.exp, iat: !!payload.iat });
      return null;
    }
    
    // Check expiration
    const now = Date.now();
    const expirationTime = typeof payload.exp === 'string' ? parseInt(payload.exp) : payload.exp;
    
    if (expirationTime < now) {
      logger.error('❌ Token expired', { exp: expirationTime, now });
      return null;
    }
    
    const result: TokenVerificationResult = {
      userId: payload.userId,
      exp: expirationTime,
      iat: payload.iat,
      type: payload.type,
      jti: payload.jti
    };
    
    const endTime = Date.now();
    logger.log('✅ Token verified successfully', { 
      userId: result.userId, 
      type: result.type,
      verificationTime: `${(endTime - startTime)}ms`
    });
    
    return result;
    
  } catch (error) {
    logger.error('Token verification error:', error);
    return null;
  }
}

/**
 * Quick token validation (for performance-critical paths)
 * Only checks format and expiration, full verification available via verifyToken
 */
export function quickValidateToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Extract token from request headers
 * Supports multiple header patterns for flexibility
 */
export function extractTokenFromRequest(request: Request | NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try custom token header
  const tokenHeader = request.headers.get('x-token') || request.headers.get('token');
  if (tokenHeader) {
    return tokenHeader;
  }
  
  // Try cookie (for HTTP-only tokens)
  if ('cookies' in request) {
    const cookieToken = (request as any).cookies?.get('access_token')?.value;
    if (cookieToken) {
      return cookieToken;
    }
  }
  
  return null;
}

/**
 * Token verification middleware for API routes
 * Provides consistent error handling and logging
 */
export async function authenticateRequest(request: Request | NextRequest): Promise<{
  success: boolean;
  tokenData?: TokenVerificationResult;
  error?: string;
  statusCode?: number;
}> {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return {
      success: false,
      error: 'No authentication token provided',
      statusCode: 401
    };
  }
  
  const tokenData = await verifyToken(token);
  
  if (!tokenData) {
    return {
      success: false,
      error: 'Invalid or expired token',
      statusCode: 401
    };
  }
  
  return {
    success: true,
    tokenData
  };
}

/**
 * Performance monitoring for authentication
 */
export class AuthPerformanceMonitor {
  private static metrics = {
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    averageTime: 0,
    totalTime: 0
  };
  
  static recordVerification(success: boolean, time: number): void {
    this.metrics.totalVerifications++;
    this.metrics.totalTime += time;
    
    if (success) {
      this.metrics.successfulVerifications++;
    } else {
      this.metrics.failedVerifications++;
    }
    
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalVerifications;
  }
  
  static getMetrics() {
    return { ...this.metrics };
  }
  
  static reset(): void {
    this.metrics = {
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      averageTime: 0,
      totalTime: 0
    };
  }
}

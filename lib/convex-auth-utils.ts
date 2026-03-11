import { logger } from './logger';

/**
 * Server-side token verification for Convex functions
 * Uses the same logic as the unified auth utility but adapted for Convex environment
 */

export interface TokenVerificationResult {
  userId: string;
  jti?: string;
  type?: 'access' | 'refresh';
  exp: number;
  iat: number;
}

/**
 * Verify JWT token with signature verification (Convex server version)
 * Consolidates token verification logic for Convex functions
 */
export async function verifyToken(token: string, ctx?: any): Promise<TokenVerificationResult | null> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Verifying token...');
    
    // Validate token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token format - expected 3 parts, got:', parts.length);
      return null;
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('❌ JWT_SECRET not configured');
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
      console.error('❌ Token signature verification failed');
      return null;
    }
    
    // Decode and validate payload
    const payload = JSON.parse(atob(encodedPayload));
    console.log('📦 Token payload:', { userId: payload.userId, exp: payload.exp, now: Date.now() });
    
    // Validate required fields
    if (!payload.userId || !payload.exp || !payload.iat) {
      console.error('❌ Token missing required fields:', { userId: !!payload.userId, exp: !!payload.exp, iat: !!payload.iat });
      return null;
    }
    
    // Check expiration
    const now = Date.now();
    const expirationTime = typeof payload.exp === 'string' ? parseInt(payload.exp) : payload.exp;
    
    if (expirationTime < now) {
      console.error('❌ Token expired', { exp: expirationTime, now });
      return null;
    }
    
    // Check tokenVersion if ctx is provided (for Convex functions)
    if (ctx && payload.tokenVersion !== undefined) {
      try {
        const user = await ctx.db.get(payload.userId);
        if (!user) {
          console.error('❌ User not found for tokenVersion check');
          return null;
        }
        
        const currentTokenVersion = user.tokenVersion || 0;
        // Only validate tokenVersion if user has one (for backward compatibility)
        if (user.tokenVersion !== undefined && payload.tokenVersion !== currentTokenVersion) {
          console.error('❌ Token version mismatch', { 
            tokenVersion: payload.tokenVersion, 
            currentTokenVersion 
          });
          return null;
        }
      } catch (error) {
        console.error('❌ Error checking tokenVersion:', error);
        return null;
      }
    }
    
    const result: TokenVerificationResult = {
      userId: payload.userId,
      exp: expirationTime,
      iat: payload.iat,
      type: payload.type,
      jti: payload.jti
    };
    
    const endTime = Date.now();
    console.log('✅ Token verified successfully', { 
      userId: result.userId, 
      type: result.type,
      verificationTime: `${(endTime - startTime)}ms`
    });
    
    return result;
    
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

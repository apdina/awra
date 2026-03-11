import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';
import { logAdminAction, getClientIp } from '@/lib/auditLogger';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIP = getClientIP(request);
    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    logger.log('🔐 Admin login attempt from:', clientIP);

    // ✅ NEW: Check if IP is locked out
    const lockoutStatus = await convexClient.query(api.adminLockout.isAdminLockedOut, {
      ipAddress: clientIP,
    });

    if (lockoutStatus.locked) {
      logger.log(`⛔ Admin IP locked out: ${clientIP} for ${lockoutStatus.remainingMinutes} more minutes`);
      
      return NextResponse.json(
        { 
          error: `Too many failed attempts. Try again in ${lockoutStatus.remainingMinutes} minutes.`,
          lockedUntil: lockoutStatus.lockedUntil,
        },
        { status: 429 }
      );
    }

    // Parse and sanitize input
    const body = await request.json();
    let { password } = body;

    // Sanitize password (trim whitespace, limit length)
    if (typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      );
    }

    password = password.trim();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Limit password length to prevent DoS
    if (password.length > 100) {
      return NextResponse.json(
        { error: 'Password too long' },
        { status: 400 }
      );
    }

    try {
      // ✅ FIXED: Verify admin password with bcrypt
      const result = await convexClient.mutation(api.adminAuth.verifyAdminPassword, {
        password,
      });

      if (!result.success) {
        // ✅ NEW: Record failed attempt and check for lockout
        await convexClient.mutation(api.adminLockout.recordFailedAdminLogin, {
          ipAddress: clientIP,
        });

        logger.log('❌ Invalid admin password from:', clientIP);
        
        return NextResponse.json(
          { 
            error: 'Invalid password',
          },
          { status: 401 }
        );
      }

      // ✅ NEW: Record successful login and clear lockout
      await convexClient.mutation(api.adminLockout.recordSuccessfulAdminLogin, {
        ipAddress: clientIP,
      });

      logger.log('✅ Admin login successful from:', clientIP);

      // Create session token
      const sessionToken = result.sessionToken;

      if (!sessionToken) {
        logger.error('❌ No session token returned');
        return NextResponse.json(
          { error: 'Session creation failed' },
          { status: 500 }
        );
      }

      // Set HTTP-only cookie
      const response = NextResponse.json({ 
        success: true,
        message: 'Admin login successful' 
      });

      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });

      return response;
    } catch (convexError: any) {
      // ✅ NEW: Record failed attempt on error
      await convexClient.mutation(api.adminLockout.recordFailedAdminLogin, {
        ipAddress: clientIP,
      });

      logger.error('❌ Convex error:', convexError.message);
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    logger.error('=== ADMIN LOGIN ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

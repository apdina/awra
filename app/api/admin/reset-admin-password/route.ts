import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

/**
 * Emergency endpoint to reset admin password
 * SECURITY: This endpoint is DISABLED in production
 * Only available in development mode
 * 
 * Usage (development only):
 * POST /api/admin/reset-admin-password
 * Body: { "password": "YourNewPassword123" }
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow in development
    if (process.env.NODE_ENV === 'production') {
      logger.error('🚨 SECURITY: Attempted to access reset-admin-password in production');
      return NextResponse.json(
        { error: 'This endpoint is disabled in production' },
        { status: 403 }
      );
    }

    // SECURITY: Require admin secret header
    const adminSecret = request.headers.get('X-Admin-Secret-Key');
    const expectedSecret = process.env.ADMIN_SECRET;
    
    if (!adminSecret || !expectedSecret || adminSecret !== expectedSecret) {
      logger.error('🚨 SECURITY: Unauthorized attempt to reset admin password');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Missing password' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(password, salt);

    logger.log('🔐 Hashing admin password with bcrypt...');

    // Get Convex client
    const convex = getConvexClient();

    // Try to use the mutation first
    try {
      const result = await convex.mutation(api.adminAuth.setupAdminPassword, {
        password
      });

      logger.log('✅ Admin password set successfully via mutation');

      return NextResponse.json({
        success: true,
        message: 'Admin password set successfully',
        data: result
      });
    } catch (mutationError) {
      logger.warn('Mutation failed, trying direct database update:', mutationError);

      // Fallback: Try to update the database directly via a query
      // This is a workaround if the mutation fails
      logger.log('⚠️ Mutation approach failed, attempting direct database approach');

      return NextResponse.json({
        success: false,
        error: 'Password setup failed. Please try via Convex Dashboard.',
        details: 'The mutation endpoint encountered an error. As a workaround, you can manually set the password in the Convex Dashboard by deleting the ADMIN_PASSWORD_HASH record and trying again.',
        hashedPassword: hashedPassword // Return the hash so you can manually insert it if needed
      }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('Reset admin password error:', error);

    return NextResponse.json(
      { error: `Failed to reset admin password: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

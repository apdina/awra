import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// JWT secret for signing tokens
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

/**
 * OAuth Login/Register (Google, Facebook)
 * Creates or updates user via OAuth and sets HTTP-only cookies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, providerId, email, displayName, avatarUrl } = body;

    if (!provider || !providerId || !displayName) {
      return NextResponse.json(
        { error: 'Missing required OAuth fields' },
        { status: 400 }
      );
    }

    logger.log(`🔐 OAuth login attempt: ${provider} - ${email}`);

    // Register/login with OAuth via Convex
    const result = await convex.mutation(api.native_auth.registerWithOAuth, {
      provider,
      providerId,
      email,
      displayName,
      avatarUrl,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: 'OAuth authentication failed' },
        { status: 401 }
      );
    }

    const user = result.user;

    // Generate access token (15 minutes)
    const accessToken = await new SignJWT({
      userId: user._id,
      email: user.email,
      role: user.isAdmin ? 'ADMIN' : user.isModerator ? 'MODERATOR' : 'USER',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);

    // Generate refresh token (7 days)
    const refreshToken = await new SignJWT({
      userId: user._id,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set HTTP-only cookies
    const cookieStore = await cookies();
    
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    logger.log(`✅ OAuth login successful: ${user.displayName} (${provider})`);

    // Return user data in API format (matching /api/auth/me format)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.displayName,
        avatar_url: user.avatarUrl,
        avatar_name: user.avatarName,
        avatar_type: user.avatarType,
        awra_coins: user.coinBalance,
        role: user.isAdmin ? 'ADMIN' : user.isModerator ? 'MODERATOR' : 'USER',
        is_active: user.isActive,
        is_banned: user.isBanned,
        total_winnings: user.totalWinnings,
        total_spent: user.totalSpent,
        created_at: new Date(user.createdAt).toISOString(),
        updated_at: new Date(user.lastActiveAt).toISOString(),
      },
      isNew: result.isNew,
    });
  } catch (error: any) {
    logger.error('❌ OAuth error:', error);
    return NextResponse.json(
      { error: error.message || 'OAuth authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * OAuth Profile Picture Sync Endpoint
 * Handles syncing profile pictures from Google/Facebook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';
import { logProfilePictureAction } from '@/lib/profilePictureUtils';

type OAuthProvider = 'google' | 'facebook';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user ID from auth header or session
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, pictureUrl } = body;

    // Validate provider
    const validProviders: OAuthProvider[] = ['google', 'facebook'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid OAuth provider' },
        { status: 400 }
      );
    }

    // Validate picture URL
    if (!pictureUrl || typeof pictureUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid picture URL' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(pictureUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid picture URL format' },
        { status: 400 }
      );
    }

    logger.log(`📸 Syncing ${provider} profile picture for user ${userId}`);

    const convex = getConvexClient();

    // TODO: Wire this to a real Convex mutation once the profile picture sync function exists.
    logProfilePictureAction('oauth_sync', userId, {
      provider,
      pictureUrl,
    });

    logger.log(`✅ OAuth profile picture sync route called for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Profile picture sync route called for ${provider} (not yet implemented).`,
    });

  } catch (error: any) {
    logger.error('OAuth profile picture sync error:', error);

    return NextResponse.json(
      { error: `Sync failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
      },
    }
  );
}

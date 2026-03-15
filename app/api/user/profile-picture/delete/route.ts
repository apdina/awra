/**
 * Profile Picture Delete Endpoint
 * Handles deleting personal profile pictures
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';
import { logProfilePictureAction } from '@/lib/profilePictureUtils';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user ID from auth header or session
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.log(`🗑️ Deleting profile picture for user ${userId}`);

    const convex = getConvexClient();

    // TODO: Implement profile picture deletion mutation in Convex and call it here.
    // For now, this endpoint returns success for the delete request path.
    logProfilePictureAction('delete', userId);

    logger.log(`✅ Profile picture delete route called for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Profile picture delete endpoint called (not yet wired to backend mutation).',
    });

  } catch (error: any) {
    logger.error('Profile picture delete error:', error);

    return NextResponse.json(
      { error: `Delete failed: ${error?.message || 'Unknown error'}` },
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
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
      },
    }
  );
}

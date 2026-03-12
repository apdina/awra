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

    // Delete profile picture
    const result = await convex.mutation(api.profilePicture.deleteProfilePicture, {
      userId: userId as any,
    });

    logProfilePictureAction('delete', userId);

    logger.log(`✅ Profile picture deleted successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: result,
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

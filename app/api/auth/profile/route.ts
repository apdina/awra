import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';
import { logger } from '@/lib/logger';
import { checkPhotoUploadLimit, recordPhotoUpload } from '@/lib/photoRateLimit';
import {
  logPhotoUpload,
  logPhotoDeletion,
  logPhotoRateLimitExceeded,
  logPhotoSecurityValidationFailed,
} from '@/lib/photoAuditLog';

/**
 * Update user profile
 * Uses access_token from HTTP-only cookie
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { displayName, avatarUrl, avatarName, avatarType, usePhoto, userPhoto } = body;
    
    // Get shared Convex client
    const convexClient = getConvexClient();
    
    // Get current user for rate limiting and audit logging
    let currentUser: any = null;
    try {
      currentUser = await convexClient.query(api.native_auth.getCurrentUserByToken, {
        token: accessToken
      });
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Check photo upload rate limit if uploading a photo
    if (userPhoto && userPhoto !== '') {
      const rateLimit = checkPhotoUploadLimit(currentUser._id);
      
      if (!rateLimit.allowed) {
        const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleString() : 'unknown';
        const errorMsg = `Photo upload limit exceeded. You have used ${rateLimit.uploadsToday}/${5} uploads today. Limit resets at ${resetTime}`;
        
        logger.warn(`Photo upload rate limit exceeded for user ${currentUser._id}`);
        
        // Audit log the rate limit violation
        await logPhotoRateLimitExceeded(
          currentUser._id,
          currentUser.email,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown',
          rateLimit.uploadsToday
        );
        
        return NextResponse.json(
          { error: errorMsg },
          { status: 429 } // Too Many Requests
        );
      }
    }
    
    // If userPhoto is empty string, it means delete - use dedicated deletePhoto mutation
    if (userPhoto === '') {
      const result = await convexClient.mutation(api.native_auth.deletePhoto, {
        token: accessToken,
      });
      
      if (result.success && result.user) {
        // Audit log the photo deletion
        await logPhotoDeletion(
          currentUser._id,
          currentUser.email,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        );
        
        return NextResponse.json({
          success: true,
          user: result.user,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Photo deletion failed' },
          { status: 400 }
        );
      }
    }
    
    // Build mutation args for regular update
    const mutationArgs: any = {
      token: accessToken,
      displayName,
      avatarUrl,
      avatarName,
      avatarType,
      usePhoto,
    };
    
    // Only include userPhoto if it's provided
    if (userPhoto !== undefined) {
      mutationArgs.userPhoto = userPhoto;
    }
    
    // Call Convex mutation with token
    const result = await convexClient.mutation(api.native_auth.updateProfile, mutationArgs);
    
    if (result.success && result.user) {
      // Audit log the profile update
      if (userPhoto) {
        await logPhotoUpload(
          currentUser._id,
          currentUser.email,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        );
        
        // Record the photo upload for rate limiting
        recordPhotoUpload(currentUser._id);
      }
      
      return NextResponse.json({
        success: true,
        user: result.user,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Profile update failed' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Profile update failed' },
      { status: 500 }
    );
  }
}

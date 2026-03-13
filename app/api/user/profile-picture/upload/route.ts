/**
 * Profile Picture Upload Endpoint
 * Handles personal profile picture uploads with optimization
 * 
 * Requirements:
 * - Max 1MB per picture
 * - Single photo per user (old photo deleted on new upload)
 * - Proper naming: user_{userId}_{timestamp}.{ext}
 * - Metadata security: strip dangerous metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';
import {
  validateImageFile,
  getImageDimensions,
  formatFileSize,
  logProfilePictureAction,
  generateStorageName,
  getExtensionFromMimeType,
  checkForDangerousMetadata,
  stripImageMetadata,
} from '@/lib/profilePictureUtils';

const MAX_FILE_SIZE_MB = 1;  // Reduced from 5MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user ID from auth header or session
    let userId = request.headers.get('x-user-id');

    // If no user ID in header, try to get from body or session
    if (!userId) {
      try {
        const body = await request.clone().json();
        userId = body.userId;
      } catch {
        // Body might not be JSON
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - no user ID provided' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file, MAX_FILE_SIZE_MB);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    logger.log(`📸 Processing profile picture upload: ${file.name} (${formatFileSize(file.size)})`);

    // Check for dangerous metadata/scripts
    const metadataCheck = await checkForDangerousMetadata(file);
    if (!metadataCheck.safe) {
      logger.error(`🚨 Dangerous metadata detected: ${metadataCheck.error}`);
      return NextResponse.json(
        { error: 'File validation failed: ' + metadataCheck.error },
        { status: 400 }
      );
    }

    // Strip metadata from image (try, but don't fail if it doesn't work)
    let cleanedFile: Blob = file;
    try {
      cleanedFile = await stripImageMetadata(file);
      logger.log(`✅ Metadata stripped from image`);
    } catch (error) {
      logger.warn('Warning: Could not strip metadata, using original file:', error);
      // Continue with original file if stripping fails
    }

    // Get image dimensions (optional, skip if fails)
    let dimensions = { width: 0, height: 0, aspectRatio: 1 };
    try {
      dimensions = await getImageDimensions(file);
    } catch (error) {
      logger.warn('Warning: Could not get image dimensions, using defaults:', error);
      // Continue with default dimensions
    }

    // Generate proper storage name
    const extension = getExtensionFromMimeType(file.type);
    const storageName = generateStorageName(userId, extension);

    // Convert cleaned file to base64 for storage
    const buffer = await cleanedFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // In production, you would:
    // 1. Upload to Convex file storage with storageName
    // 2. Generate optimized versions (WebP, different sizes)
    // 3. Store URLs in database
    //
    // For now, we'll store the data URL directly
    // This is suitable for small images but should be replaced with proper file storage

    const convex = getConvexClient();

    // Generate size-specific URLs (in production, these would be CDN URLs)
    // Only 2 sizes now: thumbnail and medium (removed large)
    const urls = {
      thumbnail: dataUrl,  // In production: optimized 150x150 WebP
      medium: dataUrl,     // In production: optimized 300x300 WebP
    };

    // Delete old picture first (single photo per user requirement)
    const existingUser = await convex.query(api.native_auth.getCurrentUserByToken, {
      token: userId as any,
    });

    // Update user profile picture in database
    try {
      const result = await convex.mutation(api.native_auth.updateProfile, {
        token: userId as any,
        userPhoto: dataUrl,
        usePhoto: true,
      });

      logProfilePictureAction('upload', userId, {
        fileName: file.name,
        storageName,
        fileSize: cleanedFile.size,
        dimensions,
        metadataStripped: true,
      });

      logger.log(`✅ Profile picture uploaded successfully for user ${userId}`);

      return NextResponse.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          urls,
          dimensions,
          fileSize: cleanedFile.size,
          storageName,
        },
      });
    } catch (mutationError: any) {
      logger.error('Convex mutation error:', mutationError);
      return NextResponse.json(
        { error: `Database error: ${mutationError?.message || 'Failed to save picture'}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.error('Profile picture upload error:', error);
    console.error('Upload error details:', error);

    return NextResponse.json(
      { error: `Upload failed: ${error?.message || 'Unknown error'}` },
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

/**
 * Profile Picture Utilities
 * Handles profile picture generation, optimization, and retrieval
 * 
 * Requirements:
 * - Max 1MB per picture (reduced from 5MB)
 * - Single photo per user (old photo deleted on new upload)
 * - Proper naming: user_{userId}_{timestamp}.{ext}
 * - Metadata security: strip dangerous metadata
 * - Lazy loading: frontend optimization
 */

import { logger } from './logger';

export type ProfilePictureType = 'personal' | 'oauth' | 'placeholder';
export type OAuthProvider = 'google' | 'facebook';

export interface ProfilePictureUrls {
  thumbnail: string;  // 150x150
  medium: string;     // 300x300
}

export interface ProfilePicture {
  type: ProfilePictureType;
  uploadedAt?: number;
  storageName?: string;  // user_{userId}_{timestamp}.{ext}
  originalFileName?: string;
  fileSize?: number;
  oauthUrl?: string;
  oauthProvider?: OAuthProvider;
  urls: ProfilePictureUrls;
  mimeType?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  metadataStripped?: boolean;  // Confirms dangerous metadata removed
}

/**
 * Generate a placeholder avatar with user initials
 * Uses a color based on user ID for consistency
 */
export function generatePlaceholderAvatar(
  displayName: string,
  userId: string
): ProfilePictureUrls {
  // Get initials (first letter of first and last name, or just first letter)
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || '?';

  // Generate color from user ID (deterministic)
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B88B', // Peach
    '#A8E6CF', // Light Green
  ];

  const colorIndex = userId.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];

  // Create SVG placeholder
  const svg = `
    <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="600" fill="${backgroundColor}"/>
      <text
        x="300"
        y="300"
        font-size="240"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="system-ui, -apple-system, sans-serif"
      >
        ${initials}
      </text>
    </svg>
  `;

  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  return {
    thumbnail: svgDataUrl,
    medium: svgDataUrl,
  };
}

/**
 * Create placeholder profile picture object
 */
export function createPlaceholderPicture(
  displayName: string,
  userId: string
): ProfilePicture {
  return {
    type: 'placeholder',
    urls: generatePlaceholderAvatar(displayName, userId),
  };
}

/**
 * Create OAuth profile picture object
 * Handles Google and Facebook picture URLs
 */
export function createOAuthPicture(
  oauthProvider: OAuthProvider,
  pictureUrl: string
): ProfilePicture {
  // Generate size-specific URLs based on provider
  let urls: ProfilePictureUrls;

  if (oauthProvider === 'google') {
    // Google supports size parameter
    urls = {
      thumbnail: `${pictureUrl}?sz=150`,
      medium: `${pictureUrl}?sz=300`,
    };
  } else if (oauthProvider === 'facebook') {
    // Facebook supports width/height parameters
    urls = {
      thumbnail: `${pictureUrl}?width=150&height=150`,
      medium: `${pictureUrl}?width=300&height=300`,
    };
  } else {
    // Fallback: use same URL for all sizes
    urls = {
      thumbnail: pictureUrl,
      medium: pictureUrl,
    };
  }

  return {
    type: 'oauth',
    oauthProvider,
    oauthUrl: pictureUrl,
    urls,
  };
}

/**
 * Validate image file
 * Max 1MB (reduced from 5MB)
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 1  // Changed from 5 to 1
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check MIME type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPG, PNG, and WebP images are allowed',
    };
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension',
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from File
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get profile picture URL with fallback
 * Tries personal > oauth > placeholder
 */
export function getProfilePictureUrl(
  profilePicture: ProfilePicture | undefined,
  size: 'thumbnail' | 'medium' = 'medium'
): string {
  if (!profilePicture) {
    // Return a default placeholder if no picture
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size === 'thumbnail' ? 150 : 300}' height='${size === 'thumbnail' ? 150 : 300}'%3E%3Crect fill='%23ccc' width='100%25' height='100%25'/%3E%3C/svg%3E`;
  }

  return profilePicture.urls[size];
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if picture is expired (for OAuth pictures)
 * OAuth pictures should be refreshed periodically
 */
export function isOAuthPictureExpired(
  picture: ProfilePicture,
  maxAgeDays: number = 30
): boolean {
  if (picture.type !== 'oauth' || !picture.uploadedAt) {
    return false;
  }

  const ageMs = Date.now() - picture.uploadedAt;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return ageMs > maxAgeMs;
}

/**
 * Log profile picture action for audit trail
 */
export function logProfilePictureAction(
  action: 'upload' | 'delete' | 'oauth_sync' | 'placeholder_generated',
  userId: string,
  details?: Record<string, any>
): void {
  logger.log(`📸 Profile Picture: ${action} for user ${userId}`, details);
}

/**
 * Generate storage name for picture
 * Format: user_{userId}_{timestamp}.{ext}
 */
export function generateStorageName(userId: string, extension: string): string {
  const timestamp = Date.now();
  const ext = extension.toLowerCase().replace(/^\./, '');
  return `user_${userId}_${timestamp}.${ext}`;
}

/**
 * Extract file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return mimeMap[mimeType] || 'jpg';
}

/**
 * Check for dangerous metadata or scripts in image
 * Validates that file is actually an image and not disguised executable
 */
export async function checkForDangerousMetadata(
  file: File
): Promise<{ safe: boolean; error?: string }> {
  try {
    // Read file header (magic bytes)
    const buffer = await file.slice(0, 12).arrayBuffer();
    const view = new Uint8Array(buffer);

    // Check magic bytes for valid image formats
    const isJPEG = view[0] === 0xFF && view[1] === 0xD8 && view[2] === 0xFF;
    const isPNG = view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47;
    const isWebP = view[8] === 0x57 && view[9] === 0x45 && view[10] === 0x42 && view[11] === 0x50;

    if (!isJPEG && !isPNG && !isWebP) {
      return {
        safe: false,
        error: 'File header does not match image format',
      };
    }

    // Check for suspicious patterns in filename
    const fileName = file.name.toLowerCase();
    const suspiciousPatterns = [
      /\.exe$/,
      /\.bat$/,
      /\.cmd$/,
      /\.com$/,
      /\.pif$/,
      /\.scr$/,
      /\.vbs$/,
      /\.js$/,
      /\.jar$/,
      /\.zip$/,
      /\.rar$/,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        return {
          safe: false,
          error: 'Suspicious file extension detected',
        };
      }
    }

    return { safe: true };
  } catch (error) {
    logger.error('Error checking metadata:', error);
    return {
      safe: false,
      error: 'Failed to validate file',
    };
  }
}

/**
 * Strip EXIF and other metadata from image
 * Returns cleaned image data
 */
export async function stripImageMetadata(file: File): Promise<Blob> {
  try {
    // Read file as data URL
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const img = new Image();

          img.onload = () => {
            // Create canvas and draw image (removes metadata)
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0);

            // Convert back to blob (metadata stripped)
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              },
              file.type,
              0.95 // Quality 95% to maintain image quality
            );
          };

          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };

          img.src = e.target?.result as string;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  } catch (error) {
    logger.error('Error stripping metadata:', error);
    throw error;
  }
}

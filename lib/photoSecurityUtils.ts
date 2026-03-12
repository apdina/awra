/**
 * Photo Security Utilities
 * Handles magic byte verification, dimension validation, and security checks
 */

// Magic bytes for supported image formats
const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
};

/**
 * Verify image magic bytes to ensure file is actually an image
 * Prevents uploading files with wrong extensions
 */
export function verifyImageMagicBytes(base64Data: string): {
  valid: boolean;
  format?: string;
  error?: string;
} {
  try {
    // Extract the data part (after "data:image/...;base64,")
    const base64String = base64Data.split(',')[1];
    if (!base64String) {
      return { valid: false, error: 'Invalid base64 format' };
    }

    // Convert base64 to bytes
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check JPEG magic bytes
    if (
      bytes[0] === MAGIC_BYTES.jpeg[0] &&
      bytes[1] === MAGIC_BYTES.jpeg[1] &&
      bytes[2] === MAGIC_BYTES.jpeg[2]
    ) {
      return { valid: true, format: 'jpeg' };
    }

    // Check PNG magic bytes
    if (
      bytes[0] === MAGIC_BYTES.png[0] &&
      bytes[1] === MAGIC_BYTES.png[1] &&
      bytes[2] === MAGIC_BYTES.png[2] &&
      bytes[3] === MAGIC_BYTES.png[3]
    ) {
      return { valid: true, format: 'png' };
    }

    // Check WebP magic bytes (RIFF....WEBP)
    if (
      bytes[0] === MAGIC_BYTES.webp[0] &&
      bytes[1] === MAGIC_BYTES.webp[1] &&
      bytes[2] === MAGIC_BYTES.webp[2] &&
      bytes[3] === MAGIC_BYTES.webp[3] &&
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    ) {
      return { valid: true, format: 'webp' };
    }

    return { valid: false, error: 'Invalid image format. Only JPEG, PNG, and WebP are supported.' };
  } catch (error) {
    return { valid: false, error: 'Failed to verify image format' };
  }
}

/**
 * Get image dimensions from base64 data
 * Returns width and height of the image
 */
export async function getImageDimensions(base64Data: string): Promise<{
  width: number;
  height: number;
} | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = base64Data;
  });
}

/**
 * Validate image dimensions
 * Ensures image is not too large (max 2000x2000)
 */
export async function validateImageDimensions(
  base64Data: string,
  maxWidth: number = 2000,
  maxHeight: number = 2000
): Promise<{
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
}> {
  try {
    const dimensions = await getImageDimensions(base64Data);

    if (!dimensions) {
      return { valid: false, error: 'Failed to read image dimensions' };
    }

    if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
      return {
        valid: false,
        width: dimensions.width,
        height: dimensions.height,
        error: `Image dimensions (${dimensions.width}x${dimensions.height}) exceed maximum allowed (${maxWidth}x${maxHeight})`,
      };
    }

    return { valid: true, width: dimensions.width, height: dimensions.height };
  } catch (error) {
    return { valid: false, error: 'Failed to validate image dimensions' };
  }
}

/**
 * Comprehensive photo validation
 * Checks magic bytes, dimensions, and file size
 */
export async function validatePhotoSecurity(
  base64Data: string,
  maxSizeBytes: number = 1024 * 1024, // 1MB default
  maxWidth: number = 2000,
  maxHeight: number = 2000
): Promise<{
  valid: boolean;
  format?: string;
  width?: number;
  height?: number;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check magic bytes
  const magicBytesCheck = verifyImageMagicBytes(base64Data);
  if (!magicBytesCheck.valid) {
    errors.push(magicBytesCheck.error || 'Invalid image format');
  }

  // Check file size (base64 is ~33% larger than binary)
  const base64String = base64Data.split(',')[1] || '';
  const estimatedSize = (base64String.length * 3) / 4;
  if (estimatedSize > maxSizeBytes) {
    errors.push(`File size (${Math.round(estimatedSize / 1024)}KB) exceeds maximum (${Math.round(maxSizeBytes / 1024)}KB)`);
  }

  // Check dimensions
  const dimensionsCheck = await validateImageDimensions(base64Data, maxWidth, maxHeight);
  if (!dimensionsCheck.valid) {
    errors.push(dimensionsCheck.error || 'Invalid image dimensions');
  }

  return {
    valid: errors.length === 0,
    format: magicBytesCheck.format,
    width: dimensionsCheck.width,
    height: dimensionsCheck.height,
    errors,
  };
}

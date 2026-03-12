/**
 * Photo Upload Rate Limiting
 * Limits users to 5 photo uploads per day
 */

interface PhotoUploadRecord {
  userId: string;
  timestamp: number;
}

// In-memory store for rate limiting (in production, use Redis or database)
const photoUploadHistory: Map<string, PhotoUploadRecord[]> = new Map();

const UPLOADS_PER_DAY = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Check if user has exceeded daily photo upload limit
 */
export function checkPhotoUploadLimit(userId: string): {
  allowed: boolean;
  uploadsToday: number;
  uploadsRemaining: number;
  resetTime?: number;
} {
  const now = Date.now();
  const dayAgo = now - DAY_IN_MS;

  // Get or create upload history for user
  let uploads = photoUploadHistory.get(userId) || [];

  // Filter uploads from last 24 hours
  uploads = uploads.filter((record) => record.timestamp > dayAgo);

  // Update history
  photoUploadHistory.set(userId, uploads);

  const uploadsToday = uploads.length;
  const allowed = uploadsToday < UPLOADS_PER_DAY;
  const uploadsRemaining = Math.max(0, UPLOADS_PER_DAY - uploadsToday);

  // Calculate reset time (when oldest upload expires)
  let resetTime: number | undefined;
  if (uploads.length > 0) {
    resetTime = uploads[0].timestamp + DAY_IN_MS;
  }

  return {
    allowed,
    uploadsToday,
    uploadsRemaining,
    resetTime,
  };
}

/**
 * Record a photo upload for rate limiting
 */
export function recordPhotoUpload(userId: string): void {
  const uploads = photoUploadHistory.get(userId) || [];
  uploads.push({
    userId,
    timestamp: Date.now(),
  });
  photoUploadHistory.set(userId, uploads);
}

/**
 * Get upload statistics for a user
 */
export function getPhotoUploadStats(userId: string): {
  uploadsToday: number;
  uploadsRemaining: number;
  nextResetTime: number | null;
} {
  const now = Date.now();
  const dayAgo = now - DAY_IN_MS;

  let uploads = photoUploadHistory.get(userId) || [];
  uploads = uploads.filter((record) => record.timestamp > dayAgo);

  const uploadsToday = uploads.length;
  const uploadsRemaining = Math.max(0, UPLOADS_PER_DAY - uploadsToday);
  const nextResetTime = uploads.length > 0 ? uploads[0].timestamp + DAY_IN_MS : null;

  return {
    uploadsToday,
    uploadsRemaining,
    nextResetTime,
  };
}

/**
 * Clean up old records (call periodically)
 */
export function cleanupOldRecords(): void {
  const now = Date.now();
  const dayAgo = now - DAY_IN_MS;

  for (const [userId, uploads] of photoUploadHistory.entries()) {
    const filtered = uploads.filter((record) => record.timestamp > dayAgo);
    if (filtered.length === 0) {
      photoUploadHistory.delete(userId);
    } else {
      photoUploadHistory.set(userId, filtered);
    }
  }
}

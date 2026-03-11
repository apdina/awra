/**
 * Room Helper Functions
 * 
 * Utility functions for room ID handling and validation
 */

/**
 * Validate room ID format
 * Ensures room IDs follow expected patterns
 */
export function validateRoomId(roomId: string): boolean {
  // Allow: "global", "draw_*", "private_*"
  const validPatterns = [
    /^global$/,
    /^draw_[a-zA-Z0-9_-]+$/,
    /^private_[a-zA-Z0-9_-]+$/,
  ];

  return validPatterns.some((pattern) => pattern.test(roomId));
}

/**
 * Create room ID for draw
 */
export function createDrawRoomId(drawId: string): string {
  return `draw_${drawId}`;
}

/**
 * Create room ID for private chat
 */
export function createPrivateRoomId(roomId: string): string {
  return `private_${roomId}`;
}

/**
 * Extract draw ID from room ID
 */
export function extractDrawIdFromRoomId(roomId: string): string | null {
  const match = roomId.match(/^draw_(.+)$/);
  return match ? match[1] : null;
}

/**
 * Extract private room ID from room ID
 */
export function extractPrivateRoomIdFromRoomId(roomId: string): string | null {
  const match = roomId.match(/^private_(.+)$/);
  return match ? match[1] : null;
}

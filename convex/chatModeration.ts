/**
 * Chat Moderation - Helper Functions
 * 
 * Profanity filter and spam detection utilities
 */

// Simple profanity list (expand as needed)
const PROFANITY_LIST = [
  "badword1",
  "badword2",
  // Add more as needed
];

// Check if message contains profanity
export function containsProfanity(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return PROFANITY_LIST.some(word => lowerMessage.includes(word));
}

// Detect spam patterns
export function isSpam(message: string, recentMessages: string[]): boolean {
  // Check for repeated identical messages
  const identicalCount = recentMessages.filter(msg => msg === message).length;
  if (identicalCount >= 3) {
    return true;
  }

  // Check for excessive caps
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.7 && message.length > 10) {
    return true;
  }

  // Check for excessive repeated characters
  if (/(.)\1{5,}/.test(message)) {
    return true;
  }

  return false;
}

/**
 * Input sanitization utilities for preventing XSS and injection attacks
 */

/**
 * Sanitizes text content for safe display in HTML
 * Removes potentially dangerous characters and scripts
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    // Remove HTML tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove potentially dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitizes username according to specific rules
 * Allows only alphanumeric characters, underscores, and hyphens
 */
export function sanitizeUsername(username: string | null | undefined): string {
  if (!username) return '';
  
  return username
    // Remove HTML tags and special characters
    .replace(/<[^>]*>/g, '')
    // Allow only alphanumeric, underscore, hyphen, and spaces
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim and limit length
    .trim()
    .substring(0, 50);
}

/**
 * Sanitizes email address for display
 * Shows only partial email for privacy
 */
export function sanitizeEmailForDisplay(email: string | null | undefined): string {
  if (!email) return '';
  
  // Basic sanitization
  const cleanEmail = sanitizeText(email);
  
  // Show only first 2 characters and domain for privacy
  const [username, domain] = cleanEmail.split('@');
  if (!domain) return cleanEmail;
  
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '***' 
    : username;
  
  return `${maskedUsername}@${domain}`;
}

/**
 * Sanitizes user data object for safe rendering
 */
export function sanitizeUserData(userData: any): any {
  if (!userData || typeof userData !== 'object') {
    return userData;
  }
  
  const sanitized = { ...userData };
  
  // Sanitize string fields
  if (sanitized.username) {
    sanitized.username = sanitizeUsername(sanitized.username);
  }
  
  if (sanitized.email) {
    // Keep original email for forms, but sanitize for display
    sanitized.email = sanitizeText(sanitized.email);
    sanitized.displayEmail = sanitizeEmailForDisplay(sanitized.email);
  }
  
  if (sanitized.first_name) {
    sanitized.first_name = sanitizeText(sanitized.first_name);
  }
  
  if (sanitized.last_name) {
    sanitized.last_name = sanitizeText(sanitized.last_name);
  }
  
  if (sanitized.bio) {
    sanitized.bio = sanitizeText(sanitized.bio);
  }
  
  // Ensure numeric fields are actually numbers
  if (sanitized.awra_coins !== undefined) {
    sanitized.awra_coins = Math.max(0, Number(sanitized.awra_coins) || 0);
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes URL for safe use
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    // Remove dangerous protocols
    const cleanUrl = url.replace(/javascript:/gi, '').replace(/data:/gi, '').replace(/vbscript:/gi, '');
    
    // Validate URL format
    const parsed = new URL(cleanUrl);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitizes CSS class names
 */
export function sanitizeCssClass(className: string | null | undefined): string {
  if (!className) return '';
  
  return className
    // Remove anything that's not a valid CSS class character
    .replace(/[^a-zA-Z0-9_\-]/g, '')
    // Convert to lowercase (common convention)
    .toLowerCase();
}

/**
 * Creates a safe display name from user data
 */
export function createSafeDisplayName(user: any): string {
  if (!user) return 'Anonymous User';
  
  const sanitized = sanitizeUserData(user);
  
  if (sanitized.username) {
    return sanitized.username;
  }
  
  if (sanitized.first_name || sanitized.last_name) {
    return `${sanitized.first_name || ''} ${sanitized.last_name || ''}`.trim();
  }
  
  if (sanitized.email) {
    return sanitized.displayEmail || sanitized.email.split('@')[0];
  }
  
  return 'User';
}

import { v } from "convex/values";

// Security validation functions for chat inputs

// Detect suspicious patterns and potential injections
export function detectSuspiciousContent(content: string): {
  isSuspicious: boolean;
  threats: string[];
  riskLevel: "low" | "medium" | "high";
} {
  const threats: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  // Check for script injection patterns
  const scriptPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
  ];

  scriptPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      threats.push("Script injection attempt");
      riskLevel = "high";
    }
  });

  // Check for HTML injection
  const htmlPatterns = [
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /<style[^>]*>/gi,
  ];

  htmlPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      threats.push("HTML injection attempt");
      if (riskLevel === "low") riskLevel = "medium";
    }
  });

  // Check for SQL injection patterns
  const sqlPatterns = [
    /\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|MERGE|SELECT|UPDATE|UNION)\b/gi,
    /\b(OR|AND)\b\s+\d+\s*=\s*\d+/gi,
    /\b(OR|AND)\b\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/gi,
    /[;|\\|\\-\\-]/g, // Command separators
  ];

  sqlPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      threats.push("SQL injection attempt");
      riskLevel = "high";
    }
  });

  // Check for XSS payload patterns
  const xssPatterns = [
    /<img[^>]*src[^>]*javascript:/gi,
    /<body[^>]*onload/gi,
    /<svg[^>]*onload/gi,
    /data:text\/html/gi,
    /data:image\/svg\+xml/gi,
  ];

  xssPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      threats.push("XSS payload detected");
      riskLevel = "high";
    }
  });

  // Check for command injection
  const commandPatterns = [
    /\$\(/g, // Command substitution
    /`[^`]*`/g, // Backticks
    /\|\s*(cat|ls|dir|rm|del|format|shutdown|reboot)/gi,
    /;\s*(cat|ls|dir|rm|del|format|shutdown|reboot)/gi,
    /&&\s*(cat|ls|dir|rm|del|format|shutdown|reboot)/gi,
  ];

  commandPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      threats.push("Command injection attempt");
      riskLevel = "high";
    }
  });

  // Check for path traversal
  const pathTraversalPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e\//gi,
    /%2e%2e\\/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
  ];

  pathTraversalPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      threats.push("Path traversal attempt");
      if (riskLevel === "low") riskLevel = "medium";
    }
  });

  // Check for excessive length (potential DoS)
  if (content.length > 1000) {
    threats.push("Excessive content length");
    if (riskLevel === "low") riskLevel = "medium";
  }

  // Check for too many URLs (potential spam)
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount > 3) {
    threats.push("Excessive URLs");
    if (riskLevel === "low") riskLevel = "medium";
  }

  // Check for suspicious Unicode characters
  const suspiciousUnicode = /[\u2000-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF9-\uFFFC]/g;
  if (suspiciousUnicode.test(content)) {
    threats.push("Suspicious Unicode characters");
    if (riskLevel === "low") riskLevel = "medium";
  }

  return {
    isSuspicious: threats.length > 0,
    threats,
    riskLevel,
  };
}

// Advanced content sanitization
export function sanitizeContent(content: string): string {
  if (!content) return "";

  return content
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    
    // Normalize Unicode
    .normalize('NFKC')
    
    // Remove dangerous HTML tags
    .replace(/<(script|iframe|object|embed|form|input|button|link|meta|style)[^>]*>/gi, "")
    .replace(/<\/(script|iframe|object|embed|form|input|button|link|meta|style)>/gi, "")
    
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, "")
    
    // Remove JavaScript event handlers
    .replace(/\bon\w+\s*=/gi, "")
    
    // Remove dangerous protocols
    .replace(/(javascript|vbscript|data|file|ftp):/gi, "")
    
    // Remove CSS expressions and imports
    .replace(/expression\s*\(/gi, "")
    .replace(/@import/i, "")
    .replace(/binding\s*:/gi, "")
    
    // Remove suspicious Unicode characters
    .replace(/[\u2000-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF9-\uFFFC]/g, "")
    
    // Normalize whitespace
    .replace(/\s+/g, " ")
    
    // Remove excessive repeated characters (potential DoS)
    .replace(/(.)\1{20,}/g, "$1".repeat(5))
    
    // Trim and limit length
    .trim()
    .substring(0, 500);
}

// Validate room ID format
export function validateRoomId(roomId: string): boolean {
  // Allow alphanumeric, hyphens, underscores, and specific room types
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(roomId) && roomId.length <= 50;
}

// Rate limiting validation
export function checkRateLimitWindow(
  timestamps: number[], 
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 10
): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (recentTimestamps.length >= maxRequests) {
    const oldestTimestamp = Math.min(...recentTimestamps);
    const remainingTime = windowMs - (now - oldestTimestamp);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

// Content validation schema
export const contentValidationSchema = {
  minLength: 1,
  maxLength: 500,
  allowedChars: /^[a-zA-Z0-9\s\p{P}\p{S}.,!?@#$%^&*()_+-=[\]{}|;:'"<>~`]*$/u,
  forbiddenPatterns: [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ],
};

/**
 * Error Sanitizer
 * 
 * Sanitizes error messages to prevent information disclosure
 * - Removes stack traces
 * - Removes file paths
 * - Removes line numbers
 * - Provides user-friendly messages
 */

export interface SanitizedError {
  userMessage: string;
  statusCode: number;
  logMessage: string;
}

/**
 * Sanitize error messages from Convex or other services
 * Returns user-friendly message and appropriate status code
 */
export function sanitizeError(error: any, context: string = 'Operation'): SanitizedError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Log the full error for debugging
  const logMessage = `${context} error: ${errorMessage}`;
  
  // Default response
  let userMessage = `${context} failed. Please try again.`;
  let statusCode = 500;

  // Authentication errors
  if (errorMessage.includes('not authenticated') || errorMessage.includes('invalid token')) {
    userMessage = 'Authentication failed. Please log in again.';
    statusCode = 401;
  }
  // Password errors
  else if (errorMessage.includes('Current password is incorrect')) {
    userMessage = 'Current password is incorrect.';
    statusCode = 400;
  }
  else if (errorMessage.includes('Password must be')) {
    userMessage = 'New password does not meet requirements.';
    statusCode = 400;
  }
  // Email errors
  else if (errorMessage.includes('Email already')) {
    userMessage = 'This email is already registered.';
    statusCode = 400;
  }
  else if (errorMessage.includes('Invalid email')) {
    userMessage = 'Please enter a valid email address.';
    statusCode = 400;
  }
  // Username errors
  else if (errorMessage.includes('username') || errorMessage.includes('display name')) {
    userMessage = 'This username is already taken.';
    statusCode = 400;
  }
  // Account status errors
  else if (errorMessage.includes('Account temporarily locked')) {
    userMessage = 'Your account is temporarily locked. Please try again later.';
    statusCode = 429;
  }
  else if (errorMessage.includes('Account banned')) {
    userMessage = 'Your account has been banned.';
    statusCode = 403;
  }
  else if (errorMessage.includes('Account is inactive')) {
    userMessage = 'Your account is inactive. Please contact support.';
    statusCode = 403;
  }
  // Rate limit errors
  else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    userMessage = 'Too many attempts. Please try again later.';
    statusCode = 429;
  }
  // Validation errors
  else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    userMessage = 'Invalid input. Please check your data and try again.';
    statusCode = 400;
  }
  // Not found errors
  else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    userMessage = 'Resource not found.';
    statusCode = 404;
  }
  // Conflict errors
  else if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
    userMessage = 'This resource already exists.';
    statusCode = 409;
  }

  return {
    userMessage,
    statusCode,
    logMessage,
  };
}

/**
 * Extract safe error details for logging
 * Removes sensitive information like stack traces and file paths
 */
export function extractSafeErrorDetails(error: any): Record<string, any> {
  if (!error) return {};

  const details: Record<string, any> = {};

  // Extract message without stack trace
  if (error.message) {
    // Remove file paths and line numbers
    const cleanMessage = error.message
      .replace(/\(.*?\/.*?\.\w+:\d+:\d+\)/g, '') // Remove (path/file.ts:line:col)
      .replace(/at .*?\s\(/g, '') // Remove "at function ("
      .replace(/\[Request ID:.*?\]/g, '') // Remove request IDs
      .trim();
    
    details.message = cleanMessage;
  }

  // Extract error code if available
  if (error.code) {
    details.code = error.code;
  }

  // Extract status if available
  if (error.status) {
    details.status = error.status;
  }

  return details;
}

/**
 * Create a safe error response for API routes
 */
export function createErrorResponse(error: any, context: string = 'Operation') {
  const sanitized = sanitizeError(error, context);
  
  return {
    error: sanitized.userMessage,
    statusCode: sanitized.statusCode,
    logMessage: sanitized.logMessage,
  };
}

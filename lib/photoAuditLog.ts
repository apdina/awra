/**
 * Photo Audit Logging
 * Simple wrapper for logging photo-related security events
 */

import { logger } from '@/lib/logger';

export interface PhotoAuditEvent {
  eventType: 'PHOTO_UPLOADED' | 'PHOTO_DELETED' | 'PHOTO_UPLOAD_RATE_LIMIT_EXCEEDED' | 'PHOTO_SECURITY_VALIDATION_FAILED';
  status: 'success' | 'blocked' | 'failed';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Log photo-related security events
 * In production, these should be sent to a proper audit logging system
 */
export async function auditLog(event: PhotoAuditEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    // Log to console/logger
    const logMessage = `[AUDIT] ${event.eventType} - ${event.message}`;
    
    if (event.severity === 'critical' || event.severity === 'error') {
      logger.error(logMessage, {
        status: event.status,
        userId: event.userId,
        email: event.email,
        ipAddress: event.ipAddress,
        details: event.details,
      });
    } else if (event.severity === 'warning') {
      logger.warn(logMessage, {
        status: event.status,
        userId: event.userId,
        email: event.email,
        ipAddress: event.ipAddress,
        details: event.details,
      });
    } else {
      logger.log(logMessage, {
        status: event.status,
        userId: event.userId,
        email: event.email,
        ipAddress: event.ipAddress,
        details: event.details,
      });
    }

    // TODO: In production, send to proper audit logging system
    // - Convex auditLogs table
    // - External logging service (e.g., Datadog, Splunk)
    // - SIEM system
    
    // Example for Convex:
    // const convexClient = getConvexClient();
    // await convexClient.mutation(api.auditLog.create, {
    //   eventType: event.eventType,
    //   status: event.status,
    //   message: event.message,
    //   severity: event.severity,
    //   userId: event.userId,
    //   email: event.email,
    //   ipAddress: event.ipAddress,
    //   userAgent: event.userAgent,
    //   details: event.details,
    //   timestamp: Date.now(),
    // });

  } catch (error) {
    logger.error('Failed to log audit event:', error);
    // Don't throw - audit logging failure shouldn't break the app
  }
}

/**
 * Log photo upload event
 */
export async function logPhotoUpload(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  details?: { format?: string; width?: number; height?: number }
): Promise<void> {
  await auditLog({
    eventType: 'PHOTO_UPLOADED',
    status: 'success',
    message: `User ${email} uploaded a new profile photo`,
    severity: 'info',
    userId,
    email,
    ipAddress,
    userAgent,
    details,
  });
}

/**
 * Log photo deletion event
 */
export async function logPhotoDeletion(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog({
    eventType: 'PHOTO_DELETED',
    status: 'success',
    message: `User ${email} deleted their profile photo`,
    severity: 'info',
    userId,
    email,
    ipAddress,
    userAgent,
  });
}

/**
 * Log rate limit exceeded event
 */
export async function logPhotoRateLimitExceeded(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  uploadsToday: number
): Promise<void> {
  await auditLog({
    eventType: 'PHOTO_UPLOAD_RATE_LIMIT_EXCEEDED',
    status: 'blocked',
    message: `User ${email} exceeded daily photo upload limit (${uploadsToday}/5)`,
    severity: 'warning',
    userId,
    email,
    ipAddress,
    userAgent,
    details: { uploadsToday, limit: 5 },
  });
}

/**
 * Log security validation failure
 */
export async function logPhotoSecurityValidationFailed(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  errors: string[]
): Promise<void> {
  await auditLog({
    eventType: 'PHOTO_SECURITY_VALIDATION_FAILED',
    status: 'failed',
    message: `Photo security validation failed for user ${email}: ${errors.join('; ')}`,
    severity: 'warning',
    userId,
    email,
    ipAddress,
    userAgent,
    details: { errors },
  });
}

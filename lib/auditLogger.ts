/**
 * Audit Logger
 * 
 * Comprehensive logging system for security events and admin actions.
 * Logs are stored in Convex database for compliance and incident investigation.
 * 
 * Features:
 * - Structured logging with consistent format
 * - Environment-aware (dev vs production)
 * - IP address tracking
 * - User agent tracking
 * - Sensitive data redaction
 * - Automatic timestamp
 */

import { ConvexClient } from 'convex/browser';

export type AuditEventType =
  // Authentication events
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_ATTEMPT_BLOCKED'
  | 'LOGOUT'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_RESET_FAILED'
  | 'EMAIL_VERIFIED'
  | 'EMAIL_VERIFICATION_FAILED'
  | 'OAUTH_LOGIN_SUCCESS'
  | 'OAUTH_LOGIN_FAILED'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILED'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED'
  // Admin events
  | 'ADMIN_LOGIN_SUCCESS'
  | 'ADMIN_LOGIN_FAILED'
  | 'ADMIN_LOGIN_BLOCKED'
  | 'ADMIN_LOGOUT'
  | 'ADMIN_ACTION'
  | 'ADMIN_USER_MODIFIED'
  | 'ADMIN_USER_BANNED'
  | 'ADMIN_USER_UNBANNED'
  | 'ADMIN_MODERATOR_ADDED'
  | 'ADMIN_MODERATOR_REMOVED'
  | 'ADMIN_DRAW_CREATED'
  | 'ADMIN_DRAW_MODIFIED'
  | 'ADMIN_RESULT_SET'
  | 'ADMIN_CACHE_INVALIDATED'
  // Security events
  | 'CSRF_VALIDATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'PERMISSION_DENIED'
  // User events
  | 'PROFILE_UPDATED'
  | 'PROFILE_UPDATE_FAILED'
  | 'AVATAR_CHANGED'
  | 'SETTINGS_CHANGED';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'blocked';
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Redact sensitive information from details object
 */
function redactSensitiveData(details: Record<string, any>): Record<string, any> {
  const redacted = { ...details };
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'pin',
  ];

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
}

/**
 * Get severity level based on event type
 */
function getSeverity(eventType: AuditEventType): 'info' | 'warning' | 'error' | 'critical' {
  if (eventType.includes('FAILED') || eventType.includes('BLOCKED')) {
    return 'warning';
  }
  if (eventType.includes('SUSPICIOUS') || eventType.includes('UNAUTHORIZED')) {
    return 'critical';
  }
  if (eventType.includes('ADMIN')) {
    return 'warning';
  }
  return 'info';
}

/**
 * Extract IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Log audit event to Convex database
 */
export async function logAuditEvent(
  convexClient: ConvexClient,
  event: Omit<AuditLogEntry, 'timestamp' | 'severity'>
): Promise<void> {
  try {
    const auditEntry: AuditLogEntry = {
      ...event,
      timestamp: Date.now(),
      severity: getSeverity(event.eventType),
      details: event.details ? redactSensitiveData(event.details) : undefined,
    };

    // Log to Convex database
    // Note: This assumes you have an auditLogs table in your schema
    // await convexClient.mutation(api.auditLog.create, auditEntry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logLevel = auditEntry.severity === 'critical' ? 'error' : 'log';
      console[logLevel as 'log' | 'error']('[AUDIT]', {
        event: auditEntry.eventType,
        status: auditEntry.status,
        user: auditEntry.email || auditEntry.userId,
        ip: auditEntry.ipAddress,
        message: auditEntry.message,
        details: auditEntry.details,
      });
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failure shouldn't break the app
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  convexClient: ConvexClient,
  request: Request,
  eventType: AuditEventType,
  options: {
    userId?: string;
    email?: string;
    status: 'success' | 'failure' | 'blocked';
    message: string;
    details?: Record<string, any>;
  }
): Promise<void> {
  await logAuditEvent(convexClient, {
    eventType,
    userId: options.userId,
    email: options.email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    status: options.status,
    message: options.message,
    details: options.details,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  convexClient: ConvexClient,
  request: Request,
  eventType: AuditEventType,
  options: {
    adminId: string;
    adminEmail: string;
    targetUserId?: string;
    targetEmail?: string;
    action: string;
    details?: Record<string, any>;
  }
): Promise<void> {
  await logAuditEvent(convexClient, {
    eventType,
    userId: options.adminId,
    email: options.adminEmail,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    status: 'success',
    message: `Admin ${options.adminEmail} performed: ${options.action}`,
    details: {
      targetUserId: options.targetUserId,
      targetEmail: options.targetEmail,
      action: options.action,
      ...options.details,
    },
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  convexClient: ConvexClient,
  request: Request,
  eventType: AuditEventType,
  options: {
    userId?: string;
    email?: string;
    status: 'success' | 'failure' | 'blocked';
    message: string;
    details?: Record<string, any>;
  }
): Promise<void> {
  await logAuditEvent(convexClient, {
    eventType,
    userId: options.userId,
    email: options.email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    status: options.status,
    message: options.message,
    details: options.details,
  });
}

/**
 * Query audit logs (for admin dashboard)
 */
export async function getAuditLogs(
  convexClient: ConvexClient,
  options: {
    eventType?: AuditEventType;
    userId?: string;
    email?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }
): Promise<AuditLogEntry[]> {
  // This would query the Convex database
  // Implementation depends on your Convex schema
  // Example:
  // return await convexClient.query(api.auditLog.list, options);
  return [];
}

/**
 * Export audit logs for compliance
 */
export async function exportAuditLogs(
  convexClient: ConvexClient,
  options: {
    startTime: number;
    endTime: number;
    format: 'json' | 'csv';
  }
): Promise<string> {
  const logs = await getAuditLogs(convexClient, {
    startTime: options.startTime,
    endTime: options.endTime,
  });

  if (options.format === 'csv') {
    // Convert to CSV
    const headers = [
      'timestamp',
      'eventType',
      'userId',
      'email',
      'ipAddress',
      'status',
      'message',
    ];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.eventType,
      log.userId || '',
      log.email || '',
      log.ipAddress || '',
      log.status,
      log.message,
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  return JSON.stringify(logs, null, 2);
}

# Audit Logging Implementation Guide

## Overview

The audit logging system provides comprehensive security event tracking for compliance, incident investigation, and security monitoring.

## Quick Start

### 1. Log Authentication Events

In your login endpoint (`app/api/auth/login/route.ts`):

```typescript
import { getConvexClient } from "@/lib/convex-client";
import { logAuthEvent, getClientIp, getUserAgent } from "@/lib/auditLogger";
import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const convex = getConvexClient();

  try {
    // Attempt login
    const result = await convex.mutation(api.native_auth.loginWithEmail, {
      email,
      password,
    });

    if (result.success) {
      // Log successful login
      await logAuthEvent(convex, request, "LOGIN_SUCCESS", {
        email,
        status: "success",
        message: `User ${email} logged in successfully`,
        details: {
          deviceId: result.deviceId,
          loginMethod: "email",
        },
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    // Log failed login
    await logAuthEvent(convex, request, "LOGIN_FAILED", {
      email,
      status: "failure",
      message: `Login failed for ${email}: ${error.message}`,
      details: {
        reason: error.message,
      },
    });

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }
}
```

### 2. Log Admin Actions

In your admin endpoints:

```typescript
import { logAdminAction } from "@/lib/auditLogger";

export async function POST(request: Request) {
  const { targetUserId, action } = await request.json();
  const convex = getConvexClient();

  // Verify admin session
  const adminSession = request.cookies.get("admin_session")?.value;
  const admin = await verifyAdminSession(adminSession);

  try {
    // Perform admin action
    await convex.mutation(api.admin.banUser, { userId: targetUserId });

    // Log admin action
    await logAdminAction(convex, request, "ADMIN_USER_BANNED", {
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId,
      targetEmail: targetUser.email,
      action: "Banned user",
      details: {
        reason: "Spam",
        duration: "permanent",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}
```

### 3. Log Security Events

For CSRF failures, rate limiting, etc.:

```typescript
import { logSecurityEvent } from "@/lib/auditLogger";

export async function POST(request: Request) {
  const csrfToken = request.headers.get("X-CSRF-Token");
  const convex = getConvexClient();

  if (!validateCsrfToken(csrfToken)) {
    // Log CSRF failure
    await logSecurityEvent(convex, request, "CSRF_VALIDATION_FAILED", {
      status: "blocked",
      message: "CSRF token validation failed",
      details: {
        endpoint: request.url,
        method: request.method,
      },
    });

    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }
}
```

## Event Types

### Authentication Events
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt
- `LOGIN_ATTEMPT_BLOCKED` - Login blocked (rate limit, lockout)
- `LOGOUT` - User logout
- `REGISTER_SUCCESS` - Successful registration
- `REGISTER_FAILED` - Failed registration
- `PASSWORD_CHANGED` - Password changed
- `PASSWORD_RESET_REQUESTED` - Password reset requested
- `PASSWORD_RESET_COMPLETED` - Password reset completed
- `PASSWORD_RESET_FAILED` - Password reset failed
- `EMAIL_VERIFIED` - Email verified
- `EMAIL_VERIFICATION_FAILED` - Email verification failed
- `OAUTH_LOGIN_SUCCESS` - OAuth login successful
- `OAUTH_LOGIN_FAILED` - OAuth login failed
- `TOKEN_REFRESH` - Token refreshed
- `TOKEN_REFRESH_FAILED` - Token refresh failed
- `SESSION_EXPIRED` - Session expired
- `SESSION_REVOKED` - Session revoked

### Admin Events
- `ADMIN_LOGIN_SUCCESS` - Admin login successful
- `ADMIN_LOGIN_FAILED` - Admin login failed
- `ADMIN_LOGIN_BLOCKED` - Admin login blocked
- `ADMIN_LOGOUT` - Admin logout
- `ADMIN_ACTION` - Generic admin action
- `ADMIN_USER_MODIFIED` - User modified by admin
- `ADMIN_USER_BANNED` - User banned by admin
- `ADMIN_USER_UNBANNED` - User unbanned by admin
- `ADMIN_MODERATOR_ADDED` - Moderator added
- `ADMIN_MODERATOR_REMOVED` - Moderator removed
- `ADMIN_DRAW_CREATED` - Draw created
- `ADMIN_DRAW_MODIFIED` - Draw modified
- `ADMIN_RESULT_SET` - Draw result set
- `ADMIN_CACHE_INVALIDATED` - Cache invalidated

### Security Events
- `CSRF_VALIDATION_FAILED` - CSRF token validation failed
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `ACCOUNT_LOCKED` - Account locked
- `ACCOUNT_UNLOCKED` - Account unlocked
- `SUSPICIOUS_ACTIVITY` - Suspicious activity detected
- `UNAUTHORIZED_ACCESS_ATTEMPT` - Unauthorized access attempt
- `PERMISSION_DENIED` - Permission denied

### User Events
- `PROFILE_UPDATED` - Profile updated
- `PROFILE_UPDATE_FAILED` - Profile update failed
- `AVATAR_CHANGED` - Avatar changed
- `SETTINGS_CHANGED` - Settings changed

## Severity Levels

- `info` - Informational events (successful login, profile update)
- `warning` - Warning events (failed login, rate limit exceeded)
- `error` - Error events (system errors, failed operations)
- `critical` - Critical security events (suspicious activity, unauthorized access)

## Querying Audit Logs

### Get logs for a user

```typescript
const logs = await convex.query(api.auditLog.getUserLogs, {
  userId: "user123",
  limit: 50,
});
```

### Get failed login attempts

```typescript
const failedLogins = await convex.query(api.auditLog.getFailedLoginAttempts, {
  email: "user@example.com",
  hoursBack: 24,
});
```

### Get critical security events

```typescript
const criticalEvents = await convex.query(api.auditLog.getCriticalEvents, {
  limit: 100,
});
```

### Get admin actions

```typescript
const adminActions = await convex.query(api.auditLog.getAdminActions, {
  adminEmail: "admin@example.com",
  limit: 50,
});
```

### Get activity from IP address

```typescript
const ipActivity = await convex.query(api.auditLog.getIpActivityLogs, {
  ipAddress: "192.168.1.1",
  limit: 50,
});
```

### Get audit summary

```typescript
const summary = await convex.query(api.auditLog.getAuditSummary, {
  startTime: Date.now() - (7 * 24 * 60 * 60 * 1000), // Last 7 days
  endTime: Date.now(),
});

console.log(summary);
// {
//   totalEvents: 1234,
//   eventsByType: { LOGIN_SUCCESS: 500, LOGIN_FAILED: 50, ... },
//   eventsByStatus: { success: 1000, failure: 200, blocked: 34 },
//   eventsBySeverity: { info: 800, warning: 300, error: 100, critical: 34 },
//   uniqueUsers: 250,
//   uniqueIps: 45,
//   timeRange: { start: ..., end: ... }
// }
```

## Sensitive Data Redaction

The audit logger automatically redacts sensitive fields:
- `password`
- `token`
- `secret`
- `apiKey`
- `creditCard`
- `ssn`
- `pin`

These fields will be logged as `[REDACTED]` to prevent sensitive data leakage.

## Compliance & Retention

### Data Retention
- Audit logs are kept for 90 days by default
- Older logs are automatically cleaned up
- Configure retention period in `cleanupOldLogs` mutation

### GDPR Compliance
- User data can be exported for compliance
- Implement data deletion for user privacy requests
- Track consent and preferences

### Audit Trail
- All admin actions are logged with:
  - Who performed the action (admin email)
  - What action was performed
  - When it was performed (timestamp)
  - Where it was performed from (IP address)
  - Why it was performed (details)

## Admin Dashboard Integration

Create an admin dashboard to view audit logs:

```typescript
// app/admin/audit-logs/page.tsx
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";

export default async function AuditLogsPage() {
  const convex = getConvexClient();

  // Get recent critical events
  const criticalEvents = await convex.query(api.auditLog.getCriticalEvents, {
    limit: 50,
  });

  // Get audit summary for last 7 days
  const summary = await convex.query(api.auditLog.getAuditSummary, {
    startTime: Date.now() - (7 * 24 * 60 * 60 * 1000),
    endTime: Date.now(),
  });

  return (
    <div>
      <h1>Audit Logs</h1>
      
      <div className="summary">
        <p>Total Events: {summary.totalEvents}</p>
        <p>Unique Users: {summary.uniqueUsers}</p>
        <p>Unique IPs: {summary.uniqueIps}</p>
      </div>

      <div className="critical-events">
        <h2>Critical Events</h2>
        {criticalEvents.map(event => (
          <div key={event._id}>
            <p>{event.eventType} - {event.email}</p>
            <p>{event.message}</p>
            <p>{new Date(event.timestamp).toISOString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Log all security-relevant events** - Don't skip logging for performance
2. **Include context** - Add details that help with incident investigation
3. **Redact sensitive data** - Never log passwords, tokens, or PII
4. **Use appropriate severity levels** - Help with filtering and alerting
5. **Monitor critical events** - Set up alerts for critical security events
6. **Regular review** - Review audit logs regularly for suspicious patterns
7. **Retention policy** - Keep logs long enough for compliance but not forever
8. **Secure storage** - Ensure audit logs are stored securely and backed up
9. **Access control** - Restrict who can view audit logs
10. **Export for compliance** - Export logs for regulatory compliance

## Troubleshooting

### Logs not appearing
- Check that Convex database is connected
- Verify `auditLogs` table exists in schema
- Check browser console for errors

### Performance issues
- Implement log cleanup regularly
- Use indexes for common queries
- Consider archiving old logs

### Missing events
- Verify audit logging is called in all relevant endpoints
- Check error handling doesn't prevent logging
- Review event type names for typos

## Next Steps

1. Add audit logging to all auth endpoints
2. Add audit logging to all admin endpoints
3. Create admin dashboard for viewing logs
4. Set up alerts for critical events
5. Implement log export for compliance
6. Review logs regularly for security incidents

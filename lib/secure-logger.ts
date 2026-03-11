/**
 * Secure logging utility that redacts sensitive information
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  userId?: string;
  email?: string;
  sessionId?: string;
  [key: string]: any;
}

/**
 * Redacts sensitive information from log data
 */
function redactSensitiveData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Redact emails
    return data.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
  }
  
  if (typeof data === 'object') {
    const redacted = { ...data };
    
    // Redact common sensitive fields
    const sensitiveFields = ['email', 'password', 'token', 'session', 'apiKey', 'secret'];
    
    for (const field of sensitiveFields) {
      if (field in redacted) {
        if (field === 'email') {
          redacted[field] = '[REDACTED_EMAIL]';
        } else if (field === 'password') {
          redacted[field] = '[REDACTED]';
        } else if (field === 'token' || field === 'session') {
          redacted[field] = redacted[field] ? `${redacted[field].substring(0, 8)}...` : '[NULL]';
        } else {
          redacted[field] = '[REDACTED]';
        }
      }
    }
    
    // Redact userId to show only first 8 characters
    if (redacted.userId || redacted.id) {
      const userId = redacted.userId || redacted.id;
      redacted.userId = userId ? `${userId.substring(0, 8)}...` : '[NULL]';
      if (redacted.id && !redacted.userId) {
        redacted.id = redacted.userId;
      }
    }
    
    return redacted;
  }
  
  return data;
}

/**
 * Secure logging function that only logs in development and redacts sensitive data
 */
export function secureLog(level: LogLevel, message: string, context?: LogContext): void {
  // Only log in development environment
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const redactedContext = context ? redactSensitiveData(context) : undefined;
  
  switch (level) {
    case 'error':
      console.error(`[ERROR] ${message}`, redactedContext);
      break;
    case 'warn':
      console.warn(`[WARN] ${message}`, redactedContext);
      break;
    case 'info':
      console.info(`[INFO] ${message}`, redactedContext);
      break;
    case 'debug':
      console.log(`[DEBUG] ${message}`, redactedContext);
      break;
  }
}

// Convenience methods
export const logError = (message: string, context?: LogContext) => secureLog('error', message, context);
export const logWarn = (message: string, context?: LogContext) => secureLog('warn', message, context);
export const logInfo = (message: string, context?: LogContext) => secureLog('info', message, context);
export const logDebug = (message: string, context?: LogContext) => secureLog('debug', message, context);

// Specialized logging functions for common operations
export const logAuth = (action: string, userId?: string, success?: boolean) => {
  logInfo(`Auth: ${action}`, { 
    userId, 
    success,
    timestamp: new Date().toISOString()
  });
};

export const logApi = (method: string, endpoint: string, userId?: string, statusCode?: number) => {
  logDebug(`API: ${method} ${endpoint}`, { 
    userId,
    statusCode,
    timestamp: new Date().toISOString()
  });
};

export const logDatabase = (operation: string, table: string, userId?: string) => {
  logDebug(`DB: ${operation} on ${table}`, { 
    userId,
    timestamp: new Date().toISOString()
  });
};

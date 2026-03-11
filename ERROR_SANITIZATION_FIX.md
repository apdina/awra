# Error Sanitization Security Fix

## Issue
API routes were exposing sensitive error information including:
- Internal file paths (`../../convex/native_auth.ts`)
- Line numbers (`756:13`)
- Full stack traces
- Request IDs
- Internal error details

**Example of exposed error:**
```
[Request ID: 5ff1d86b85131297] Server Error
Uncaught Error: Current password is incorrect
at handler (../../convex/native_auth.ts:756:13)
```

This is a **security vulnerability** that can help attackers understand the system architecture.

## Solution

### 1. Created Error Sanitizer Utility
**File:** `lib/errorSanitizer.ts`

Provides three main functions:

#### `sanitizeError(error, context)`
- Converts internal errors to user-friendly messages
- Returns appropriate HTTP status codes
- Logs full error for debugging
- Handles common error patterns:
  - Authentication errors (401)
  - Password errors (400)
  - Email/username errors (400)
  - Account status errors (403/429)
  - Rate limiting (429)
  - Validation errors (400)
  - Not found (404)
  - Conflicts (409)

#### `extractSafeErrorDetails(error)`
- Removes stack traces
- Removes file paths
- Removes line numbers
- Removes request IDs
- Returns only safe details for logging

#### `createErrorResponse(error, context)`
- Convenience function combining sanitization
- Returns user message, status code, and log message

### 2. Updated Change Password Route
**File:** `app/api/auth/change-password/route.ts`

Now uses error sanitizer to:
- Return user-friendly error messages
- Prevent information disclosure
- Log full errors for debugging
- Return appropriate status codes

**Before:**
```
error: "[Request ID: 5ff1d86b85131297] Server Error\nUncaught Error: Current password is incorrect\n at handler (../../convex/native_auth.ts:756:13)\n"
```

**After:**
```
error: "Current password is incorrect."
```

## Error Message Mapping

| Internal Error | User Message | Status |
|---|---|---|
| `not authenticated` | Authentication failed. Please log in again. | 401 |
| `invalid token` | Authentication failed. Please log in again. | 401 |
| `Current password is incorrect` | Current password is incorrect. | 400 |
| `Password must be` | New password does not meet requirements. | 400 |
| `Email already` | This email is already registered. | 400 |
| `Invalid email` | Please enter a valid email address. | 400 |
| `username` / `display name` | This username is already taken. | 400 |
| `Account temporarily locked` | Your account is temporarily locked. Please try again later. | 429 |
| `Account banned` | Your account has been banned. | 403 |
| `Account is inactive` | Your account is inactive. Please contact support. | 403 |
| `rate limit` / `too many` | Too many attempts. Please try again later. | 429 |
| `validation` / `invalid` | Invalid input. Please check your data and try again. | 400 |
| `not found` / `does not exist` | Resource not found. | 404 |
| `already exists` / `duplicate` | This resource already exists. | 409 |

## Security Benefits

✅ **No Information Disclosure**
- File paths hidden
- Line numbers hidden
- Stack traces hidden
- Request IDs hidden

✅ **Better User Experience**
- Clear, actionable error messages
- Appropriate HTTP status codes
- Consistent error handling

✅ **Easier Debugging**
- Full errors logged server-side
- User-friendly messages in responses
- Context preserved for troubleshooting

✅ **Prevents Reconnaissance**
- Attackers can't map system architecture
- Can't identify technologies used
- Can't find vulnerable code paths

## Implementation Checklist

- [x] Created error sanitizer utility
- [x] Updated change-password route
- [ ] Update all other API routes to use sanitizer
- [ ] Test error messages in all scenarios
- [ ] Document error handling patterns
- [ ] Add error sanitization to middleware

## Routes to Update

The following routes should be updated to use the error sanitizer:

1. `app/api/auth/login/route.ts` - Already has custom sanitization
2. `app/api/auth/register/route.ts` - Already has custom sanitization
3. `app/api/auth/me/route.ts` - Needs update
4. `app/api/auth/profile/route.ts` - Needs update
5. `app/api/auth/refresh/route.ts` - Needs update
6. `app/api/auth/oauth/route.ts` - Needs update
7. `app/api/tickets/route.ts` - Needs update
8. `app/api/tickets/unified/route.ts` - Needs update
9. `app/api/tickets/claim/[ticketId]/route.ts` - Needs update
10. `app/api/chat/**/*.ts` - Needs update
11. `app/api/admin/**/*.ts` - Needs update
12. `app/api/email/send/route.ts` - Needs update
13. `app/api/debug/convex-time/route.ts` - Needs update

## Testing

### Test Cases

1. **Wrong Password**
   - Input: Incorrect current password
   - Expected: "Current password is incorrect."
   - Status: 400

2. **Weak New Password**
   - Input: Password < 8 chars
   - Expected: "New password does not meet requirements."
   - Status: 400

3. **Invalid Token**
   - Input: No/invalid access token
   - Expected: "Authentication failed. Please log in again."
   - Status: 401

4. **Success**
   - Input: Correct current password + valid new password
   - Expected: Success response
   - Status: 200

## Future Improvements

1. **Centralized Error Handling Middleware**
   - Wrap all API routes with error sanitization
   - Consistent error handling across all endpoints

2. **Error Tracking**
   - Send sanitized errors to error tracking service
   - Monitor error patterns

3. **Rate Limiting**
   - Track failed attempts
   - Implement progressive delays

4. **Audit Logging**
   - Log all authentication attempts
   - Log all password changes
   - Log all failed operations

## References

- OWASP: Information Disclosure
- CWE-209: Information Exposure Through an Error Message
- CWE-215: Information Exposure Through Debug Information

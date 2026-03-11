# CSRF Protection Implementation

## Overview
Implemented CSRF (Cross-Site Request Forgery) protection for state-changing operations in the AWRA lottery app.

## What's Protected

### Admin Endpoints (CSRF + Admin Secret)
- `POST /api/admin/set-result` - Set winning numbers ✓
- `POST /api/admin/set-draw-time` - Set draw times ✓
- `POST /api/admin/check-and-increment-draw` - Auto-schedule draws ✓
- `POST /api/admin/send-message` - Admin messages ✓
- `POST /api/admin/moderators` - Moderator management ✓
- `POST /api/admin/auto-schedule-draws` - Auto schedule ✓

### User Endpoints (CSRF + Session Auth)
- `POST /api/tickets/unified` - Ticket purchases ✓
- `PATCH /api/auth/profile` - Profile updates ✓
- `POST /api/auth/change-password` - Password changes ✓
- `POST /api/auth/logout` - Logout ✓

### Chat Endpoints (CSRF + Session Auth)
- `POST /api/chat/system-message` - System messages ✓
- `POST /api/chat/join-room` - Join chat room ✓
- `POST /api/chat/leave-room` - Leave chat room ✓

## How It Works

### 1. Token Generation
- Server generates unique CSRF token per user session
- Token format: `{random}.{timestamp}.{hmac}`
- Stored in HTTP-only cookie (`csrf-token`)
- Valid for 24 hours

### 2. Token Validation
- Client includes token in `X-CSRF-Token` header or form data
- Server validates token matches user session
- Uses timing-safe comparison to prevent timing attacks

### 3. Protection Middleware
- `csrfProtect()` wrapper for API routes
- Only protects state-changing methods (POST, PUT, PATCH, DELETE)
- Skips public endpoints (login, registration, etc.)

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```bash
# Generate with: openssl rand -base64 32
CSRF_TOKEN_SECRET=your_secure_csrf_secret_here
```

### 2. Client-Side Usage

#### Option A: Manual Token Fetch
```typescript
// Get CSRF token
const csrfResponse = await fetch('/api/csrf-token', {
  credentials: 'include',
});
const csrfData = await csrfResponse.json();
const csrfToken = csrfData.token;

// Use in request
const response = await fetch('/api/protected-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  credentials: 'include',
  body: JSON.stringify(data),
});
```

#### Option B: Using Helper Functions
```typescript
import { csrfFetch, getCsrfHeaders } from '@/lib/csrf-client';

// Simple fetch with CSRF
const response = await csrfFetch('/api/protected-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// Or get headers separately
const headers = await getCsrfHeaders();
```

### 3. Server-Side Usage

#### Protect API Route
```typescript
import { csrfProtect } from '@/lib/csrf';

export const POST = csrfProtect(async (request: NextRequest) => {
  // Your protected handler logic
  return NextResponse.json({ success: true });
});
```

## Already Updated

### Admin Dashboard (`app/admin/page.tsx`)
- Set winning number handler
- Set draw time handler  
- Set default time handler
- Auto-schedule handler

### Protected Endpoints
- `POST /api/admin/set-result` ✓
- `POST /api/admin/set-draw-time` ✓
- `POST /api/admin/check-and-increment-draw` ✓
- `POST /api/admin/send-message` ✓
- `POST /api/admin/moderators` ✓
- `POST /api/admin/auto-schedule-draws` ✓
- `POST /api/tickets/unified` ✓
- `PATCH /api/auth/profile` ✓
- `POST /api/auth/change-password` ✓
- `POST /api/auth/logout` ✓
- `POST /api/chat/system-message` ✓
- `POST /api/chat/join-room` ✓
- `POST /api/chat/leave-room` ✓

## Implementation Method

All endpoints use inline CSRF validation instead of wrapper functions for Next.js compatibility:

```typescript
// CSRF Protection
const csrfToken = request.headers.get('X-CSRF-Token');
const sessionId = request.cookies.get('session_id')?.value || 
                  request.cookies.get('device_id')?.value ||
                  request.cookies.get('access_token')?.value?.slice(0, 32);

if (!csrfToken || !sessionId || !validateCsrfToken(csrfToken, sessionId)) {
  return NextResponse.json(
    { error: 'Invalid CSRF token' },
    { status: 403 }
  );
}
```

## Testing

### Test Endpoint
```bash
# Get CSRF token
curl -c cookies.txt http://localhost:3000/api/csrf-token

# Test protected endpoint (should fail without token)
curl -X POST http://localhost:3000/api/test-csrf \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test with token (should succeed)
curl -X POST http://localhost:3000/api/test-csrf \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $(grep csrf-token cookies.txt | awk '{print $7}')" \
  -b cookies.txt \
  -d '{"test": "data"}'
```

## Next Steps

### 1. Update Client Components
Update all client components that make state-changing requests to include CSRF tokens:

#### High Priority
- Ticket purchase form (`PlayContent.tsx`, `PlayContent-Mobile.tsx`)
- Profile update form (`account/page.tsx`)
- Password change form (`account/page.tsx`)
- Logout button (all layouts)

#### Medium Priority
- Chat join/leave room handlers
- Admin message sender
- Moderator management UI

### 2. Add CSRF to Forms
For forms that submit directly (not via API), add hidden CSRF token field:
```html
<input type="hidden" name="csrf_token" value="{{ csrfToken }}" />
```

### 3. Monitor and Log
- Log CSRF validation failures
- Monitor for attack patterns
- Set up alerts for repeated failures

## Security Notes

### Why CSRF is Critical for This App
1. **Financial Transactions** - Users buy tickets with coins
2. **Admin Privileges** - Setting winning numbers affects payouts
3. **User Data** - Profile updates, password changes
4. **Game Integrity** - Draw times, scheduling affect game flow

### Current Protections
- ✅ HTTP-only cookies (XSS protection)
- ✅ SameSite=lax cookies (some CSRF protection)
- ✅ CSRF tokens (full CSRF protection)
- ✅ Admin secret validation (admin endpoints)

### Remaining Vulnerabilities to Address
1. **Email verification** - Not implemented
2. **Password reset** - Not implemented  
3. **2FA for admin** - Not implemented
4. **Rate limiting** - Basic only, needs Redis for production

## Troubleshooting

### Common Issues

#### 1. "Invalid CSRF token" error
- Check if cookies are being sent (`credentials: 'include'`)
- Verify token is in `X-CSRF-Token` header
- Ensure token is not expired (24-hour validity)

#### 2. Token not being set
- Check `/api/csrf-token` endpoint
- Verify environment variable `CSRF_TOKEN_SECRET` is set
- Check browser console for errors

#### 3. Admin requests failing
- Verify both `X-Admin-Secret-Key` and `X-CSRF-Token` headers
- Check admin secret in environment variables
- Ensure admin is logged in (session exists)

### Debugging
```typescript
// Enable debug logging in lib/csrf.ts
console.log('CSRF validation:', {
  path: url.pathname,
  method: request.method,
  hasToken: !!csrfToken,
  sessionId: sessionId ? 'present' : 'missing'
});
```

## Production Checklist
- [ ] Set strong `CSRF_TOKEN_SECRET` in production
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Monitor CSRF failure logs
- [ ] Regular security audits
- [ ] Update all state-changing endpoints
- [ ] Test with penetration testing tools
# Auth System Review

## Overview
The application uses **Convex Native Auth** with custom JWT tokens stored in HTTP-only cookies. This is a hybrid approach that leverages Convex's native authentication while maintaining custom session management.

## Architecture

### 1. Authentication Flow

#### Login Process
```
User submits credentials → /api/auth/login → Convex native_auth.loginWithEmail
→ JWT tokens generated → HTTP-only cookies set → User state updated
```

**Key Endpoint:** `app/api/auth/login/route.ts`
- Validates input with Zod schema
- Rate limits login attempts
- Calls `api.native_auth.loginWithEmail` mutation
- Sets two HTTP-only cookies:
  - `access_token` (15 minutes, short-lived)
  - `refresh_token` (30 days, long-lived)
- Sets `device_id` cookie (readable by client, 1 year)

#### Session Verification
```
Client requests /api/auth/me → Extract access_token from cookie
→ Query api.native_auth.getCurrentUserByToken → Return user data
```

**Key Endpoint:** `app/api/auth/me/route.ts`
- Retrieves `access_token` from HTTP-only cookie
- Uses singleton `getConvexClient()` for consistent client instance
- Queries Convex with token to get current user
- Returns user data in standardized format

#### Logout Process
```
User clicks logout → /api/auth/logout → Clear HTTP-only cookies
→ Update user presence to offline → User state cleared
```

**Key Endpoint:** `app/api/auth/logout/route.ts`
- Clears both `access_token` and `refresh_token` cookies
- Updates user presence status in Convex
- Returns success response

### 2. Cookie Configuration

**Current Settings (Fixed for Mobile):**
```typescript
{
  httpOnly: true,           // Not accessible from JavaScript
  secure: production,       // HTTPS only in production
  sameSite: 'lax',         // ✅ FIXED: Changed from 'strict' for mobile compatibility
  maxAge: varies,          // 15 min (access), 30 days (refresh)
  path: '/'                // Available site-wide
}
```

**Why `sameSite: 'lax'`?**
- `strict`: Blocks cookies on cross-site requests (breaks mobile redirects)
- `lax`: Allows cookies on top-level navigation (mobile-friendly)
- `none`: Requires `secure: true` (not needed here)

### 3. Client-Side Auth State Management

**Provider:** `components/ConvexAuthProvider.tsx`

**Key Features:**
- Single initialization on mount (no automatic polling)
- Manual `refreshUser()` function for explicit refresh
- Converts Convex user format to app user format
- Provides auth context to all children

**Auth Context Methods:**
```typescript
{
  user: User | null,
  isLoading: boolean,
  isAuthenticated: boolean,
  accessToken: string | null,
  login(email, password): Promise<{success, error?}>
  register(email, password, displayName): Promise<{success, error?}>
  logout(): Promise<void>
  updateProfile(data): Promise<{success, error?}>
  changePassword(current, new): Promise<{success, error?}>
  loginWithGoogle(providerId, email, displayName, avatarUrl?): Promise<{success, error?}>
  loginWithFacebook(providerId, email, displayName, avatarUrl?): Promise<{success, error?}>
  refreshUser(): Promise<void>
}
```

### 4. Navigation Integration

**Component:** `app/components/NavigationWrapper.tsx`

**Responsibilities:**
- Wraps `Navigation` component with auth state
- Converts Convex user format to game user format
- Provides logout handler
- Memoizes props to prevent unnecessary re-renders
- Handles locale-aware navigation

**Props Passed to Navigation:**
```typescript
{
  isAuthenticated: boolean,
  user?: User,
  session: Session | null,
  loading?: boolean,
  onLogout: () => void,
  onNavigateHome: () => void,
}
```

### 5. User Data Format Conversion

**Convex Format → App Format:**
```typescript
// Convex user (from Convex database)
{
  _id: Id<"userProfiles">,
  email: string,
  displayName: string,
  avatarUrl?: string,
  avatarName?: string,
  avatarType?: 'basic' | 'special',
  coinBalance: number,
  isAdmin: boolean,
  isModerator?: boolean,
  isActive: boolean,
  isBanned: boolean,
  totalWinnings: number,
  totalSpent: number,
  createdAt: number,
  lastActiveAt: number,
}

// App format (used throughout UI)
{
  id: string,
  email: string,
  username: string,
  avatar_url?: string,
  avatar_name?: string,
  avatar_type?: 'basic' | 'special',
  awra_coins: number,
  is_verified: boolean,
  is_active: boolean,
  is_banned: boolean,
  role: 'ADMIN' | 'MODERATOR' | 'USER',
  total_winnings: number,
  total_spent: number,
  created_at: string (ISO),
  updated_at: string (ISO),
}
```

## Key Implementation Details

### Singleton Convex Client
**File:** `lib/convex-client.ts`

**Why Singleton?**
- Reuses same client instance across requests
- Prevents connection overhead
- Ensures consistent state
- Better performance

**Usage:**
```typescript
const convexClient = getConvexClient();
const user = await convexClient.query(api.native_auth.getCurrentUserByToken, { token });
```

### Rate Limiting
**File:** `lib/rateLimit.ts`

**Applied to:**
- Login endpoint (prevents brute force)
- Registration endpoint
- Password change endpoint

**Configuration:**
- In-memory storage (development)
- Configurable limits per endpoint
- Returns remaining attempts and reset time

### Error Handling

**Login Errors:**
- Invalid credentials → 401
- Account locked → 429
- Account banned → 403
- Account inactive → 403
- Password reset required → 403
- Rate limited → 429

**Auth/ME Errors:**
- No token → 401
- Invalid token → 401
- Token expired → 401
- Server error → 500

## Security Considerations

### ✅ Implemented
- HTTP-only cookies (XSS protection)
- CSRF protection via sameSite
- Rate limiting on auth endpoints
- Secure password handling (Convex native auth)
- Token expiration (15 min access, 30 day refresh)
- Device ID tracking
- User presence tracking

### ⚠️ To Consider
- Implement token refresh mechanism (currently no auto-refresh)
- Add CSRF tokens for state-changing operations
- Implement account lockout after failed attempts
- Add email verification for new accounts
- Implement password reset flow
- Add 2FA support

## Testing Credentials

**Admin Account:**
- Email: `admin@awra.com`
- Password: `AdminPassword123`
- Role: ADMIN

## Common Issues & Solutions

### Issue: User Icon Not Displaying
**Cause:** `/api/auth/me` returning 401 (no valid token)
**Solution:** Verify cookies are being set correctly, check token validity

### Issue: Can't Login/Logout on Mobile
**Cause:** `sameSite: 'strict'` blocking cookies on redirects
**Solution:** Changed to `sameSite: 'lax'` for mobile compatibility

### Issue: Session Lost on Page Refresh
**Cause:** Auth provider not fetching user on mount
**Solution:** Added initialization effect that runs once on mount

### Issue: App Refreshing Every 40 Seconds
**Cause:** RefreshVideoAd component triggering page reloads
**Solution:** Removed RefreshVideoAd component entirely

## File Structure

```
app/
├── api/auth/
│   ├── login/route.ts          # Login endpoint
│   ├── logout/route.ts         # Logout endpoint
│   ├── me/route.ts             # Current user endpoint
│   ├── register/route.ts       # Registration endpoint
│   ├── oauth/route.ts          # OAuth endpoints
│   ├── profile/route.ts        # Profile update endpoint
│   └── change-password/route.ts # Password change endpoint
├── components/
│   ├── NavigationWrapper.tsx    # Auth state wrapper for Navigation
│   └── AdminLogin.tsx           # Admin login guard component
└── [locale]/
    └── layout.tsx              # Main layout with auth provider

components/
├── ConvexAuthProvider.tsx       # Auth context provider
├── ConvexClientProvider.tsx     # Convex client provider
├── PageLoader.tsx               # Loading spinner
├── FooterDisclaimer.tsx         # Footer component
└── ui/
    ├── Navigation.tsx           # Navigation bar with user menu
    ├── LanguageSwitcher.tsx     # Language selector
    └── NotificationContainer.tsx # Notification display

lib/
├── convex-client.ts            # Singleton Convex client
└── rateLimit.ts                # Rate limiting utility
```

## Deployment Checklist

- [ ] Verify `sameSite: 'lax'` is set in production
- [ ] Ensure `secure: true` for HTTPS in production
- [ ] Test login/logout on mobile devices
- [ ] Verify cookies are HTTP-only
- [ ] Test admin login with correct credentials
- [ ] Verify user icon displays after login
- [ ] Test language switching without losing auth
- [ ] Verify session persists on page refresh
- [ ] Test rate limiting on failed login attempts
- [ ] Verify error messages are user-friendly

## Next Steps

1. **Implement Token Refresh:** Auto-refresh access token before expiration
2. **Add Email Verification:** Verify email on registration
3. **Implement Password Reset:** Allow users to reset forgotten passwords
4. **Add 2FA:** Two-factor authentication for admin accounts
5. **Improve Error Messages:** More specific error feedback to users
6. **Add Session Management:** Allow users to view/revoke active sessions
7. **Implement Account Recovery:** Security questions or backup codes

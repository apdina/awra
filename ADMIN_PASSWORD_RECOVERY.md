# Admin Password Recovery Guide

## Quick Start

Your admin password is stored as a bcrypt hash in Convex's `systemConfig` table. Here are the easiest ways to reset it:

## Option 1: Reset via Convex Dashboard (Recommended)

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project: `awra`
3. Go to **Data** tab
4. Find the `systemConfig` table
5. Look for the record with `key: "ADMIN_PASSWORD_HASH"`
6. **Delete this record** (click the trash icon)
7. Now you can set a new password via the admin login page

## Option 2: Reset via API Call (Quickest)

Run this command from your terminal:

```bash
# Set a new admin password
curl -X POST http://localhost:3000/api/admin/setup-admin-secret \
  -H "Content-Type: application/json" \
  -d '{"password": "YourNewSecurePassword123"}'
```

Or if deployed:

```bash
curl -X POST https://your-domain.com/api/admin/setup-admin-secret \
  -H "Content-Type: application/json" \
  -d '{"password": "YourNewSecurePassword123"}'
```

**If you get an error, try the alternative endpoint:**

```bash
curl -X POST http://localhost:3000/api/admin/reset-admin-password \
  -H "Content-Type: application/json" \
  -d '{"password": "YourNewSecurePassword123"}'
```

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Valid Examples:**
- `SecurePass123`
- `AdminPassword2024`
- `MyNewAdminPass99`

## Option 3: Reset via Convex Console

1. Open [Convex Dashboard](https://dashboard.convex.dev)
2. Go to your project
3. Click **Console** tab
4. Run this mutation:

```typescript
await mutation(api.adminAuth.setupAdminPassword, {
  password: "YourNewSecurePassword123"
});
```

## After Resetting

1. **Login to Admin Dashboard**
   - Go to `/admin`
   - Enter your new password
   - You'll be logged in

2. **Update Your Password**
   - Go to Account Settings
   - Change to a password you'll remember
   - Store it securely (password manager recommended)

3. **Secure Your Admin Secret**
   - The `ADMIN_SECRET` is used for API operations
   - Keep it in `.env` file (never commit to git)
   - Use a strong random value: `openssl rand -base64 32`

## Admin Credentials Locations

### 1. Admin Password Hash
- **Location:** Convex `systemConfig` table
- **Key:** `ADMIN_PASSWORD_HASH`
- **Format:** bcrypt hash (not plaintext)
- **Used for:** Admin dashboard login
- **Reset:** Delete the record or call `setupAdminPassword` mutation

### 2. Admin Secret
- **Location:** Environment variable `ADMIN_SECRET`
- **Format:** Random string (32+ characters)
- **Used for:** API operations (setting draw time, results, etc.)
- **Fallback:** Convex `systemConfig` table with key `ADMIN_SECRET`

## Security Best Practices

✅ **DO:**
- Use strong passwords (12+ characters, mixed case, numbers)
- Store credentials in `.env` (never in code)
- Use a password manager
- Rotate passwords regularly
- Keep `ADMIN_SECRET` secure

❌ **DON'T:**
- Commit `.env` to git
- Share admin credentials
- Use simple passwords
- Reuse passwords across services
- Store passwords in plaintext

## Troubleshooting

### "Internal Server Error" when calling API

**Cause:** The mutation might be failing or the endpoint has an issue

**Solution:**
1. Try the alternative endpoint: `/api/admin/reset-admin-password`
2. Check server logs for detailed error message
3. If still failing, use Option 1 (Convex Dashboard) instead

### "Admin authentication not configured"
- The `ADMIN_PASSWORD_HASH` is not set in Convex
- Follow Option 1 or 2 above to set it

### "Invalid admin password"
- Password is incorrect
- Password hash is corrupted
- Try resetting via Convex Dashboard

### "Password must be at least 12 characters"
- Your password is too short
- Use at least 12 characters

### "Password must contain uppercase/lowercase/number"
- Your password doesn't meet requirements
- Add uppercase, lowercase, and numbers

## Emergency Access

If you're completely locked out:

1. **Check Convex Deployment**
   - Go to Convex Dashboard
   - Verify `systemConfig` table exists
   - Check if `ADMIN_PASSWORD_HASH` record exists

2. **Check Environment Variables**
   - Verify `ADMIN_SECRET` is set in `.env`
   - Verify `CONVEX_DEPLOYMENT` is correct

3. **Contact Support**
   - If still stuck, contact Convex support
   - Provide your deployment ID
   - They can help reset the database

## Related Files

- `convex/adminAuth.ts` - Admin authentication logic
- `app/admin/page.tsx` - Admin dashboard
- `.env` - Environment variables
- `app/api/admin/` - Admin API routes

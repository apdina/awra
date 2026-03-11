# Security Fixes - Implementation Guide

## Quick Start: Critical Fixes (Week 1)

This guide provides step-by-step implementation for the 5 critical security vulnerabilities.

---

## Fix #1: Email Verification (2-3 hours)

### Overview
Prevent account takeover by requiring email verification before account activation.

### Implementation Steps

#### Step 1: Create Email Verification Schema
Add to `convex/schema.ts`:

```typescript
emailVerifications: defineTable({
  email: v.string(),
  token: v.string(),
  userId: v.id("userProfiles"),
  expiresAt: v.number(),
  verified: v.boolean(),
  createdAt: v.number(),
})
  .index("by_email", ["email"])
  .index("by_token", ["token"])
  .index("by_userId", ["userId"]),
```

#### Step 2: Create Email Verification Mutation
Create `convex/emailVerification.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import crypto from "crypto";

export const requestEmailVerification = mutation({
  args: {
    userId: v.id("userProfiles"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store verification record
    await ctx.db.insert("emailVerifications", {
      email: args.email,
      token,
      userId: args.userId,
      expiresAt,
      verified: false,
      createdAt: Date.now(),
    });

    // TODO: Send verification email with token
    // sendVerificationEmail(args.email, token);

    return { success: true, token };
  },
});

export const verifyEmail = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find verification record
    const verification = await ctx.db
      .query("emailVerifications")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!verification) {
      throw new Error("Invalid verification token");
    }

    // Check if expired
    if (verification.expiresAt < Date.now()) {
      throw new Error("Verification token expired");
    }

    // Mark as verified
    await ctx.db.patch(verification._id, {
      verified: true,
    });

    // Update user profile
    await ctx.db.patch(verification.userId, {
      emailVerified: true,
    });

    return { success: true };
  },
});

export const isEmailVerified = query({
  args: {
    userId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return { verified: user?.emailVerified || false };
  },
});
```

#### Step 3: Update Registration Flow
Modify `convex/native_auth.ts`:

```typescript
export const registerWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // Create user with emailVerified: false
    const userId = await ctx.db.insert("userProfiles", {
      email: args.email,
      displayName: args.displayName,
      emailVerified: false, // ✅ NEW
      // ... other fields ...
    });

    // Request email verification
    await ctx.runMutation(api.emailVerification.requestEmailVerification, {
      userId,
      email: args.email,
    });

    return { success: true, userId };
  },
});
```

#### Step 4: Update Login to Check Verification
Modify `convex/native_auth.ts`:

```typescript
export const loginWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // ✅ NEW: Check if email is verified
    if (!user.emailVerified) {
      throw new Error("Please verify your email before logging in");
    }

    // ... rest of login logic ...
  },
});
```

#### Step 5: Create Verification Email Endpoint
Create `app/api/auth/verify-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing verification token" },
      { status: 400 }
    );
  }

  try {
    const convex = getConvexClient();
    const result = await convex.mutation(api.emailVerification.verifyEmail, {
      token,
    });

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/login?verified=true", request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }
}
```

#### Step 6: Send Verification Email
Update your email service (Resend, SendGrid, etc.):

```typescript
// In emailVerification.ts
async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "noreply@awra.com",
    to: email,
    subject: "Verify your email address",
    html: `
      <h2>Welcome to Awra!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
```

---

## Fix #2: Admin Password Hashing (1-2 hours)

### Overview
Use bcrypt for admin password hashing instead of plain text comparison.

### Implementation Steps

#### Step 1: Install bcryptjs
```bash
npm install bcryptjs
```

#### Step 2: Update Admin Auth
Modify `convex/adminAuth.ts`:

```typescript
import bcrypt from "bcryptjs";

// Hash admin password on setup
export const setupAdminPassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate password strength
    if (args.password.length < 12) {
      throw new Error("Password must be at least 12 characters");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(args.password, 12);

    // Store in systemConfig
    const existing = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "ADMIN_PASSWORD_HASH"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: hashedPassword,
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "ADMIN_PASSWORD_HASH",
        value: hashedPassword,
      });
    }

    return { success: true };
  },
});

// Verify admin password with bcrypt
export const verifyAdminPassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Get hashed password from Convex
    const adminPasswordHash = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "ADMIN_PASSWORD_HASH"))
      .first();

    if (!adminPasswordHash) {
      throw new Error("Admin password not configured");
    }

    // Compare with bcrypt
    const isValid = await bcrypt.compare(args.password, adminPasswordHash.value);

    if (!isValid) {
      return { success: false };
    }

    // Generate session token
    const sessionToken = await generateSessionToken();
    const expiresAt = Date.now() + (8 * 60 * 60 * 1000);

    await ctx.db.insert("adminSessions", {
      sessionToken,
      createdAt: Date.now(),
      expiresAt,
      lastActivityAt: Date.now(),
    });

    return {
      success: true,
      sessionToken,
    };
  },
});
```

#### Step 3: Update Admin Login API
Modify `app/api/admin/auth/login/route.ts`:

```typescript
import { adminLoginLimiter } from "@/lib/rateLimit-redis";

export async function POST(request: Request) {
  const { password } = await request.json();

  // ✅ NEW: Apply rate limiting
  const rateLimitResult = await adminLoginLimiter.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const convex = getConvexClient();
    const result = await convex.mutation(api.adminAuth.verifyAdminPassword, {
      password,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
```

---

## Fix #3: Admin Login Rate Limiting (1 hour)

### Overview
Prevent brute force attacks on admin login.

### Implementation Steps

#### Step 1: Create Admin Rate Limiter
Add to `lib/rateLimit-redis.ts`:

```typescript
export const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,             // 5 attempts
  keyGenerator: (req) => {
    // Use IP address as key
    return req.headers.get("x-forwarded-for") || 
           req.headers.get("x-real-ip") || 
           "unknown";
  },
  message: "Too many login attempts. Please try again later.",
});
```

#### Step 2: Add Account Lockout
Create `convex/adminLockout.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const recordFailedAdminLogin = mutation({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);

    // Get recent failed attempts
    const recentAttempts = await ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_ip", (q) => q.eq("ipAddress", args.ipAddress))
      .filter((q) => q.gt(q.field("timestamp"), fifteenMinutesAgo))
      .collect();

    // If 5+ attempts, lock out
    if (recentAttempts.length >= 5) {
      await ctx.db.insert("adminLockouts", {
        ipAddress: args.ipAddress,
        lockedUntil: now + (15 * 60 * 1000), // 15 minute lockout
        reason: "Too many failed login attempts",
      });
    }

    // Record this attempt
    await ctx.db.insert("adminLoginAttempts", {
      ipAddress: args.ipAddress,
      timestamp: now,
    });
  },
});

export const isAdminLockedOut = query({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const lockout = await ctx.db
      .query("adminLockouts")
      .withIndex("by_ip", (q) => q.eq("ipAddress", args.ipAddress))
      .first();

    if (!lockout) {
      return { locked: false };
    }

    if (lockout.lockedUntil < Date.now()) {
      // Lockout expired
      await ctx.db.delete(lockout._id);
      return { locked: false };
    }

    return {
      locked: true,
      lockedUntil: lockout.lockedUntil,
      remainingMinutes: Math.ceil((lockout.lockedUntil - Date.now()) / 60000),
    };
  },
});
```

#### Step 3: Update Admin Login to Check Lockout
Modify `app/api/admin/auth/login/route.ts`:

```typescript
export async function POST(request: Request) {
  const ipAddress = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "unknown";

  // ✅ NEW: Check if IP is locked out
  const convex = getConvexClient();
  const lockoutStatus = await convex.query(api.adminLockout.isAdminLockedOut, {
    ipAddress,
  });

  if (lockoutStatus.locked) {
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${lockoutStatus.remainingMinutes} minutes.`,
      },
      { status: 429 }
    );
  }

  const { password } = await request.json();

  try {
    const result = await convex.mutation(api.adminAuth.verifyAdminPassword, {
      password,
    });

    if (!result.success) {
      // Record failed attempt
      await convex.mutation(api.adminLockout.recordFailedAdminLogin, {
        ipAddress,
      });

      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Success - clear any lockout
    // ... set session cookie ...
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
```

---

## Fix #4: Password Reset Rate Limiting (1-2 hours)

### Overview
Prevent spam and brute force attacks on password reset.

### Implementation Steps

#### Step 1: Create Password Reset Rate Limiter
Add to `lib/rateLimit-redis.ts`:

```typescript
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,             // 3 resets per hour
  keyGenerator: (email) => email,
  message: "Too many password reset requests. Try again later.",
});
```

#### Step 2: Update Password Reset Mutation
Modify `convex/passwordReset.ts`:

```typescript
import crypto from "crypto";

export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (1 * 60 * 60 * 1000); // 1 hour

    // Store reset token
    await ctx.db.insert("passwordResets", {
      userId: user._id,
      email: args.email,
      token: resetToken,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    // TODO: Send reset email
    // sendPasswordResetEmail(args.email, resetToken);

    return { success: true };
  },
});
```

#### Step 3: Update Password Reset API
Modify `app/api/auth/password-reset/route.ts`:

```typescript
import { passwordResetLimiter } from "@/lib/rateLimit-redis";

export async function POST(request: Request) {
  const { email } = await request.json();

  // ✅ NEW: Apply rate limiting
  const rateLimitResult = await passwordResetLimiter.check(email);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many password reset requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const convex = getConvexClient();
    await convex.mutation(api.passwordReset.requestPasswordReset, {
      email,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Password reset failed" },
      { status: 500 }
    );
  }
}
```

---

## Fix #5: CSRF Token Entropy (30 minutes)

### Overview
Use full HMAC output instead of truncated version.

### Implementation Steps

#### Step 1: Update CSRF Token Generation
Modify `lib/csrf.ts`:

```typescript
import crypto from "crypto";

export function generateCsrfToken(secret: string): string {
  const randomBytes = crypto.randomBytes(32);
  const timestamp = Date.now().toString();
  
  // ✅ FIXED: Use full HMAC output (64 chars instead of 32)
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(randomBytes.toString("hex") + timestamp)
    .digest("hex"); // Full 64 characters

  return `${randomBytes.toString("hex")}.${timestamp}.${hmac}`;
}

export function validateCsrfToken(
  token: string,
  secret: string,
  maxAge: number = 24 * 60 * 60 * 1000
): boolean {
  try {
    const [randomBytes, timestamp, hmac] = token.split(".");

    if (!randomBytes || !timestamp || !hmac) {
      return false;
    }

    // Check age
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > maxAge) {
      return false;
    }

    // Verify HMAC
    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(randomBytes + timestamp)
      .digest("hex");

    // ✅ FIXED: Compare full HMAC
    return hmac === expectedHmac;
  } catch {
    return false;
  }
}
```

---

## Testing Checklist

After implementing each fix, test:

### Email Verification
- [ ] User can register
- [ ] Verification email is sent
- [ ] User cannot login without verification
- [ ] Clicking verification link works
- [ ] Expired tokens are rejected
- [ ] Resend verification email works

### Admin Password Hashing
- [ ] Admin can login with correct password
- [ ] Admin cannot login with wrong password
- [ ] Password is hashed in database
- [ ] Old plaintext passwords are migrated

### Admin Login Rate Limiting
- [ ] 5 failed attempts lock out IP
- [ ] Lockout lasts 15 minutes
- [ ] Successful login clears lockout
- [ ] Different IPs are tracked separately

### Password Reset Rate Limiting
- [ ] User can request 3 resets per hour
- [ ] 4th request is blocked
- [ ] Limit resets per hour (not per day)
- [ ] Different emails are tracked separately

### CSRF Token Entropy
- [ ] Tokens are 96+ characters
- [ ] Tokens are unique each time
- [ ] Tokens expire after 24 hours
- [ ] Invalid tokens are rejected

---

## Deployment Steps

1. **Test locally** - Run all tests in development
2. **Deploy to staging** - Test in staging environment
3. **Run security tests** - Verify all fixes work
4. **Deploy to production** - Roll out to production
5. **Monitor logs** - Watch for any issues
6. **Notify users** - Inform users of security improvements

---

## Questions?

If you need help implementing any of these fixes, refer back to the main `SECURITY_REVIEW_2026.md` document for more context.

import { NextRequest, NextResponse } from 'next/server';
import { LoginRequest, AuthResponse } from '@/types/game';
import { z } from 'zod';
import { authLimiter } from '@/lib/rateLimit';
import { logAuth, logApi, logError, logWarn, logDebug } from '@/lib/secure-logger';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse | { error: string }>> {
  try {
    logAuth('Login attempt start (Convex native)');
    
    // Check rate limit
    const rateLimitResult = await authLimiter(request);
    if (!rateLimitResult.success) {
      logWarn('Rate limit exceeded for login');
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': (rateLimitResult.remaining ?? 0).toString(),
            'X-RateLimit-Reset': (rateLimitResult.resetTime ?? 0).toString()
          }
        }
      );
    }

    const body: LoginRequest = await request.json();
    logDebug('Login request received', { email: body.email });
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    logDebug('Input validation passed');
    
    // Get or generate device ID
    const deviceId = request.cookies.get('device_id')?.value || crypto.randomUUID();
    
    // Get remember me preference (default: true for persistent sessions)
    const rememberMe = (body as any).rememberMe !== false;
    
    // Get shared Convex client for authentication
    const convexClient = getConvexClient();
    
    try {
      // Authenticate with Convex native auth
      logDebug('Authenticating with Convex native auth');
      const result = await convexClient.mutation(api.native_auth.loginWithEmail, {
        email: validatedData.email,
        password: validatedData.password,
        deviceId,
        rememberMe,
      });

      if (!result.success || !result.user) {
        logError('Convex authentication failed', { error: 'Invalid credentials' });
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      logDebug('Convex auth successful', { userId: result.user._id, displayName: result.user.displayName });
      
      const authResponse: AuthResponse = {
        user: {
          id: result.user._id,
          email: result.user.email || '',
          username: result.user.displayName,
          awra_coins: result.user.coinBalance,
          is_verified: true,
          is_active: result.user.isActive,
          role: result.user.isAdmin ? 'ADMIN' : 'USER',
          created_at: new Date(result.user.createdAt).toISOString(),
          updated_at: new Date(result.user.lastActiveAt).toISOString(),
        },
        session: result.accessToken,
        token: result.accessToken ?? undefined
      };

      const response = NextResponse.json(authResponse);
      
      // Set access token cookie (short-lived, HttpOnly)
      response.cookies.set('access_token', result.accessToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutes
        path: '/',
      });
      
      // Set refresh token cookie (long-lived, HttpOnly) if rememberMe
      if (result.refreshToken) {
        response.cookies.set('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
      }
      
      // Set device ID cookie (readable by client)
      response.cookies.set('device_id', deviceId, {
        httpOnly: false, // Client needs to read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/',
      });

      logAuth('Login successful (Convex)', result.user._id, true);
      
      return response;
    } catch (convexError: any) {
      logError('Convex authentication error', { error: convexError.message });
      
      // Parse error message for better user feedback
      const errorMessage = convexError.message || 'Authentication failed';
      let statusCode = 401;
      let userMessage = errorMessage;
      
      // Handle specific error cases
      if (errorMessage.includes('Account temporarily locked')) {
        statusCode = 429;
        userMessage = errorMessage;
      } else if (errorMessage.includes('Account banned')) {
        statusCode = 403;
        userMessage = errorMessage;
      } else if (errorMessage.includes('Account is inactive')) {
        statusCode = 403;
        userMessage = 'Your account is inactive. Please contact support.';
      } else if (errorMessage.includes('password needs to be reset')) {
        statusCode = 403;
        userMessage = 'Your password needs to be reset for security reasons. Please use the "Forgot Password" link.';
      } else if (errorMessage.includes('attempts remaining')) {
        statusCode = 401;
        userMessage = errorMessage;
      } else if (errorMessage.includes('Invalid email or password')) {
        statusCode = 401;
        userMessage = 'Invalid email or password. Please try again.';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: statusCode }
      );
    }
  } catch (error) {
    logError('Login error', { error: (error as Error).message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input: ' + error.issues.map((e: any) => e.message).join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

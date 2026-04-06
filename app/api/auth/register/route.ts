import { NextResponse } from 'next/server';
import { AuthResponse } from '@/types/game';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { z } from 'zod';
import { authLimiter } from '@/lib/rateLimit';
import { logAuth, logError, logWarn, logDebug } from '@/lib/secure-logger';

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
});

export async function POST(request: Request) {
  try {
    // Apply rate limiting (5 registration attempts per 15 minutes per IP)
    const rateLimitResult = await authLimiter(request as any);
    
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil(((rateLimitResult.resetTime ?? Date.now()) - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': (rateLimitResult.remaining ?? 0).toString(),
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    const email = validatedData.email.trim().toLowerCase();
    const password = validatedData.password.trim();
    const username = validatedData.username.trim();

    // Create Convex client for registration
    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    try {
      // Register with Convex native auth
      const result = await convexClient.mutation(api.native_auth.registerWithEmail, {
        email,
        password,
        displayName: username,
      });

      if (!result.success) {
        logError("Convex registration failed");
        return NextResponse.json({ error: "Registration failed" }, { status: 400 });
      }

      logAuth('Convex registration successful', result.userId);
      
      // Return success so client can auto-login
      return NextResponse.json({ 
        success: true,
        message: "Registration successful. Please log in.",
        userId: result.userId,
        user: { id: result.userId }
      });

    } catch (convexError: any) {
      logError("Convex Registration Error:", convexError);
      
      // Return specific, user-friendly error messages
      if (convexError.message.includes("Email already registered")) {
        return NextResponse.json({ 
          error: "This email is already registered. Please use a different email or try logging in." 
        }, { status: 400 });
      }
      
      if (convexError.message.includes("Display name already taken")) {
        return NextResponse.json({ 
          error: "This username is already taken. Please choose a different username." 
        }, { status: 400 });
      }
      
      if (convexError.message.includes("Invalid email format")) {
        return NextResponse.json({ 
          error: "Please enter a valid email address." 
        }, { status: 400 });
      }
      
      if (convexError.message.includes("Password must be at least")) {
        return NextResponse.json({ 
          error: "Password must be at least 8 characters long." 
        }, { status: 400 });
      }
      
      // Generic error for unexpected issues
      return NextResponse.json({ 
        error: convexError.message || "Registration failed. Please try again." 
      }, { status: 400 });
    }

  } catch (error) {
    logError("Server Error:", error as Error);
    
    if (error instanceof z.ZodError) {
      // Return the first validation error for better UX
      const firstError = error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      error: "An unexpected error occurred. Please try again later." 
    }, { status: 500 });
  }
}
import { logger } from "@/lib/logger";
// This API route is deprecated since we're using pure Convex auth
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // This API route is deprecated since we're using pure Convex auth
    return NextResponse.json({ 
      error: 'This API route is deprecated.',
      message: 'Shadow profile creation is not needed with Convex native auth. Use Convex auth directly.',
      alternatives: [
        'Use /api/auth/register for new users',
        'Use /api/auth/login for existing users',
        'Use Convex client directly in your app'
      ]
    }, { status: 410 }); // Gone - indicates the resource has been removed
  } catch (error) {
    logger.error('Error in deprecated create-shadow-profile route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

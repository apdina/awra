import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    // Get admin secret from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const adminSecret = authHeader.substring(7);

    // Create next draw via Convex action
    const convex = getConvexClient();
    const result = await convex.mutation(api.draws.checkAndIncrementDraw, {
      adminSecret
    }) as any;

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to create next draw' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      ...(result.next_draw && { next_draw: result.next_draw })
    });

  } catch (error) {
    console.error('Error creating next draw:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Missing password' },
        { status: 400 }
      );
    }

    // Get Convex client
    const convex = getConvexClient();

    // Call the setupAdminPassword mutation from adminAuth
    const result = await convex.mutation(api.adminAuth.setupAdminPassword, {
      password
    });

    logger.log('✅ Admin password set successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Admin password set successfully',
      data: result
    });

  } catch (error: any) {
    logger.error('Setup admin password error:', error);
    
    return NextResponse.json(
      { error: `Failed to set admin password: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

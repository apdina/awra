import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export async function GET(request: NextRequest) {
  try {
    // Get admin secret from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const adminSecret = authHeader.substring(7);

    // Verify admin secret
    const convex = getConvexClient();
    const config = await convex.query(api.systemConfig.getAdminSecret);
    if (config?.value !== adminSecret) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
    }

    // Get draw configuration
    const [defaultTimeConfig, excludeSundaysConfig, currentDraw] = await Promise.all([
      convex.query(api.systemConfig.getByKey, { key: 'default_draw_time' }),
      convex.query(api.systemConfig.getByKey, { key: 'exclude_sundays' }),
      convex.query(api.draws.getOrCreateCurrentDraw, {}) as any
    ]);

    const defaultDrawTime = defaultTimeConfig?.value as string || "21:40";
    const excludeSundays = excludeSundaysConfig?.value !== false;

    // Get next draw info
    let nextDrawDate, nextDrawTime;
    if (currentDraw) {
      nextDrawDate = currentDraw.draw_date;
      nextDrawTime = currentDraw.draw_time;
    }

    return NextResponse.json({
      defaultDrawTime,
      excludeSundays,
      nextDrawDate,
      nextDrawTime,
      currentDrawStatus: currentDraw?.status || 'unknown'
    });

  } catch (error) {
    console.error('Error fetching draw config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get admin secret from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const adminSecret = authHeader.substring(7);

    // Get body
    const body = await request.json();
    const { defaultDrawTime, excludeSundays } = body;

    // Validate input
    if (!defaultDrawTime || !/^\d{2}:\d{2}$/.test(defaultDrawTime)) {
      return NextResponse.json({ error: 'Invalid draw time format. Use HH:MM' }, { status: 400 });
    }

    // Update configuration via Convex action
    const convex = getConvexClient();
    const result = await convex.mutation(api.systemConfig.updateDrawConfig, {
      defaultDrawTime,
      excludeSundays,
      adminSecret
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      defaultDrawTime,
      excludeSundays
    });

  } catch (error) {
    console.error('Error updating draw config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

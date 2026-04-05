import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

/**
 * DEPRECATED: Use /api/draw?type=countdown instead
 * 
 * This endpoint now proxies to the unified draw API for backward compatibility
 */
export async function GET(request: NextRequest) {
  try {
    // Proxy to the unified draw API
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.has('t') ? `?t=${Date.now()}` : '';
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/draw?type=countdown${forceRefresh}`,
      { cache: 'no-store' }
    );
    
    const data = await response.json();
    
    // Return with same cache headers
    const result = NextResponse.json(data);
    
    if (url.searchParams.has('t')) {
      result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      result.headers.set('Pragma', 'no-cache');
      result.headers.set('Expires', '0');
    } else {
      result.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
      result.headers.set('CDN-Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    }
    
    return result;

  } catch (error) {
    console.error('Error in countdown API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch countdown data' 
    }, { status: 500 });
  }
}

// Support POST for forced refresh (admin use)
export async function POST(request: NextRequest) {
  try {
    // Get admin secret from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const adminSecret = authHeader.substring(7);

    // Verify admin secret
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const config = await convex.query(api.systemConfig.getAdminSecret);
    if (config?.value !== adminSecret) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
    }

    // Proxy to unified draw API with force refresh
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/draw?type=countdown&t=${Date.now()}`,
      { cache: 'no-store' }
    );
    
    const data = await response.json();
    
    const result = NextResponse.json({
      success: true,
      data: data.data,
      message: 'Fresh countdown data fetched'
    });
    
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    return result;

  } catch (error) {
    console.error('Error refreshing countdown data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to refresh countdown data' 
    }, { status: 500 });
  }
}

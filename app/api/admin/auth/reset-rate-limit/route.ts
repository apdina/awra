import { NextRequest, NextResponse } from 'next/server';

// This is a development-only endpoint to reset rate limits
// Remove or protect this in production!

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  console.log('🔄 Rate limit reset requested');
  
  // Note: This won't actually clear the in-memory rate limits in the login route
  // You need to restart the dev server to clear them
  
  return NextResponse.json({ 
    success: true,
    message: 'To fully reset rate limits, restart your dev server (npm run dev)' 
  });
}

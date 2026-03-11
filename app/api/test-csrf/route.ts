import { NextRequest, NextResponse } from 'next/server';
import { csrfProtect } from '@/lib/csrf';

/**
 * Test endpoint to verify CSRF protection
 * 
 * GET: Returns CSRF token info
 * POST: Requires valid CSRF token
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CSRF test endpoint',
    instructions: 'Send a POST request with X-CSRF-Token header',
    endpoints: {
      getToken: '/api/csrf-token',
      testPost: '/api/test-csrf (POST)',
    },
  });
}

export const POST = csrfProtect(async (request: NextRequest) => {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'CSRF token validated successfully!',
    receivedData: body,
    timestamp: new Date().toISOString(),
  });
});
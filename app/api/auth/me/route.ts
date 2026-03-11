import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get shared Convex client (reused across requests for better performance)
    const convexClient = getConvexClient();
    
    try {
      // Get current user from Convex using the token
      const user = await convexClient.query(api.native_auth.getCurrentUserByToken, {
        token: accessToken
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Convert Convex user to expected format
      const userData = {
        id: user._id,
        email: user.email,
        username: user.displayName,
        avatar_url: user.avatarUrl,
        avatar_name: user.avatarName,
        avatar_type: user.avatarType,
        awra_coins: user.coinBalance,
        is_verified: true,
        is_active: user.isActive,
        is_banned: user.isBanned,
        role: user.isAdmin ? 'ADMIN' : (user.isModerator ? 'MODERATOR' : 'USER'),
        total_winnings: user.totalWinnings,
        total_spent: user.totalSpent,
        created_at: new Date(user.createdAt).toISOString(),
        updated_at: new Date(user.lastActiveAt).toISOString(),
      };
      
      return NextResponse.json(userData);
    } catch (convexError: any) {
      logger.error('Convex query error:', convexError);
      return NextResponse.json(
        { error: 'Authentication failed: ' + convexError.message },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('=== AUTH/ME ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

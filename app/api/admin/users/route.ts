import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/logger';

// Helper function to get current admin user from session
async function getCurrentAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  try {
    const result = await convexClient.query(api.adminAuth.verifyAdminSession, {
      sessionToken,
    });
    
    if (!result.valid) {
      return null;
    }
    
    // For now, we'll use a placeholder admin ID
    // In a real implementation, you'd get the actual admin user ID
    return {
      _id: 'admin_placeholder', // This will be handled in the Convex functions
      isAdmin: true,
      isModerator: false,
      email: 'admin@system'
    };
  } catch (error) {
    return null;
  }
}

// Ban/Unban user by email
export async function POST(request: NextRequest) {
  try {
    const authUser = await getCurrentAdmin(request);
    
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { email, action, reason } = await request.json();

    if (!email || !action || !['ban', 'unban', 'promote_mod', 'demote_mod'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request. Email and action (ban/unban/promote_mod/demote_mod) are required.' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Find user by email using Convex
    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    try {
      const targetUser = await convexClient.query(api.userManagement.getUserByEmail, { email });

      if (!targetUser) {
        return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 });
      }

      // Handle moderator promotion/demotion (admin only)
      if (action === 'promote_mod' || action === 'demote_mod') {
        if (targetUser.isAdmin) {
          return NextResponse.json({ error: 'Cannot modify moderator status of admin users' }, { status: 403 });
        }

        const isModerator = action === 'promote_mod';
        try {
          await convexClient.mutation(api.userManagement.updateUserModeratorStatus, {
            userId: targetUser._id as any,
            isModerator,
            reason: reason || 'Admin action'
          });

          return NextResponse.json({
            success: true,
            message: `User ${targetUser.displayName || email} has been ${isModerator ? 'promoted to' : 'demoted from'} moderator successfully`,
            user: {
              email,
              action: isModerator ? 'promoted_to_moderator' : 'demoted_from_moderator'
            }
          });
        } catch (convexError: any) {
          logger.error('Convex moderator update error:', convexError);
          return NextResponse.json({ error: 'Failed to update moderator status' }, { status: 500 });
        }
      }

      // Handle ban/unban
      if (targetUser.isAdmin) {
        return NextResponse.json({ error: 'Cannot ban admin users' }, { status: 403 });
      }

      const isBanned = action === 'ban';
      try {
        await convexClient.mutation(api.userManagement.updateUserBanStatus, {
          userId: targetUser._id as any,
          isBanned,
          reason: reason || 'Admin action'
        });

        return NextResponse.json({
          success: true,
          message: `User ${targetUser.displayName || email} has been ${isBanned ? 'banned' : 'unbanned'} successfully`,
          user: {
            email,
            action: isBanned ? 'banned' : 'unbanned'
          }
        });
      } catch (convexError: any) {
        logger.error('Convex ban update error:', convexError);
        return NextResponse.json({ error: 'Failed to update ban status' }, { status: 500 });
      }

    } catch (convexError: any) {
      logger.error('Convex query error:', convexError);
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

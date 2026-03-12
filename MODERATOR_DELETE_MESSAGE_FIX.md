# Moderator Delete Message Fix

## Issue
Moderators couldn't see the delete button for other users' messages in the chat.

## Root Cause
The condition checking for moderator status was using loose equality (`||`) which could fail if `isModerator` was `undefined` or falsy. The condition needed to explicitly check for `true` values.

## Solution
Updated the delete button visibility condition to use strict equality checks:

**Before:**
```typescript
{(currentUser?.isAdmin || currentUser?.isModerator) && (
```

**After:**
```typescript
{(currentUser?.isAdmin === true || currentUser?.isModerator === true) && (
```

## Files Modified

1. **components/chat/chat-container.tsx**
   - Updated delete button condition (line ~468)
   - Updated handleDeleteMessage confirmation check (line ~206)

2. **components/chat/chat-container-simple.tsx**
   - Updated delete button condition (line ~377)
   - Updated handleDeleteMessage confirmation check (line ~113)

## How It Works

### For Admins:
- Can delete any message (own or others)
- Delete button shows for all non-own messages
- Confirmation dialog shows "Admin"

### For Moderators:
- Can delete any message (own or others)
- Delete button shows for all non-own messages
- Confirmation dialog shows "Moderator"

### For Regular Users:
- Can only delete their own messages
- Delete button only shows for own messages
- No confirmation dialog needed

## Testing Checklist

- [ ] Admin can see delete button on other users' messages
- [ ] Moderator can see delete button on other users' messages
- [ ] Regular user cannot see delete button on other users' messages
- [ ] Delete button works correctly for admins
- [ ] Delete button works correctly for moderators
- [ ] Confirmation dialog shows correct role
- [ ] Message is deleted successfully
- [ ] Deletion reason is recorded ("Deleted by admin" or "Deleted by moderator")

## User Flow

1. Admin/Moderator promotes a user to moderator via admin dashboard
2. Moderator logs in or refreshes their session
3. In chat, moderator hovers over other users' messages
4. Delete button appears (red trash icon)
5. Moderator clicks delete button
6. Confirmation dialog appears: "Are you sure you want to delete this message as Moderator?"
7. Moderator confirms
8. Message is deleted and marked with deletion reason

## Notes

- The `isModerator` field is set in the database when a user is promoted
- The field is returned by the `/api/auth/me` endpoint
- The ConvexAuthProvider converts the API response to set `isModerator: userData.role === 'MODERATOR'`
- After promotion, users may need to refresh their session to see the delete button
- The strict equality check (`=== true`) ensures the button only shows when the field is explicitly `true`

# Profile Picture Upload Route Fix

## Issue
The profile picture upload route was trying to use non-existent Convex API functions:
- `api.profilePicture.getProfilePicture`
- `api.profilePicture.deleteProfilePicture`
- `api.profilePicture.updateProfilePicture`

These functions don't exist in the Convex backend.

## Solution
Updated the upload route to use existing Convex functions:
- `api.native_auth.getCurrentUserByToken` - Get current user
- `api.native_auth.updateProfile` - Update user profile with photo

## Changes Made

**File**: `app/api/user/profile-picture/upload/route.ts`

### Before
```typescript
const existingUser = await convex.query(api.profilePicture.getProfilePicture, {
  userId: userId as any,
});

if (existingUser?.type === 'personal') {
  logger.log(`🗑️ Deleting old profile picture for user ${userId}`);
  try {
    await convex.mutation(api.profilePicture.deleteProfilePicture, {
      userId: userId as any,
    });
  } catch (deleteError) {
    logger.warn('Warning: Could not delete old picture:', deleteError);
  }
}

const result = await convex.mutation(api.profilePicture.updateProfilePicture, {
  userId: userId as any,
  type: 'personal',
  urls,
  storageName,
  originalFileName: file.name,
  fileSize: cleanedFile.size,
  mimeType: file.type,
  width: dimensions.width,
  height: dimensions.height,
  aspectRatio: dimensions.aspectRatio,
  metadataStripped: true,
});
```

### After
```typescript
const existingUser = await convex.query(api.native_auth.getCurrentUserByToken, {
  token: userId as any,
});

const result = await convex.mutation(api.native_auth.updateProfile, {
  token: userId as any,
  userPhoto: dataUrl,
  usePhoto: true,
});
```

## How It Works Now

1. **Get current user**: Uses `getCurrentUserByToken` to verify the user exists
2. **Update profile**: Uses `updateProfile` to set the `userPhoto` field with the base64 data URL
3. **Enable photo**: Sets `usePhoto: true` to indicate the user is using a photo avatar

## Supported Fields in updateProfile

The `updateProfile` mutation supports:
- `displayName` - User's display name
- `avatarUrl` - Avatar URL
- `avatarName` - Avatar name
- `avatarType` - Avatar type ('basic', 'special', 'photo')
- `usePhoto` - Boolean to enable/disable photo usage
- `userPhoto` - Photo data (base64 data URL)

## Notes

- The old picture is automatically replaced when a new one is uploaded (single photo per user)
- The photo is stored as a base64 data URL in the `userPhoto` field
- The `usePhoto` flag is set to `true` to indicate the user is using a photo avatar
- In production, consider using proper file storage (S3, Cloudflare R2, etc.) instead of base64 data URLs

## TypeScript Errors Fixed

✅ All 3 TypeScript errors resolved:
- Line 129: `Property 'profilePicture' does not exist` - Fixed
- Line 136: `Property 'profilePicture' does not exist` - Fixed
- Line 147: `Property 'profilePicture' does not exist` - Fixed

## Testing

To test the upload:
1. Send a POST request to `/api/user/profile-picture/upload`
2. Include form data with `file` field containing the image
3. Include `x-user-id` header with the user ID
4. The response will include the uploaded photo data URL

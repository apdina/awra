# Profile Picture System - Implementation Guide

## Overview

A complete user profile picture system supporting personal uploads, OAuth integration, and placeholder avatars.

---

## Files Created

### 1. Documentation
- `USER_PROFILE_PICTURE_SYSTEM.md` - System overview and architecture
- `PROFILE_PICTURE_IMPLEMENTATION.md` - This file

### 2. Utilities
- `lib/profilePictureUtils.ts` - Helper functions for picture management

### 3. Database
- `convex/profilePicture.ts` - Convex mutations and queries

### 4. API Endpoints
- `app/api/user/profile-picture/upload/route.ts` - Upload personal pictures
- `app/api/user/profile-picture/oauth/route.ts` - Sync OAuth pictures
- `app/api/user/profile-picture/delete/route.ts` - Delete pictures

### 5. React Components
- `app/[locale]/components/ProfilePictureDisplay.tsx` - Display pictures
- `app/[locale]/components/ProfilePictureUpload.tsx` - Upload interface

---

## Step 1: Update Database Schema

Update `convex/schema.ts` to add profile picture field to `userProfiles`:

```typescript
profilePicture: v.optional(v.object({
  type: v.union(v.literal("personal"), v.literal("oauth"), v.literal("placeholder")),
  uploadedAt: v.optional(v.number()),
  originalFileName: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  oauthUrl: v.optional(v.string()),
  oauthProvider: v.optional(v.union(v.literal("google"), v.literal("facebook"))),
  urls: v.object({
    thumbnail: v.string(),
    medium: v.string(),
    large: v.string(),
  }),
  mimeType: v.optional(v.string()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  aspectRatio: v.optional(v.number()),
})),
```

Then deploy:
```bash
npx convex deploy
```

---

## Step 2: Initialize User Profile Pictures

When creating a new user, generate a placeholder picture:

```typescript
import { createPlaceholderPicture } from '@/lib/profilePictureUtils';

// When creating user
const placeholderPicture = createPlaceholderPicture(displayName, userId);

await convex.mutation(api.profilePicture.updateProfilePicture, {
  userId,
  type: 'placeholder',
  urls: placeholderPicture.urls,
});
```

---

## Step 3: Display Profile Pictures

Use the `ProfilePictureDisplay` component:

```typescript
import ProfilePictureDisplay from '@/app/[locale]/components/ProfilePictureDisplay';

export function UserCard({ user }) {
  return (
    <div>
      <ProfilePictureDisplay
        displayName={user.displayName}
        userId={user._id}
        profilePicture={user.profilePicture}
        size="medium"
      />
      <p>{user.displayName}</p>
    </div>
  );
}
```

### Sizes Available
- `small` - 40x40px (chat, lists)
- `medium` - 150x150px (profile cards)
- `large` - 300x300px (profile page)

---

## Step 4: Allow Users to Upload Pictures

Use the `ProfilePictureUpload` component:

```typescript
import ProfilePictureUpload from '@/app/[locale]/components/ProfilePictureUpload';

export function ProfileSettings({ user }) {
  const handleUploadSuccess = (data) => {
    console.log('Picture uploaded:', data);
    // Refresh user data
  };

  return (
    <ProfilePictureUpload
      displayName={user.displayName}
      userId={user._id}
      currentProfilePicture={user.profilePicture}
      onUploadSuccess={handleUploadSuccess}
    />
  );
}
```

---

## Step 5: OAuth Integration

When user logs in with Google/Facebook, sync their picture:

```typescript
import { createOAuthPicture } from '@/lib/profilePictureUtils';

// After OAuth login
const oauthPicture = createOAuthPicture('google', profile.picture);

await convex.mutation(api.profilePicture.syncOAuthProfilePicture, {
  userId,
  provider: 'google',
  pictureUrl: profile.picture,
});
```

### Google OAuth Example

```typescript
// In your Google OAuth callback
const profile = await getGoogleProfile(accessToken);

await convex.mutation(api.profilePicture.syncOAuthProfilePicture, {
  userId,
  provider: 'google',
  pictureUrl: profile.picture,
});
```

### Facebook OAuth Example

```typescript
// In your Facebook OAuth callback
const profile = await getFacebookProfile(accessToken);

await convex.mutation(api.profilePicture.syncOAuthProfilePicture, {
  userId,
  provider: 'facebook',
  pictureUrl: profile.picture,
});
```

---

## Step 6: Display in Chat/Lists

```typescript
import ProfilePictureDisplay from '@/app/[locale]/components/ProfilePictureDisplay';

export function ChatMessage({ message, user }) {
  return (
    <div className="flex gap-2">
      <ProfilePictureDisplay
        displayName={user.displayName}
        userId={user._id}
        profilePicture={user.profilePicture}
        size="small"
      />
      <div>
        <p className="font-semibold">{user.displayName}</p>
        <p>{message.content}</p>
      </div>
    </div>
  );
}
```

---

## API Endpoints

### Upload Personal Picture

```bash
POST /api/user/profile-picture/upload
Content-Type: multipart/form-data
x-user-id: user_id

file: <image file>
```

Response:
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "urls": {
      "thumbnail": "data:image/...",
      "medium": "data:image/...",
      "large": "data:image/..."
    },
    "dimensions": {
      "width": 1200,
      "height": 1200,
      "aspectRatio": 1
    },
    "fileSize": 245000
  }
}
```

### Sync OAuth Picture

```bash
POST /api/user/profile-picture/oauth
Content-Type: application/json
x-user-id: user_id

{
  "provider": "google",
  "pictureUrl": "https://lh3.googleusercontent.com/..."
}
```

### Delete Picture

```bash
DELETE /api/user/profile-picture/delete
x-user-id: user_id
```

---

## Convex Queries & Mutations

### Get Profile Picture

```typescript
const picture = await convex.query(api.profilePicture.getProfilePicture, {
  userId,
});
```

### Update Profile Picture

```typescript
await convex.mutation(api.profilePicture.updateProfilePicture, {
  userId,
  type: 'personal',
  urls: { thumbnail, medium, large },
  originalFileName: 'photo.jpg',
  fileSize: 245000,
  mimeType: 'image/jpeg',
  width: 1200,
  height: 1200,
  aspectRatio: 1,
});
```

### Delete Profile Picture

```typescript
await convex.mutation(api.profilePicture.deleteProfilePicture, {
  userId,
});
```

### Sync OAuth Picture

```typescript
await convex.mutation(api.profilePicture.syncOAuthProfilePicture, {
  userId,
  provider: 'google',
  pictureUrl: 'https://...',
});
```

### Get Multiple Pictures

```typescript
const pictures = await convex.query(api.profilePicture.getProfilePicturesBatch, {
  userIds: [userId1, userId2, userId3],
});
```

### Get Statistics

```typescript
const stats = await convex.query(api.profilePicture.getProfilePictureStats);
// {
//   totalUsers: 1000,
//   withPersonalPicture: 250,
//   withOAuthPicture: 500,
//   withPlaceholder: 250,
//   totalStorageBytes: 125000000
// }
```

---

## Utility Functions

### Generate Placeholder Avatar

```typescript
import { generatePlaceholderAvatar } from '@/lib/profilePictureUtils';

const urls = generatePlaceholderAvatar('John Doe', 'user_123');
// Returns: { thumbnail, medium, large } with SVG data URLs
```

### Create OAuth Picture

```typescript
import { createOAuthPicture } from '@/lib/profilePictureUtils';

const picture = createOAuthPicture('google', 'https://...');
// Returns: ProfilePicture object with provider-specific URLs
```

### Validate Image File

```typescript
import { validateImageFile } from '@/lib/profilePictureUtils';

const validation = validateImageFile(file, 5); // 5MB max
if (!validation.valid) {
  console.error(validation.error);
}
```

### Get Image Dimensions

```typescript
import { getImageDimensions } from '@/lib/profilePictureUtils';

const dims = await getImageDimensions(file);
// { width: 1200, height: 1200, aspectRatio: 1 }
```

### Get Profile Picture URL

```typescript
import { getProfilePictureUrl } from '@/lib/profilePictureUtils';

const url = getProfilePictureUrl(profilePicture, 'medium');
```

---

## Image Optimization (Production)

For production, implement image optimization:

```typescript
// In upload endpoint
import sharp from 'sharp';

const buffer = await file.arrayBuffer();

// Generate WebP versions
const thumbnail = await sharp(buffer)
  .resize(150, 150, { fit: 'cover' })
  .webp({ quality: 80 })
  .toBuffer();

const medium = await sharp(buffer)
  .resize(300, 300, { fit: 'cover' })
  .webp({ quality: 85 })
  .toBuffer();

const large = await sharp(buffer)
  .resize(600, 600, { fit: 'cover' })
  .webp({ quality: 90 })
  .toBuffer();

// Upload to Convex file storage or CDN
const thumbnailUrl = await uploadToStorage(thumbnail, 'webp');
const mediumUrl = await uploadToStorage(medium, 'webp');
const largeUrl = await uploadToStorage(large, 'webp');
```

---

## Security Considerations

### File Validation
- ✅ Check MIME type (JPG, PNG, WebP only)
- ✅ Validate file size (max 5MB)
- ✅ Scan for malicious content
- ✅ Validate file extension

### Storage
- ✅ Store in Convex file storage (encrypted)
- ✅ Use signed URLs with expiration
- ✅ Implement access control

### Privacy
- ✅ User controls picture visibility
- ✅ OAuth pictures require explicit consent
- ✅ Delete pictures on account deletion

---

## Testing

### Test Upload

```typescript
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/user/profile-picture/upload', {
  method: 'POST',
  body: formData,
  headers: { 'x-user-id': 'user_123' },
});

console.log(await response.json());
```

### Test OAuth Sync

```typescript
const response = await fetch('/api/user/profile-picture/oauth', {
  method: 'POST',
  body: JSON.stringify({
    provider: 'google',
    pictureUrl: 'https://lh3.googleusercontent.com/...',
  }),
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user_123',
  },
});

console.log(await response.json());
```

### Test Delete

```typescript
const response = await fetch('/api/user/profile-picture/delete', {
  method: 'DELETE',
  headers: { 'x-user-id': 'user_123' },
});

console.log(await response.json());
```

---

## Troubleshooting

### Picture Not Displaying

1. Check if `profilePicture` field exists in user object
2. Verify URLs are valid
3. Check browser console for image load errors
4. Ensure CORS headers are set correctly

### Upload Fails

1. Check file size (max 5MB)
2. Verify file type (JPG, PNG, WebP)
3. Check user ID is passed in header
4. Review server logs for errors

### OAuth Picture Not Syncing

1. Verify OAuth provider URL is valid
2. Check provider parameter is correct
3. Ensure user ID is passed correctly
4. Review server logs for errors

---

## Performance Tips

1. **Lazy Load Images** - Load thumbnail first, then medium/large
2. **Use WebP** - 30% smaller than JPG
3. **Cache Aggressively** - Browser cache 30 days, CDN 7 days
4. **Optimize Sizes** - Use exact dimensions (150x150, 300x300, 600x600)
5. **Batch Queries** - Use `getProfilePicturesBatch` for multiple users

---

## Future Enhancements

1. **Image Cropping** - Let users crop/adjust pictures
2. **Filters** - Apply filters to pictures
3. **Gravatar Integration** - Fallback to Gravatar
4. **Picture Gallery** - Show user's picture history
5. **Social Sharing** - Share profile with picture
6. **AI Moderation** - Detect inappropriate pictures
7. **Picture Versioning** - Keep history of pictures
8. **Bulk Upload** - Upload multiple pictures

---

## Deployment Checklist

- [ ] Update Convex schema
- [ ] Deploy Convex changes
- [ ] Create API endpoints
- [ ] Create React components
- [ ] Test upload functionality
- [ ] Test OAuth integration
- [ ] Test placeholder generation
- [ ] Test delete functionality
- [ ] Add to user profile page
- [ ] Add to chat display
- [ ] Add to user lists
- [ ] Monitor storage usage
- [ ] Set up image optimization (production)
- [ ] Configure CDN (production)

---

## Support

For questions or issues:
1. Check `USER_PROFILE_PICTURE_SYSTEM.md` for architecture
2. Review utility functions in `lib/profilePictureUtils.ts`
3. Check API endpoint implementations
4. Review component usage examples


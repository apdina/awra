# Profile Picture System - Quick Start

## 5-Minute Setup

### 1. Update Schema (1 min)

Add to `convex/schema.ts` in `userProfiles` table:

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

Deploy: `npx convex deploy`

### 2. Display Picture (1 min)

```typescript
import ProfilePictureDisplay from '@/app/[locale]/components/ProfilePictureDisplay';

<ProfilePictureDisplay
  displayName={user.displayName}
  userId={user._id}
  profilePicture={user.profilePicture}
  size="medium"
/>
```

### 3. Upload Picture (1 min)

```typescript
import ProfilePictureUpload from '@/app/[locale]/components/ProfilePictureUpload';

<ProfilePictureUpload
  displayName={user.displayName}
  userId={user._id}
  currentProfilePicture={user.profilePicture}
  onUploadSuccess={(data) => console.log('Uploaded!', data)}
/>
```

### 4. OAuth Integration (1 min)

```typescript
import { createOAuthPicture } from '@/lib/profilePictureUtils';

// After Google/Facebook login
const picture = createOAuthPicture('google', profile.picture);

await convex.mutation(api.profilePicture.syncOAuthProfilePicture, {
  userId,
  provider: 'google',
  pictureUrl: profile.picture,
});
```

### 5. Initialize New Users (1 min)

```typescript
import { createPlaceholderPicture } from '@/lib/profilePictureUtils';

// When creating user
const placeholder = createPlaceholderPicture(displayName, userId);

await convex.mutation(api.profilePicture.updateProfilePicture, {
  userId,
  type: 'placeholder',
  urls: placeholder.urls,
});
```

---

## File Structure

```
lib/
  profilePictureUtils.ts          # Helper functions

convex/
  profilePicture.ts              # Database mutations/queries

app/api/user/profile-picture/
  upload/route.ts                # Upload endpoint
  oauth/route.ts                 # OAuth sync endpoint
  delete/route.ts                # Delete endpoint

app/[locale]/components/
  ProfilePictureDisplay.tsx       # Display component
  ProfilePictureUpload.tsx        # Upload component
```

---

## Key Functions

### Display Picture
```typescript
<ProfilePictureDisplay
  displayName="John Doe"
  userId="user_123"
  profilePicture={user.profilePicture}
  size="medium"  // small, medium, large
/>
```

### Upload Picture
```typescript
<ProfilePictureUpload
  displayName="John Doe"
  userId="user_123"
  currentProfilePicture={user.profilePicture}
  onUploadSuccess={(data) => {}}
  onUploadError={(error) => {}}
/>
```

### Generate Placeholder
```typescript
import { generatePlaceholderAvatar } from '@/lib/profilePictureUtils';

const urls = generatePlaceholderAvatar('John Doe', 'user_123');
// { thumbnail, medium, large }
```

### Create OAuth Picture
```typescript
import { createOAuthPicture } from '@/lib/profilePictureUtils';

const picture = createOAuthPicture('google', 'https://...');
```

### Validate File
```typescript
import { validateImageFile } from '@/lib/profilePictureUtils';

const validation = validateImageFile(file, 5); // 5MB max
if (!validation.valid) {
  console.error(validation.error);
}
```

---

## Picture Types

### Personal Upload
- User uploads their own picture
- Stored in database
- Can be deleted by user

### OAuth Picture
- From Google/Facebook
- Synced automatically
- Refreshed periodically

### Placeholder
- Default avatar with initials
- Color-coded by user ID
- Lightweight SVG

---

## Sizes

| Size | Use | Dimensions |
|------|-----|-----------|
| small | Chat, lists | 40x40px |
| medium | Profile cards | 150x150px |
| large | Profile page | 300x300px |

---

## API Endpoints

### Upload
```bash
POST /api/user/profile-picture/upload
Content-Type: multipart/form-data
x-user-id: user_id

file: <image>
```

### OAuth Sync
```bash
POST /api/user/profile-picture/oauth
x-user-id: user_id

{ "provider": "google", "pictureUrl": "https://..." }
```

### Delete
```bash
DELETE /api/user/profile-picture/delete
x-user-id: user_id
```

---

## Convex Mutations

### Update Picture
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

### Delete Picture
```typescript
await convex.mutation(api.profilePicture.deleteProfilePicture, {
  userId,
});
```

### Sync OAuth
```typescript
await convex.mutation(api.profilePicture.syncOAuthProfilePicture, {
  userId,
  provider: 'google',
  pictureUrl: 'https://...',
});
```

---

## Convex Queries

### Get Picture
```typescript
const picture = await convex.query(api.profilePicture.getProfilePicture, {
  userId,
});
```

### Get Multiple
```typescript
const pictures = await convex.query(api.profilePicture.getProfilePicturesBatch, {
  userIds: [userId1, userId2],
});
```

### Get Stats
```typescript
const stats = await convex.query(api.profilePicture.getProfilePictureStats);
```

---

## Common Patterns

### Display in Chat
```typescript
<div className="flex gap-2">
  <ProfilePictureDisplay
    displayName={user.displayName}
    userId={user._id}
    profilePicture={user.profilePicture}
    size="small"
  />
  <div>
    <p>{user.displayName}</p>
    <p>{message.content}</p>
  </div>
</div>
```

### Display in User List
```typescript
{users.map(user => (
  <div key={user._id} className="flex items-center gap-2">
    <ProfilePictureDisplay
      displayName={user.displayName}
      userId={user._id}
      profilePicture={user.profilePicture}
      size="small"
    />
    <p>{user.displayName}</p>
  </div>
))}
```

### Profile Settings
```typescript
<div className="space-y-4">
  <h2>Profile Picture</h2>
  <ProfilePictureUpload
    displayName={user.displayName}
    userId={user._id}
    currentProfilePicture={user.profilePicture}
    onUploadSuccess={() => {
      // Refresh user data
    }}
  />
</div>
```

---

## Supported Formats

- JPG/JPEG
- PNG
- WebP

**Max Size:** 5MB

---

## Troubleshooting

### Picture not showing?
1. Check `profilePicture` field exists
2. Verify URLs are valid
3. Check browser console for errors

### Upload fails?
1. Check file size < 5MB
2. Verify file type (JPG, PNG, WebP)
3. Check user ID in header
4. Review server logs

### OAuth not syncing?
1. Verify provider URL is valid
2. Check provider is 'google' or 'facebook'
3. Ensure user ID is correct
4. Review server logs

---

## Next Steps

1. ✅ Update schema
2. ✅ Deploy Convex
3. ✅ Add display component
4. ✅ Add upload component
5. ✅ Integrate OAuth
6. ✅ Test all features
7. ✅ Monitor storage

---

## Files Included

- `USER_PROFILE_PICTURE_SYSTEM.md` - Full documentation
- `PROFILE_PICTURE_IMPLEMENTATION.md` - Detailed guide
- `PROFILE_PICTURE_QUICK_START.md` - This file
- `lib/profilePictureUtils.ts` - Utilities
- `convex/profilePicture.ts` - Database layer
- `app/api/user/profile-picture/upload/route.ts` - Upload API
- `app/api/user/profile-picture/oauth/route.ts` - OAuth API
- `app/api/user/profile-picture/delete/route.ts` - Delete API
- `app/[locale]/components/ProfilePictureDisplay.tsx` - Display component
- `app/[locale]/components/ProfilePictureUpload.tsx` - Upload component

---

## Support

See `PROFILE_PICTURE_IMPLEMENTATION.md` for detailed documentation.


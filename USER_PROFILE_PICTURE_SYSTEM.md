# User Profile Picture System

## Overview

A flexible profile picture system that supports:
- Personal picture uploads (JPG, PNG, WebP)
- Default placeholder avatars
- OAuth integration (Google, Facebook)
- Optimized image sizes and formats
- Progressive enhancement

---

## Architecture

### Picture Types

1. **Personal Upload** - User uploads their own picture
   - Stored in Convex file storage
   - Optimized sizes: 150px, 300px, 600px
   - Formats: WebP (primary), JPG (fallback)

2. **OAuth Picture** - From Google/Facebook
   - Cached locally with user permission
   - Fallback to provider URL if needed
   - Optimized sizes: 150px, 300px, 600px

3. **Default Placeholder** - System default
   - Initials-based avatar (user's first letter)
   - Color-coded by user ID
   - Lightweight SVG or PNG

### Image Sizes

| Size | Use Case | Dimensions |
|------|----------|-----------|
| Thumbnail | Chat, lists | 150x150px |
| Medium | Profile page | 300x300px |
| Large | Full profile | 600x600px |

### Supported Formats

- **Primary:** WebP (modern browsers, ~30% smaller)
- **Fallback:** JPG (universal support)
- **Placeholder:** SVG (scalable, lightweight)

---

## Database Schema

### Updated userProfiles Table

```typescript
// Profile picture fields
profilePicture: {
  type: 'personal' | 'oauth' | 'placeholder',
  
  // For personal uploads
  uploadedAt: number,
  originalFileName: string,
  fileSize: number,
  
  // For OAuth pictures
  oauthUrl: string,
  oauthProvider: 'google' | 'facebook',
  
  // For all types
  urls: {
    thumbnail: string,    // 150x150
    medium: string,       // 300x300
    large: string,        // 600x600
  },
  
  // Metadata
  mimeType: string,
  width: number,
  height: number,
  aspectRatio: number,
}
```

---

## Implementation

### 1. Schema Update

Add to `convex/schema.ts`:

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

### 2. API Endpoints

- `POST /api/user/profile-picture/upload` - Upload personal picture
- `POST /api/user/profile-picture/oauth` - Store OAuth picture
- `GET /api/user/profile-picture/:userId/:size` - Get picture
- `DELETE /api/user/profile-picture` - Delete personal picture

### 3. Utility Functions

- `generatePlaceholder()` - Create initials avatar
- `optimizeImage()` - Resize and convert to WebP
- `getProfilePictureUrl()` - Get appropriate URL with fallback

---

## Usage Examples

### Upload Personal Picture

```typescript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/user/profile-picture/upload', {
  method: 'POST',
  body: formData,
});

const { urls } = await response.json();
// urls.thumbnail, urls.medium, urls.large
```

### Display Picture

```typescript
<img
  src={user.profilePicture?.urls.medium}
  alt={user.displayName}
  width={300}
  height={300}
  className="rounded-full"
/>
```

### OAuth Integration

```typescript
// After Google/Facebook login
const oauthPicture = {
  type: 'oauth',
  oauthProvider: 'google',
  oauthUrl: profile.picture,
  urls: {
    thumbnail: `${profile.picture}?sz=150`,
    medium: `${profile.picture}?sz=300`,
    large: `${profile.picture}?sz=600`,
  },
};

await updateUserProfile({ profilePicture: oauthPicture });
```

---

## File Size Limits

- Maximum upload: 5MB
- Recommended: 1-2MB
- After optimization: ~200KB (thumbnail), ~400KB (medium), ~800KB (large)

---

## Security Considerations

1. **File Validation**
   - Check MIME type (JPG, PNG, WebP only)
   - Validate file size
   - Scan for malicious content

2. **Storage**
   - Store in Convex file storage (encrypted)
   - Use signed URLs with expiration
   - Implement access control

3. **Privacy**
   - User controls picture visibility
   - OAuth pictures require explicit consent
   - Delete pictures on account deletion

---

## Fallback Strategy

1. Try personal upload
2. Try OAuth picture
3. Try cached OAuth picture
4. Fall back to placeholder

---

## Performance Optimization

1. **Image Optimization**
   - Convert to WebP (30% smaller)
   - Resize to exact dimensions
   - Strip metadata

2. **Caching**
   - Browser cache: 30 days
   - CDN cache: 7 days
   - Convex cache: 1 hour

3. **Lazy Loading**
   - Load thumbnail first
   - Progressive enhancement to medium/large
   - Blur-up effect while loading

---

## Migration Path

For existing users:
1. Generate placeholder avatars
2. Migrate OAuth pictures if available
3. Allow users to upload personal pictures
4. Deprecate old avatar system

---

## Future Enhancements

1. **Image Cropping** - Let users crop/adjust pictures
2. **Filters** - Apply filters to pictures
3. **Gravatar Integration** - Fallback to Gravatar
4. **Picture Gallery** - Show user's picture history
5. **Social Sharing** - Share profile with picture


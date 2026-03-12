# Profile Picture System - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Profile Picture System              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      Picture Types                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Personal   │  │    OAuth    │  │ Placeholder │         │
│  │   Upload    │  │  (Google/FB)│  │  (Initials) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  • User uploads   • Auto-synced   • Default avatar         │
│  • Stored locally • Provider URL  • Color-coded            │
│  • Can delete     • Refreshed     • Always available       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Image Sizes                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Thumbnail (150x150)    Medium (300x300)    Large (600x600) │
│  ┌──────────────┐       ┌──────────────┐    ┌──────────────┐│
│  │              │       │              │    │              ││
│  │   Chat       │       │   Profile    │    │   Full       ││
│  │   Lists      │       │   Cards      │    │   Profile    ││
│  │              │       │              │    │              ││
│  └──────────────┘       └──────────────┘    └──────────────┘│
│                                                              │
│  ~50KB                  ~100KB               ~200KB         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Data Flow                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Upload Flow:                                               │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │  User   │───▶│ Validate │───▶│ Optimize │───▶│ Store  │ │
│  │ Selects │    │   File   │    │  Image   │    │  in DB │ │
│  └─────────┘    └──────────┘    └──────────┘    └────────┘ │
│                                                              │
│  OAuth Flow:                                                │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │  OAuth  │───▶│ Get URL  │───▶│ Generate │───▶│ Store  │ │
│  │  Login  │    │ from API │    │   URLs   │    │  in DB │ │
│  └─────────┘    └──────────┘    └──────────┘    └────────┘ │
│                                                              │
│  Display Flow:                                              │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │  Get    │───▶│ Fetch    │───▶│ Fallback │───▶│ Render │ │
│  │ Picture │    │   URLs   │    │ to       │    │  Image │ │
│  └─────────┘    └──────────┘    │Placeholder    └────────┘ │
│                                  └──────────┘               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Usage

### Display Component

```
┌─────────────────────────────────────────┐
│   ProfilePictureDisplay                 │
├─────────────────────────────────────────┤
│                                         │
│  Props:                                 │
│  • displayName: string                  │
│  • userId: string                       │
│  • profilePicture?: ProfilePicture      │
│  • size?: 'small' | 'medium' | 'large'  │
│  • className?: string                   │
│  • showBorder?: boolean                 │
│  • onClick?: () => void                 │
│                                         │
│  Returns:                               │
│  ┌─────────────────────────────────┐   │
│  │  [Profile Picture Image]        │   │
│  │  with fallback to placeholder   │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Upload Component

```
┌─────────────────────────────────────────┐
│   ProfilePictureUpload                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Profile Picture Display]      │   │
│  │  with upload button             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Upload Progress Bar]          │   │
│  │  (when uploading)               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Error/Success Message]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Delete Button]                │   │
│  │  (if personal picture)          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Props:                                 │
│  • displayName: string                  │
│  • userId: string                       │
│  • currentProfilePicture?: ProfilePic   │
│  • onUploadSuccess?: (data) => void     │
│  • onUploadError?: (error) => void      │
│  • onDelete?: () => void                │
│                                         │
└─────────────────────────────────────────┘
```

---

## File Organization

```
project/
├── lib/
│   └── profilePictureUtils.ts
│       ├── generatePlaceholderAvatar()
│       ├── createPlaceholderPicture()
│       ├── createOAuthPicture()
│       ├── validateImageFile()
│       ├── getImageDimensions()
│       ├── getProfilePictureUrl()
│       ├── formatFileSize()
│       ├── isOAuthPictureExpired()
│       └── logProfilePictureAction()
│
├── convex/
│   └── profilePicture.ts
│       ├── getProfilePicture()
│       ├── updateProfilePicture()
│       ├── deleteProfilePicture()
│       ├── syncOAuthProfilePicture()
│       ├── getProfilePicturesBatch()
│       ├── hasPersonalProfilePicture()
│       ├── getProfilePictureStats()
│       └── cleanupExpiredOAuthPictures()
│
├── app/api/user/profile-picture/
│   ├── upload/
│   │   └── route.ts
│   ├── oauth/
│   │   └── route.ts
│   └── delete/
│       └── route.ts
│
└── app/[locale]/components/
    ├── ProfilePictureDisplay.tsx
    └── ProfilePictureUpload.tsx
```

---

## Database Schema

```
userProfiles
├── _id: Id
├── displayName: string
├── email: string
├── ...other fields...
│
└── profilePicture: {
    ├── type: 'personal' | 'oauth' | 'placeholder'
    ├── uploadedAt?: number
    ├── originalFileName?: string
    ├── fileSize?: number
    ├── oauthUrl?: string
    ├── oauthProvider?: 'google' | 'facebook'
    ├── urls: {
    │   ├── thumbnail: string (150x150)
    │   ├── medium: string (300x300)
    │   └── large: string (600x600)
    │}
    ├── mimeType?: string
    ├── width?: number
    ├── height?: number
    └── aspectRatio?: number
}
```

---

## API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoints                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Upload Personal Picture                                   │
│  POST /api/user/profile-picture/upload                     │
│  ├── Request:                                              │
│  │   Content-Type: multipart/form-data                     │
│  │   x-user-id: user_id                                    │
│  │   file: <image file>                                    │
│  │                                                         │
│  └── Response:                                             │
│      {                                                     │
│        "success": true,                                    │
│        "data": {                                           │
│          "urls": { thumbnail, medium, large },            │
│          "dimensions": { width, height, aspectRatio },    │
│          "fileSize": 245000                               │
│        }                                                   │
│      }                                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sync OAuth Picture                                        │
│  POST /api/user/profile-picture/oauth                      │
│  ├── Request:                                              │
│  │   Content-Type: application/json                        │
│  │   x-user-id: user_id                                    │
│  │   {                                                     │
│  │     "provider": "google",                               │
│  │     "pictureUrl": "https://..."                         │
│  │   }                                                     │
│  │                                                         │
│  └── Response:                                             │
│      {                                                     │
│        "success": true,                                    │
│        "message": "Profile picture synced from google"     │
│      }                                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Delete Picture                                            │
│  DELETE /api/user/profile-picture/delete                   │
│  ├── Request:                                              │
│  │   x-user-id: user_id                                    │
│  │                                                         │
│  └── Response:                                             │
│      {                                                     │
│        "success": true,                                    │
│        "message": "Profile picture deleted successfully"   │
│      }                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Picture Fallback Strategy

```
┌─────────────────────────────────────────┐
│  Get Profile Picture URL                │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Has Personal Picture?                  │
└─────────────────────────────────────────┘
    │                    │
   YES                   NO
    │                    │
    ▼                    ▼
┌──────────────┐  ┌─────────────────────┐
│ Use Personal │  │ Has OAuth Picture?  │
│   Picture    │  └─────────────────────┘
└──────────────┘      │            │
                     YES           NO
                      │            │
                      ▼            ▼
                  ┌──────────┐  ┌──────────────┐
                  │Use OAuth │  │Use Placeholder
                  │ Picture  │  │   Avatar
                  └──────────┘  └──────────────┘
```

---

## Image Optimization Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  Upload Image                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Validate File                                           │
│     • Check MIME type (JPG, PNG, WebP)                      │
│     • Check file size (max 5MB)                             │
│     • Check extension                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Get Image Dimensions                                    │
│     • Load image                                            │
│     • Extract width, height                                 │
│     • Calculate aspect ratio                                │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Generate Optimized Versions (Production)                │
│     • Resize to 150x150 (thumbnail)                         │
│     • Resize to 300x300 (medium)                            │
│     • Resize to 600x600 (large)                             │
│     • Convert to WebP                                       │
│     • Compress with quality settings                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Store in Database                                       │
│     • Save URLs                                             │
│     • Save metadata                                         │
│     • Save file info                                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Return to Client                                        │
│     • URLs for all sizes                                    │
│     • Dimensions                                            │
│     • File size                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage Flow

### Upload Flow

```
User
  │
  ├─ Click upload button
  │
  ├─ Select image file
  │
  ├─ Component validates file
  │
  ├─ POST /api/user/profile-picture/upload
  │
  ├─ Server validates & optimizes
  │
  ├─ Store in Convex database
  │
  ├─ Return URLs
  │
  └─ Display new picture
```

### OAuth Flow

```
User
  │
  ├─ Click "Login with Google"
  │
  ├─ OAuth provider returns profile
  │
  ├─ Extract picture URL
  │
  ├─ POST /api/user/profile-picture/oauth
  │
  ├─ Server stores OAuth picture
  │
  ├─ Generate provider-specific URLs
  │
  └─ Display picture
```

### Display Flow

```
Component
  │
  ├─ Get user data
  │
  ├─ Check profilePicture field
  │
  ├─ Get appropriate size URL
  │
  ├─ Load image
  │
  ├─ On error, fallback to placeholder
  │
  └─ Render image
```

---

## Size Comparison

```
┌──────────────────────────────────────────────────────────────┐
│                    File Sizes                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Original Image (1200x1200)                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ JPG: ~500KB  │  PNG: ~800KB  │  WebP: ~350KB          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Thumbnail (150x150)                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ JPG: ~15KB   │  PNG: ~25KB   │  WebP: ~10KB           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Medium (300x300)                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ JPG: ~40KB   │  PNG: ~70KB   │  WebP: ~28KB           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Large (600x600)                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ JPG: ~120KB  │  PNG: ~200KB  │  WebP: ~85KB           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  WebP saves ~30% compared to JPG                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Placeholder Avatar Generation

```
┌─────────────────────────────────────────────────────────────┐
│              Placeholder Avatar Generation                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: displayName, userId                                │
│                                                             │
│  1. Extract Initials                                        │
│     "John Doe" → "JD"                                       │
│     "Alice" → "A"                                           │
│                                                             │
│  2. Generate Color                                          │
│     userId.charCodeAt(0) % 10 → color index                │
│     Colors: Red, Teal, Blue, Salmon, Mint, Yellow, etc.    │
│                                                             │
│  3. Create SVG                                              │
│     ┌─────────────────────────────────────────┐            │
│     │  ┌─────────────────────────────────┐   │            │
│     │  │  [Colored Background]           │   │            │
│     │  │                                 │   │            │
│     │  │         JD                      │   │            │
│     │  │      (Large Text)               │   │            │
│     │  │                                 │   │            │
│     │  └─────────────────────────────────┘   │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
│  4. Convert to Data URL                                     │
│     data:image/svg+xml;base64,...                           │
│                                                             │
│  Output: SVG data URL (scalable, lightweight)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                  Integration Points                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User Registration                                       │
│     └─ Generate placeholder avatar                         │
│                                                             │
│  2. OAuth Login                                             │
│     └─ Sync picture from provider                          │
│                                                             │
│  3. Profile Settings                                        │
│     └─ Allow picture upload/delete                         │
│                                                             │
│  4. Chat Display                                            │
│     └─ Show thumbnail picture                              │
│                                                             │
│  5. User Lists                                              │
│     └─ Show small picture                                  │
│                                                             │
│  6. Profile Page                                            │
│     └─ Show large picture                                  │
│                                                             │
│  7. Admin Dashboard                                         │
│     └─ Show picture statistics                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Metrics

```
┌──────────────────────────────────────────────────────────────┐
│                  Performance Targets                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Upload Time                                                │
│  • File validation: < 100ms                                 │
│  • Image optimization: < 500ms                              │
│  • Database store: < 100ms                                  │
│  • Total: < 1 second                                        │
│                                                              │
│  Display Time                                               │
│  • Fetch from DB: < 50ms                                    │
│  • Image load: < 500ms                                      │
│  • Render: < 100ms                                          │
│  • Total: < 1 second                                        │
│                                                              │
│  Storage                                                    │
│  • Per user: ~300KB (all sizes)                             │
│  • 1000 users: ~300MB                                       │
│  • 10000 users: ~3GB                                        │
│                                                              │
│  Bandwidth                                                  │
│  • Thumbnail: ~10KB per load                                │
│  • Medium: ~28KB per load                                   │
│  • Large: ~85KB per load                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. File Validation                                         │
│     ├─ MIME type check                                      │
│     ├─ File size limit                                      │
│     └─ Extension validation                                 │
│                                                              │
│  2. Storage Security                                        │
│     ├─ Encrypted storage                                    │
│     ├─ Access control                                       │
│     └─ Signed URLs                                          │
│                                                              │
│  3. Privacy Control                                         │
│     ├─ User-controlled visibility                           │
│     ├─ OAuth consent                                        │
│     └─ Account deletion cleanup                             │
│                                                              │
│  4. Audit Trail                                             │
│     ├─ Action logging                                       │
│     ├─ User tracking                                        │
│     └─ Timestamp recording                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

This visual guide provides a comprehensive overview of the profile picture system architecture, components, and workflows.


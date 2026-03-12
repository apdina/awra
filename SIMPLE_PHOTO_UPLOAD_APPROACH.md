# Simple Photo Upload Approach

## What Changed

Switched from complex API-based photo upload to a **simple, direct approach**:

### Before (Complex)
- Upload API endpoint
- Metadata stripping
- Image dimension extraction
- Multiple file sizes
- Complex error handling

### After (Simple)
- Direct base64 encoding
- Store in user profile
- Remember user's choice (avatar vs photo)
- One simple component
- Minimal dependencies

---

## How It Works

### 1. User Uploads Photo

```
User clicks camera icon
    ↓
Selects image file (JPG, PNG, WebP)
    ↓
Component validates:
  ├─ File size < 1MB
  ├─ MIME type check
    ↓
Convert to base64
    ↓
Save to user profile:
  ├─ userPhoto: base64 string
  ├─ usePhoto: true
```

### 2. User Switches Between Avatar & Photo

```
User clicks "Basic Avatars" tab
    ↓
Component calls onSelect()
    ↓
Updates user profile:
  ├─ avatarName: "young_mas"
  ├─ avatarType: "basic"
  ├─ usePhoto: false
    ↓
Avatar is displayed

---

User clicks "📸 Use Photo" tab
    ↓
Component shows photo upload
    ↓
User uploads photo
    ↓
Updates user profile:
  ├─ userPhoto: base64 string
  ├─ usePhoto: true
    ↓
Photo is displayed
```

### 3. Display Logic

```typescript
// In UserAvatar component
if (user.usePhoto && user.userPhoto) {
  return <img src={user.userPhoto} />;  // Show photo
}

// Otherwise show avatar
return <img src={getAvatarPath(user.avatarName)} />;
```

---

## Database Schema Changes

### Added to userProfiles:

```typescript
// User's photo choice
usePhoto: v.optional(v.boolean()),  // true = use photo, false = use avatar
userPhoto: v.optional(v.string()),  // Base64 encoded photo data
```

### Removed:
- Complex `profilePicture` object
- All the nested fields

---

## Files Changed

### 1. `convex/schema.ts`
- Removed complex `profilePicture` object
- Added simple `usePhoto` boolean
- Added `userPhoto` base64 string

### 2. `app/[locale]/components/SimplePhotoUpload.tsx` (NEW)
- Simple photo upload component
- Converts to base64
- Stores directly in user profile
- No API calls needed

### 3. `components/AvatarSelector.tsx`
- Updated to use `SimplePhotoUpload`
- Removed `ProfilePictureUpload` import
- Simplified props

### 4. `app/[locale]/account/page.tsx`
- Updated props passed to AvatarSelector
- Removed complex photo-related props

---

## How to Use

### In Account Settings:

```typescript
<AvatarSelector
  currentAvatarName={user?.avatarName}
  currentAvatarType={user?.avatarType}
  usePhoto={user?.usePhoto}
  userPhoto={user?.userPhoto}
  onSelect={handleAvatarSelect}
  onPhotoUpload={() => {
    // Refresh user data
  }}
/>
```

### Display User Avatar:

```typescript
// In UserAvatar component
if (user?.usePhoto && user?.userPhoto) {
  return (
    <img
      src={user.userPhoto}
      alt={user.displayName}
      className="w-10 h-10 rounded-full"
    />
  );
}

// Show avatar instead
return (
  <img
    src={getAvatarPath(user?.avatarName, user?.avatarType)}
    alt={user?.displayName}
    className="w-10 h-10 rounded-full"
  />
);
```

---

## Advantages

✅ **Simple** - No complex API endpoints
✅ **Direct** - Base64 stored in user profile
✅ **Fast** - No server processing needed
✅ **Reliable** - No metadata stripping issues
✅ **Easy to debug** - All data in one place
✅ **Minimal dependencies** - Just FileReader API
✅ **Works offline** - No API calls needed

---

## Limitations

⚠️ **Base64 size** - Increases user profile size
  - 1MB image → ~1.3MB base64
  - For 1000 users with photos: ~1.3GB

**Solution:** If storage becomes an issue, can migrate to proper file storage later

---

## File Size Handling

```typescript
// Validation in SimplePhotoUpload
if (file.size > 1024 * 1024) {  // 1MB
  setError('File size must be less than 1MB');
  return;
}
```

---

## User Flow

### First Time User

```
1. Go to Account Settings
2. Click "Change Avatar"
3. See three tabs:
   - Basic Avatars
   - Special Avatars
   - 📸 Use Photo
4. Click "📸 Use Photo"
5. Click camera icon
6. Select image
7. Photo is saved and displayed
```

### Switching Back to Avatar

```
1. Click "Basic Avatars" tab
2. Select avatar
3. Avatar replaces photo
4. usePhoto = false
```

### Uploading New Photo

```
1. Click "📸 Use Photo" tab
2. Click camera icon
3. Select new image
4. Old photo is replaced
5. New photo is displayed
```

---

## Testing

- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Upload WebP image
- [ ] Reject file > 1MB
- [ ] Reject non-image files
- [ ] Switch to avatar (photo removed)
- [ ] Switch back to photo
- [ ] Delete photo
- [ ] Upload new photo (old one replaced)
- [ ] Verify photo displays in chat
- [ ] Verify photo displays in user list
- [ ] Test on mobile

---

## Next Steps

1. Delete old `convex/_generated` folder
2. Run `npx convex dev`
3. Test photo upload
4. Update `UserAvatar` component to check `usePhoto`
5. Test avatar/photo switching

---

## Summary

✅ **Simpler approach**
✅ **No complex API**
✅ **Direct base64 storage**
✅ **Remember user choice**
✅ **Easy to implement**
✅ **Works immediately**

---

**Status:** Ready to test
**Date:** March 11, 2026


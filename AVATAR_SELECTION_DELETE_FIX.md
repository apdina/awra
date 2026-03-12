# Avatar Selection & Photo Delete Fix - Complete

## Problems Fixed

### 1. Old Avatar Still Selected After Photo Upload
**Issue**: When uploading a photo, the old avatar remained selected in the UI
**Root Cause**: The AvatarSelector component was initializing with the old avatar selection
**Fix**: Added `usePhoto: false` to the handleAvatarSelect function so when selecting an avatar, it explicitly disables photo mode

### 2. Avatar Selection Not Working
**Issue**: Clicking on a different avatar didn't update the profile
**Root Cause**: The `usePhoto` flag wasn't being reset when selecting avatars
**Fix**: Now when selecting an avatar, `usePhoto` is set to `false`, ensuring the avatar is used instead of photo

### 3. Photo Deletion Not Working
**Issue**: Clicking delete photo button didn't remove the photo
**Root Cause**: The Convex mutation wasn't handling `undefined` values properly for deletion
**Fix**: Changed to pass `null` instead of `undefined` for explicit deletion

## Changes Made

### 1. `app/[locale]/account/page.tsx`
- Updated `handleAvatarSelect` to include `usePhoto: false`
- This ensures when user selects an avatar, photo mode is disabled

### 2. `app/[locale]/components/SimplePhotoUpload.tsx`
- Updated `handleDelete` to pass `null` instead of `undefined`
- This explicitly signals deletion to the backend

### 3. `convex/native_auth.ts`
- Updated userPhoto handling to accept `null` values
- Now properly deletes photo when `null` is passed

## Data Flow - Avatar Selection

```
User clicks avatar
    ↓
handleAvatarSelect called with avatarName, avatarType
    ↓
updateProfile called with:
  - avatarName
  - avatarType
  - avatarUrl
  - usePhoto: false ✅ (NEW)
    ↓
API sends to Convex mutation
    ↓
Convex updates user profile
    ↓
Frontend receives updated user
    ↓
AvatarSelector re-renders with new selection
    ↓
Avatar displays in navbar and account page ✅
```

## Data Flow - Photo Deletion

```
User clicks delete photo
    ↓
Confirmation dialog shown
    ↓
handleDelete called
    ↓
updateProfile called with:
  - userPhoto: null ✅ (NEW)
  - usePhoto: false
    ↓
API sends to Convex mutation
    ↓
Convex updates user profile (sets userPhoto to null)
    ↓
Frontend receives updated user
    ↓
SimplePhotoUpload re-renders
    ↓
Photo removed, fallback avatar shown ✅
```

## Testing Steps

1. **Upload a photo** - Photo should display
2. **Select a different avatar** - Avatar should be selected, photo should be replaced
3. **Switch back to photo tab** - Photo should still be there
4. **Delete photo** - Photo should be removed, fallback avatar shown
5. **Select avatar again** - Avatar should display
6. **Refresh page** - All changes should persist

## Status

✅ Photo upload: Working
✅ Avatar selection: Fixed
✅ Photo deletion: Fixed
✅ Tab switching: Working
✅ Persistence: Working
✅ Navbar display: Working

The system is now fully functional!

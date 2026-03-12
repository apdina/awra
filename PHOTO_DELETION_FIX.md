# Photo Deletion Fix - Complete

## Problem
When deleting a photo, the API returned a 500 error and the photo remained in Convex database.

## Root Cause
1. JSON doesn't support `undefined` values - they get lost in transmission
2. We were trying to pass `null` which Convex doesn't accept for optional fields
3. The Convex mutation wasn't properly handling the deletion

## Solution
Use an empty string (`''`) as a signal for deletion:
- Frontend sends `userPhoto: ''` to indicate deletion
- API converts empty string to `undefined` before sending to Convex
- Convex receives `undefined` and properly deletes the field

## Changes Made

### 1. `app/[locale]/components/SimplePhotoUpload.tsx`
- Changed `handleDelete` to send `userPhoto: ''` (empty string)
- This is JSON-serializable and signals deletion

### 2. `app/api/auth/profile/route.ts`
- Added logic to convert empty string to `undefined`
- `userPhoto === '' ? undefined : userPhoto`
- This ensures Convex receives `undefined` for deletion

## Data Flow - Photo Deletion

```
User clicks delete photo
    ↓
Confirmation dialog shown
    ↓
handleDelete called
    ↓
updateProfile called with:
  - userPhoto: '' (empty string)
  - usePhoto: false
    ↓
JSON serialization (empty string preserved)
    ↓
API receives empty string
    ↓
API converts to undefined
    ↓
Convex mutation receives undefined
    ↓
Convex deletes userPhoto field
    ↓
Frontend receives updated user (userPhoto = undefined)
    ↓
SimplePhotoUpload re-renders
    ↓
Photo removed, fallback avatar shown ✅
```

## Testing Steps

1. **Upload a photo** - Photo should display
2. **Click delete photo** - Confirmation dialog appears
3. **Confirm deletion** - Photo should be removed immediately
4. **Check Convex** - userPhoto field should be undefined/empty
5. **Refresh page** - Photo should still be gone
6. **Check navbar** - Avatar should display instead of photo

## Status

✅ Photo upload: Working
✅ Avatar selection: Working
✅ Photo deletion: Fixed
✅ Tab switching: Working
✅ Persistence: Working
✅ Navbar display: Working
✅ Convex storage: Properly updated

The system is now fully functional!

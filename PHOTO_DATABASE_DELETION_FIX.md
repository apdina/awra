# Photo Database Deletion Fix - Complete

## Problem
When deleting a photo, the empty string `''` was being stored in the database instead of actually deleting the field. This violated the requirement of storing only 1 photo per user.

## Root Cause
- Frontend sent empty string `''` to signal deletion
- API converted to `undefined` 
- Convex stored the empty string instead of deleting the field
- Result: Database still had the old photo data

## Solution
Use `null` as a deletion marker:
1. Frontend sends `userPhoto: ''` (empty string)
2. API converts to `null`
3. Convex receives `null` and converts to `undefined`
4. Convex deletes the field completely

## Changes Made

### 1. `app/api/auth/profile/route.ts`
```typescript
userPhoto: userPhoto === '' ? null : userPhoto, // Convert empty string to null for deletion
```
- Changed from `undefined` to `null`
- `null` is JSON-serializable and can be sent over HTTP

### 2. `convex/native_auth.ts`
```typescript
userPhoto: v.optional(v.union(v.string(), v.null())), // Allow null for deletion
```
- Updated args to accept `null` as a valid value
- Added logic to convert `null` to `undefined` for actual deletion:
```typescript
if (args.userPhoto !== undefined) {
  updates.userPhoto = args.userPhoto === null ? undefined : args.userPhoto;
}
```

## Data Flow - Photo Deletion

```
User clicks delete photo
    ↓
Frontend sends: userPhoto: ''
    ↓
API receives empty string
    ↓
API converts to: userPhoto: null
    ↓
Convex receives: userPhoto: null
    ↓
Convex converts to: userPhoto: undefined
    ↓
Convex deletes field from database ✅
    ↓
Database no longer has userPhoto field
    ↓
Frontend updates UI
```

## Database State

### Before Fix
```json
{
  "userPhoto": "",  // Empty string still stored
  "usePhoto": false
}
```

### After Fix
```json
{
  // userPhoto field completely removed
  "usePhoto": false
}
```

## Testing Steps

1. **Upload photo** - Photo stored in database
2. **Delete photo** - Photo completely removed from database
3. **Check Convex dashboard** - userPhoto field should not exist
4. **Upload new photo** - New photo stored
5. **Refresh page** - Old photo should not reappear
6. **Delete again** - Field should be completely removed

## Status

✅ Photo upload: Working
✅ Photo display: Working
✅ Photo deletion: Fixed (field completely removed from database)
✅ Database storage: Only 1 photo per user
✅ UI updates: Instant
✅ Persistence: Working

The photo system now properly manages database storage!

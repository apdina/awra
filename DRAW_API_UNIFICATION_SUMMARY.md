# Draw API Unification - Summary

## What Changed

### Before (Multiple APIs)
- `/api/countdown` - Countdown data only
- `/api/current-draw` - Current draw info only
- Two separate data sources
- Admin changes not always reflected
- Draw increment delayed until cron job

### After (Single Unified API)
- `/api/draw` - Single source of truth
- `?type=countdown` - Countdown data
- `?type=current` - Current draw info (default)
- One data source for everything
- Admin changes immediately reflected
- Draw auto-increments when time passes

## Key Improvements

### 1. Single Source of Truth
**Problem:** Draw time stored in two places:
- `systemConfig.default_draw_time` (global setting)
- Individual draw's `draw_time` field

**Solution:** Always read from `systemConfig.default_draw_time`
- Admin changes immediately reflected everywhere
- No sync issues

### 2. Automatic Draw Increment
**Problem:** Countdown showed expired draw until cron job ran

**Solution:** API detects when draw time passes and auto-increments
- Seamless transition to next draw
- No waiting for cron job
- Happens on first request after draw time

### 3. Consistent Caching
**Problem:** Different caching strategies across endpoints

**Solution:** Unified caching strategy
- Normal: 10 seconds cache + 30 seconds stale-while-revalidate
- When incremented: No cache (immediate update)
- Force refresh: Add `?t=<timestamp>`

## How to Use

### For Frontend (SimpleCountdown Component)

**Current code (still works):**
```typescript
const response = await fetch('/api/countdown');
```

**Recommended (new):**
```typescript
const response = await fetch('/api/draw?type=countdown');
```

### For Admin Dashboard

No changes needed - already uses Convex mutations directly.

## Testing

### Test 1: Admin Changes Draw Time
1. Go to admin dashboard
2. Change draw time (e.g., 21:40 → 22:00)
3. Check countdown - should show new time immediately
4. Verify all clients see the new time

### Test 2: Draw Auto-Increment
1. Wait until draw time passes
2. Refresh countdown page
3. Should show next draw (e.g., 12/03 instead of 11/03)
4. No manual intervention needed

### Test 3: Caching Works
1. Refresh countdown multiple times
2. Should see `cached: true` in response
3. After draw increments, should see `cached: false`
4. Then `cached: true` again for next draw

## Files Changed

### New Files
- `app/api/draw/route.ts` - Unified draw API

### Modified Files
- `app/api/countdown/route.ts` - Now proxies to `/api/draw`
- `app/api/current-draw/route.ts` - Now proxies to `/api/draw`

### Documentation
- `UNIFIED_DRAW_API.md` - Complete API documentation
- `DRAW_API_UNIFICATION_SUMMARY.md` - This file

## Backward Compatibility

✅ All existing endpoints still work:
- `/api/countdown` → proxies to `/api/draw?type=countdown`
- `/api/current-draw` → proxies to `/api/draw?type=current`

No breaking changes for existing code.

## Performance Impact

**Positive:**
- Fewer database queries (parallel fetch of draw + config)
- Consistent caching reduces load
- Auto-increment prevents stale data

**Neutral:**
- Slightly more data in response (includes countdown in current draw)
- Can be ignored if not needed

## Troubleshooting

### Countdown Not Updating After Admin Change
1. Check `systemConfig.default_draw_time` in database
2. Clear browser cache or add `?t=<timestamp>`
3. Wait 10 seconds for cache to expire

### Draw Not Auto-Incrementing
1. Check `ADMIN_SECRET` environment variable is set
2. Check server logs for errors
3. Manually trigger: `/api/admin/check-and-increment-draw`

### Getting Old Draw Time
1. Verify admin change was saved
2. Check `systemConfig.default_draw_time` value
3. Force refresh with `?t=<timestamp>`

## Next Steps

1. ✅ Deploy unified API
2. ✅ Test all three scenarios above
3. ✅ Monitor logs for errors
4. ✅ Update frontend to use new endpoint (optional, backward compatible)
5. ✅ Remove old endpoint code after verification (optional)

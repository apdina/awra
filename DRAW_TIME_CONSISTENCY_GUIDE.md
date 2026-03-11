# Draw Time Consistency Guide

## Problem Solved

Previously, draw time was hardcoded in multiple places:
- Admin pages (default values)
- Data fetching fallbacks
- Individual draw records

When admin changed the draw time, some parts of the app didn't update immediately.

## Solution: Unified Draw Time Source

Now there's a **single source of truth** for draw time:

```
systemConfig.default_draw_time (database)
        ↓
    /api/draw (unified API)
        ↓
All frontend & backend code
```

## How It Works

### 1. Admin Changes Draw Time

Admin goes to `/admin/set-draw-time` and changes time from 21:40 to 22:00:

```
1. Admin submits form
2. API calls: convex.mutation(api.draws.setDrawTime, {...})
3. Updates systemConfig.default_draw_time in database
4. Updates individual draw's drawingTime
5. Cache is invalidated
```

### 2. Next API Request

When any client calls `/api/draw`:

```
1. Fetch currentDraw from database
2. Fetch systemConfig.default_draw_time (LATEST)
3. Use systemConfig time (not draw's stored time)
4. Return countdown with new time
5. Client sees updated time immediately
```

### 3. Automatic Draw Increment

When draw time passes:

```
1. Client calls /api/draw
2. API detects diff <= 0
3. Calls checkAndIncrementDraw mutation
4. Creates next draw (e.g., 12/03 at 22:00)
5. Returns new draw with countdown
6. Client transitions seamlessly
```

## For Developers

### Rule 1: Never Hardcode Draw Time in Components

❌ **Bad:**
```typescript
const drawTime = "21:40"; // Hardcoded!
```

✅ **Good:**
```typescript
const response = await fetch('/api/draw?type=current');
const { draw_time } = response.data;
```

### Rule 2: Use Fallback Values Only for Errors

❌ **Bad:**
```typescript
const drawTime = config?.value || "21:40"; // Fallback is used too often
```

✅ **Good:**
```typescript
const drawTime = config?.value || "21:40"; // Fallback only if config fetch fails
```

### Rule 3: Server-Side: Use the Helper

For server-side code that needs draw time:

```typescript
import { getDrawTimeFromAPI, getCurrentDrawInfo } from '@/lib/draw-time-helper';

// Get just the time
const drawTime = await getDrawTimeFromAPI();

// Get full draw info
const { draw_date, draw_time, dayOfWeek } = await getCurrentDrawInfo();
```

### Rule 4: Client-Side: Use the API Directly

For client-side code (React components):

```typescript
// In useEffect or event handler
const response = await fetch('/api/draw?type=current');
const { draw_date, draw_time, countdown } = response.data;
```

## Files That Handle Draw Time

### Single Source of Truth
- `systemConfig.default_draw_time` - Database config

### APIs
- `/api/draw` - Unified API (reads from systemConfig)
- `/api/countdown` - Proxies to /api/draw
- `/api/current-draw` - Proxies to /api/draw

### Helpers
- `lib/draw-time-helper.ts` - Server-side utilities
- `lib/convex-data-fetching.ts` - Convex data fetching

### Admin Pages
- `app/admin/set-draw-time/page.tsx` - Change draw time
- `app/admin/page.tsx` - Set default time
- `app/admin/auto-schedule/page.tsx` - Auto-schedule draws

### Convex Functions
- `convex/draws.ts` - Draw management
- `convex/systemConfig.ts` - Config management
- `convex/unifiedTickets.ts` - Ticket calculations

## Testing Draw Time Changes

### Test 1: Admin Changes Time
```
1. Note current time (e.g., 21:40)
2. Go to /admin/set-draw-time
3. Change to new time (e.g., 22:00)
4. Submit
5. Go to home page
6. Check countdown - should show new time
7. Refresh page - should still show new time
8. Wait 10 seconds - cache expires, should still show new time
```

### Test 2: Multiple Clients See Update
```
1. Open home page in 2 browser windows
2. Change draw time in admin
3. Refresh one window - should see new time
4. Refresh other window - should see new time
5. Both should match
```

### Test 3: Draw Auto-Increment
```
1. Set draw time to current time + 1 minute
2. Wait for draw time to pass
3. Refresh countdown
4. Should show next draw (different date)
5. Should show new time (22:00 or whatever was set)
```

### Test 4: Fallback Works
```
1. Temporarily break the API
2. Load home page
3. Should show fallback draw time (21:40)
4. Fix the API
5. Refresh page
6. Should show correct time from database
```

## Troubleshooting

### Issue: Countdown Shows Old Time After Admin Change

**Cause:** Browser cache or stale data

**Solution:**
1. Clear browser cache
2. Or add `?t=<timestamp>` to force refresh
3. Or wait 10 seconds for cache to expire

### Issue: Different Clients See Different Times

**Cause:** Cache inconsistency or network issue

**Solution:**
1. Check `systemConfig.default_draw_time` in database
2. Verify admin change was saved
3. Check server logs for errors
4. Force refresh all clients

### Issue: Draw Not Incrementing

**Cause:** `ADMIN_SECRET` not set or mutation failed

**Solution:**
1. Check `ADMIN_SECRET` environment variable
2. Check server logs for errors
3. Manually trigger: `/api/admin/check-and-increment-draw`

### Issue: Fallback Time Always Shows

**Cause:** API is failing

**Solution:**
1. Check server logs
2. Verify Convex connection
3. Check database connectivity
4. Restart server

## Performance Considerations

### Caching Strategy
- **Normal:** 10 seconds cache + 30 seconds stale-while-revalidate
- **After increment:** No cache (immediate update)
- **Force refresh:** Add `?t=<timestamp>`

### Database Queries
- Parallel fetch of draw + config (2 queries)
- Cached for 10 seconds
- Minimal impact on performance

### Network
- Single API call returns all needed data
- Includes countdown calculation
- Reduces round trips

## Migration Checklist

- [x] Create unified `/api/draw` endpoint
- [x] Update `/api/countdown` to proxy to `/api/draw`
- [x] Update `/api/current-draw` to proxy to `/api/draw`
- [x] Create `lib/draw-time-helper.ts` for server-side
- [x] Update `lib/convex-data-fetching.ts` to use systemConfig
- [x] Document the changes
- [ ] Test all scenarios
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Update frontend components (optional, backward compatible)

## Summary

✅ **Single source of truth:** `systemConfig.default_draw_time`
✅ **Automatic updates:** Admin changes reflected immediately
✅ **Automatic increment:** Draw auto-increments when time passes
✅ **Consistent caching:** All endpoints use same strategy
✅ **Backward compatible:** Old endpoints still work
✅ **Fallback handling:** Graceful degradation if API fails

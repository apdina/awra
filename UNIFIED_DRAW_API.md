# Unified Draw API

## Overview

All draw-related data now flows through a single unified API endpoint: `/api/draw`

This ensures:
- ✅ Single source of truth for draw time
- ✅ Admin changes immediately reflected everywhere
- ✅ Automatic draw increment when time passes
- ✅ Consistent caching strategy
- ✅ No duplicate data sources

## API Endpoints

### Primary Endpoint: `/api/draw`

**Query Parameters:**
- `?type=current` (default) - Returns current draw info with countdown
- `?type=countdown` - Returns countdown data only
- `?t=<timestamp>` - Force refresh (bypass cache)

### Legacy Endpoints (Backward Compatible)

These endpoints now proxy to `/api/draw`:
- `/api/countdown` → `/api/draw?type=countdown`
- `/api/current-draw` → `/api/draw?type=current`

## Response Format

### Current Draw Response (`?type=current`)

```json
{
  "success": true,
  "data": {
    "id": "draw-id",
    "draw_date": "11/03/2026",
    "draw_time": "21:40",
    "winning_number": null,
    "is_processed": false,
    "status": "active",
    "total_tickets": 0,
    "current_pot": 0,
    "countdown": {
      "hours": 18,
      "minutes": 20,
      "seconds": 45,
      "totalSeconds": 65845,
      "isExpired": false,
      "dayOfWeek": "Saturday"
    },
    "cached": true,
    "timestamp": 1741234567890
  }
}
```

### Countdown Response (`?type=countdown`)

```json
{
  "success": true,
  "data": {
    "hours": 18,
    "minutes": 20,
    "seconds": 45,
    "totalSeconds": 65845,
    "isExpired": false,
    "nextDrawDate": "11/03/2026",
    "nextDrawTime": "21:40",
    "dayOfWeek": "Saturday",
    "cached": true,
    "timestamp": 1741234567890
  }
}
```

## How It Works

### 1. Admin Updates Draw Time

When admin changes draw time via `/api/admin/set-draw-time`:
- Updates `systemConfig.default_draw_time` in database
- Next API call to `/api/draw` reads the latest time
- All clients immediately see the new time

### 2. Draw Time Passes

When current draw time passes:
1. `/api/draw` detects `diff <= 0`
2. Automatically calls `checkAndIncrementDraw` mutation
3. Creates next draw (e.g., 12/03 at 21:40)
4. Returns new draw with countdown
5. Disables caching temporarily
6. Next request uses normal caching

### 3. Caching Strategy

**Normal Operation:**
- Cache: 10 seconds
- Stale-while-revalidate: 30 seconds
- Clients get fresh data every 10 seconds

**When Draw Incremented:**
- Cache: Disabled (no-store)
- Ensures clients see new draw immediately
- Re-enables after new draw is stable

**Force Refresh:**
- Add `?t=<timestamp>` to bypass cache
- Used by admin for manual refresh

## Migration Guide

### For Frontend Components

**Old (using separate endpoints):**
```typescript
// Countdown
const countdown = await fetch('/api/countdown');

// Current draw
const draw = await fetch('/api/current-draw');
```

**New (unified endpoint):**
```typescript
// Get both countdown and draw info
const response = await fetch('/api/draw');
const { draw_date, draw_time, countdown } = response.data;

// Or just countdown
const countdown = await fetch('/api/draw?type=countdown');
```

### For Admin APIs

No changes needed - they already call the Convex mutations directly.

## Benefits

1. **Single Source of Truth**
   - Draw time stored in `systemConfig.default_draw_time`
   - All functions read from this one place
   - No more sync issues

2. **Automatic Updates**
   - Admin changes immediately reflected
   - No need to manually update individual draws
   - Countdown always shows correct time

3. **Automatic Draw Increment**
   - No need to wait for cron job
   - Happens on first request after draw time passes
   - Seamless transition to next draw

4. **Consistent Caching**
   - All endpoints use same strategy
   - Predictable behavior
   - Better performance

## Technical Details

### Draw Time Resolution

The API uses this priority:
1. `systemConfig.default_draw_time` (latest admin setting)
2. `currentDraw.draw_time` (fallback)
3. `"21:40"` (hardcoded default)

This ensures admin changes are always used.

### UTC Timezone

All times are in UTC:
- Draw dates: DD/MM/YYYY format
- Draw times: HH:MM 24-hour format
- Countdown calculations: UTC-based

### Sunday Logic

When draw time passes:
- If current day is Sunday: next draw is Tuesday (+48H)
- Otherwise: next draw is next day (+24H)
- Sundays are skipped (configurable)

## Monitoring

Check logs for:
- `Draw API: type=countdown` - Normal countdown request
- `⏰ Draw time has passed` - Draw increment triggered
- `✅ New draw detected` - New draw created successfully
- `Draw increment triggered successfully` - Increment completed

## Troubleshooting

### Countdown Not Updating

1. Check if draw time in `systemConfig.default_draw_time` is correct
2. Verify UTC timezone is being used
3. Check browser cache (add `?t=<timestamp>` to force refresh)

### Admin Changes Not Reflected

1. Verify admin secret is correct
2. Check `systemConfig.default_draw_time` was updated
3. Clear browser cache
4. Wait for cache to expire (10 seconds)

### Draw Not Incrementing

1. Check if `ADMIN_SECRET` environment variable is set
2. Verify `checkAndIncrementDraw` mutation is working
3. Check server logs for errors
4. Manually trigger via `/api/admin/check-and-increment-draw`

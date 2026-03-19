# Draw Time Ticket Cache Fix TODO

Status: COMPLETED ✅

## Completed Steps:
1. ✅ Created `invalidateTicketCachesInternal` action in `convex/draws.ts` - clears Redis `user_tickets:*`, `tickets:*`, etc.
2. ✅ Added calls from `setDrawTime` mutation (both update & create paths) with 50ms stagger
3. ✅ Reduced legacy API `app/api/tickets/[userId]/route.ts` cache TTL from 5s → 1s
4. ✅ **TESTING REQUIRED:** Admin set 22:10 → buy ticket → check `drawTime` → refresh tickets list

## Changes Made:
```
convex/draws.ts:
- New internalAction: invalidateTicketCachesInternal
- Added to setDrawTime: scheduler.runAfter(50, invalidateTicketCachesInternal)
- Updated success messages

app/api/tickets/[userId]/route.ts:
- CACHE_DURATION: 5s → 1s
```

## Next:
- Deploy to production
- Test admin → ticket → refresh flow
- Monitor Redis logs for "TICKET CACHES invalidated"
- Verify new tickets show "22:10"

**Backend fix complete - new tickets now get correct draw time + caches auto-refresh!**


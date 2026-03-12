# Winning Numbers API - Quick Start Guide

## The Problem
Admins can't set winning numbers. The API returns "not implemented" for POST, PUT, DELETE.

## The Solution
Implement 3 write operations:
- **POST** - Set winning number
- **PUT** - Update winning number
- **DELETE** - Remove winning number

## What Needs to Happen

### 1. Create Convex Mutations (convex/draws.ts)
```typescript
// Set winning number
export const setWinningNumber = mutation({
  args: { drawId: v.string(), winningNumber: v.number(), prizeAmount: v.number() },
  handler: async (ctx, args) => {
    // Find draw by drawId
    // Update with winningNumber and prizeAmount
    // Return updated draw
  }
});

// Update winning number
export const updateWinningNumber = mutation({
  args: { drawId: v.string(), newWinningNumber: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    // Find draw by drawId
    // Update winningNumber
    // Return updated draw with previousNumber
  }
});

// Delete winning number
export const deleteWinningNumber = mutation({
  args: { drawId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    // Find draw by drawId
    // Clear winningNumber
    // Update status to "cancelled"
    // Return updated draw
  }
});
```

### 2. Implement POST Handler (app/api/winning-numbers/route.ts)
```typescript
export async function POST(request: NextRequest) {
  // 1. Get access token from cookie
  // 2. Verify user is admin
  // 3. Parse request body { drawId, winningNumber, prizeAmount }
  // 4. Validate input
  // 5. Call Convex mutation
  // 6. Invalidate cache
  // 7. Log audit event
  // 8. Return { success: true, draw: {...} }
}
```

### 3. Implement PUT Handler
```typescript
export async function PUT(request: NextRequest) {
  // 1. Get access token from cookie
  // 2. Verify user is admin
  // 3. Parse request body { drawId, winningNumber, reason }
  // 4. Validate input
  // 5. Call Convex mutation
  // 6. Invalidate cache
  // 7. Log audit event with reason
  // 8. Return { success: true, draw: {...}, previousNumber: X }
}
```

### 4. Implement DELETE Handler
```typescript
export async function DELETE(request: NextRequest) {
  // 1. Get access token from cookie
  // 2. Verify user is admin
  // 3. Get drawId from query params
  // 4. Parse request body { reason }
  // 5. Validate input
  // 6. Call Convex mutation
  // 7. Invalidate cache
  // 8. Log audit event with reason
  // 9. Return { success: true, draw: {...} }
}
```

## Key Points

### Authentication
```typescript
const accessToken = request.cookies.get('access_token')?.value;
if (!accessToken) return 401;

const user = await convexClient.query(api.native_auth.getCurrentUserByToken, { token: accessToken });
if (!user.isAdmin) return 403;
```

### Validation
```typescript
if (winningNumber < 1 || winningNumber > 200) return 400;
if (prizeAmount <= 0) return 400;
if (!drawId) return 400;
```

### Cache Invalidation
```typescript
import { invalidateWinningNumbersCache } from '@/app/api/winning-numbers/route';
invalidateWinningNumbersCache();
```

### Audit Logging
```typescript
import { auditLog } from '@/lib/photoAuditLog'; // or create similar
await auditLog({
  eventType: 'WINNING_NUMBER_SET',
  status: 'success',
  message: `Admin set winning number ${winningNumber} for draw ${drawId}`,
  severity: 'info',
  userId: user._id,
  email: user.email,
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
});
```

## Testing

### Test POST
```bash
curl -X POST http://localhost:3000/api/winning-numbers \
  -H "Content-Type: application/json" \
  -d '{"drawId":"2025-02-10","winningNumber":123,"prizeAmount":5000}'
```

### Test PUT
```bash
curl -X PUT http://localhost:3000/api/winning-numbers \
  -H "Content-Type: application/json" \
  -d '{"drawId":"2025-02-10","winningNumber":125,"reason":"Correction"}'
```

### Test DELETE
```bash
curl -X DELETE "http://localhost:3000/api/winning-numbers?drawId=2025-02-10" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Draw cancelled"}'
```

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Winning number set |
| 400 | Bad input | Invalid number (>200) |
| 401 | Not logged in | No access token |
| 403 | Not admin | Regular user tried to set |
| 404 | Not found | DrawId doesn't exist |
| 409 | Conflict | Can't update completed draw |
| 500 | Server error | Database error |

## Files to Modify

1. `convex/draws.ts` - Add 3 mutations
2. `app/api/winning-numbers/route.ts` - Implement POST, PUT, DELETE

## Time Estimate

- Mutations: 30 min
- POST: 30 min
- PUT: 20 min
- DELETE: 20 min
- Testing: 30 min
- **Total: 2-3 hours**

## Status

✅ Ready to implement
✅ All requirements clear
✅ Documentation complete

## Next Steps

1. Read `WINNING_NUMBERS_API_EXPLANATION.md` for details
2. Read `WINNING_NUMBERS_API_VISUAL_GUIDE.md` for diagrams
3. Start implementing mutations
4. Implement handlers
5. Test thoroughly
6. Deploy

---

**Priority**: HIGH
**Difficulty**: Medium
**Impact**: Core functionality

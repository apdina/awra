# Winning Numbers API - Complete Explanation

## Executive Summary

The Winning Numbers API is missing **write operations** (POST, PUT, DELETE). Currently, only the GET operation works. We need to implement these 3 operations so admins can manage lottery draw results.

**Status**: ❌ Incomplete
**Priority**: HIGH (Core functionality)
**Effort**: 2-3 hours
**Difficulty**: Medium

---

## What Is the Winning Numbers API?

### Purpose
Manages lottery draw results. Stores and retrieves winning numbers for each daily draw.

### Current State
- ✅ **GET** - Users can fetch winning numbers (fully implemented)
- ❌ **POST** - Admins can't set winning numbers (not implemented)
- ❌ **PUT** - Admins can't update winning numbers (not implemented)
- ❌ **DELETE** - Admins can't remove winning numbers (not implemented)

### Why It Matters
Without write operations, the lottery can't function:
- Admins can't set the winning number after a draw
- Admins can't correct mistakes
- Admins can't cancel draws

---

## The Database

### Table: dailyDraws
Stores information about each daily draw:

```typescript
{
  drawId: "2025-02-10",           // Unique identifier
  ticketPrice: 10,                // Cost per ticket
  maxTickets: 1000,               // Max tickets allowed
  currentPot: 10000,              // Prize pool
  startTime: 1707600000000,       // When draw starts
  endTime: 1707686400000,         // When draw ends
  drawingTime: 1707686400000,     // When drawing happens
  status: "completed",            // upcoming | active | drawing | completed
  winningNumber: 123,             // ← THIS IS WHAT WE NEED TO SET
  winnerUserId: "user123",        // Who won
  prizeAmount: 12300,             // Prize amount
  totalTickets: 1230,             // Total tickets sold
  uniquePlayers: 456,             // Unique players
  drawDurationHours: 24,          // 24 or 48 hours
  createdAt: 1707600000000,       // Created timestamp
  updatedAt: 1707686400000,       // Last updated timestamp
}
```

### Key Field: winningNumber
- Range: 1-200
- Set by admin after draw
- Used to determine winners
- Can be updated or deleted

---

## The Three Operations

### 1. POST - Set Winning Number

**Purpose**: Admin sets the winning number after a draw

**When Used**:
- After lottery draw is completed
- Admin has the official winning number
- Need to store it in database

**Request**:
```http
POST /api/winning-numbers
Content-Type: application/json
Cookie: access_token=...

{
  "drawId": "2025-02-10",
  "winningNumber": 123,
  "prizeAmount": 12300
}
```

**Response (Success)**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": 123,
    "prizeAmount": 12300,
    "status": "completed",
    "updatedAt": 1707686400000
  }
}
```

**Response (Error - Not Admin)**:
```json
{
  "error": "Only admins can set winning numbers",
  "status": 403
}
```

**Response (Error - Invalid Number)**:
```json
{
  "error": "Winning number must be between 1 and 200",
  "received": 250,
  "status": 400
}
```

**Implementation Steps**:
1. Extract access token from cookie
2. Verify user is authenticated
3. Verify user is admin (isAdmin: true)
4. Parse request body
5. Validate winningNumber (1-200)
6. Validate prizeAmount (positive)
7. Validate drawId exists
8. Call Convex mutation to update database
9. Invalidate cache (clear Redis and memory)
10. Log audit event
11. Return success response

---

### 2. PUT - Update Winning Number

**Purpose**: Admin corrects or updates a winning number

**When Used**:
- Admin made a mistake setting the number
- Need to correct it
- Must log the reason for audit trail

**Request**:
```http
PUT /api/winning-numbers
Content-Type: application/json
Cookie: access_token=...

{
  "drawId": "2025-02-10",
  "winningNumber": 125,
  "reason": "Correction - previous number was incorrect"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": 125,
    "previousNumber": 123,
    "status": "completed",
    "updatedAt": 1707686400000
  }
}
```

**Response (Error - Draw Already Completed)**:
```json
{
  "error": "Cannot update completed draw",
  "drawId": "2025-02-10",
  "status": 409
}
```

**Implementation Steps**:
1. Extract access token from cookie
2. Verify user is authenticated
3. Verify user is admin
4. Parse request body
5. Validate winningNumber (1-200)
6. Validate drawId exists
7. Check if draw already has a winning number
8. Call Convex mutation to update database
9. Invalidate cache
10. Log audit event with reason and old number
11. Return success response with previousNumber

---

### 3. DELETE - Remove Winning Number

**Purpose**: Admin removes/cancels a winning number

**When Used**:
- Draw needs to be cancelled
- Winning number was set by mistake
- Need to reset the draw

**Request**:
```http
DELETE /api/winning-numbers?drawId=2025-02-10
Content-Type: application/json
Cookie: access_token=...

{
  "reason": "Draw cancelled due to technical issues"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": null,
    "status": "cancelled",
    "updatedAt": 1707686400000
  }
}
```

**Response (Error - Draw Not Found)**:
```json
{
  "error": "Draw not found",
  "drawId": "2025-02-10",
  "status": 404
}
```

**Implementation Steps**:
1. Extract access token from cookie
2. Verify user is authenticated
3. Verify user is admin
4. Get drawId from query parameters
5. Parse request body for reason
6. Validate drawId exists
7. Call Convex mutation to clear winning number
8. Update status to "cancelled"
9. Invalidate cache
10. Log audit event with reason
11. Return success response

---

## Security Requirements

### Authentication
Every write operation must verify the user is logged in:
```typescript
const accessToken = request.cookies.get('access_token')?.value;
if (!accessToken) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}

const user = await convexClient.query(api.native_auth.getCurrentUserByToken, {
  token: accessToken
});
```

### Authorization
Every write operation must verify the user is admin:
```typescript
if (!user.isAdmin) {
  return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
}
```

### Input Validation
Every write operation must validate input:
```typescript
if (winningNumber < 1 || winningNumber > 200) {
  return NextResponse.json({ error: 'Invalid number' }, { status: 400 });
}

if (!drawId) {
  return NextResponse.json({ error: 'Missing drawId' }, { status: 400 });
}
```

### Audit Logging
Every write operation must log the action:
```typescript
await auditLog({
  eventType: 'WINNING_NUMBER_SET',
  status: 'success',
  message: `Admin ${user.email} set winning number ${winningNumber}`,
  severity: 'info',
  userId: user._id,
  email: user.email,
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
  details: {
    drawId,
    winningNumber,
    prizeAmount
  }
});
```

### Cache Invalidation
Every write operation must clear the cache:
```typescript
import { invalidateWinningNumbersCache } from '@/app/api/winning-numbers/route';
invalidateWinningNumbersCache();
// This clears both Redis and memory caches
// Next GET request will fetch fresh data
```

---

## Implementation Architecture

### Files to Modify

#### 1. convex/draws.ts
Add three new mutations:

```typescript
// Mutation 1: Set winning number
export const setWinningNumber = mutation({
  args: {
    drawId: v.string(),
    winningNumber: v.number(),
    prizeAmount: v.number()
  },
  handler: async (ctx, args) => {
    // Find draw by drawId
    const draw = await ctx.db
      .query("dailyDraws")
      .withIndex("by_drawId", q => q.eq("drawId", args.drawId))
      .first();
    
    if (!draw) throw new Error("Draw not found");
    
    // Update with winning number
    await ctx.db.patch(draw._id, {
      winningNumber: args.winningNumber,
      prizeAmount: args.prizeAmount,
      status: "completed",
      updatedAt: Date.now()
    });
    
    return await ctx.db.get(draw._id);
  }
});

// Mutation 2: Update winning number
export const updateWinningNumber = mutation({
  args: {
    drawId: v.string(),
    newWinningNumber: v.number(),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    // Similar to setWinningNumber but logs the change
    // Store old number for audit trail
  }
});

// Mutation 3: Delete winning number
export const deleteWinningNumber = mutation({
  args: {
    drawId: v.string(),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    // Find draw
    // Clear winning number
    // Update status to "cancelled"
    // Return updated draw
  }
});
```

#### 2. app/api/winning-numbers/route.ts
Implement three handlers:

```typescript
// POST Handler
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const accessToken = request.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const user = await convexClient.query(api.native_auth.getCurrentUserByToken, { token: accessToken });
    
    // 2. Authorize
    if (!user.isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    
    // 3. Parse and validate
    const body = await request.json();
    const { drawId, winningNumber, prizeAmount } = body;
    
    if (!drawId || !winningNumber || !prizeAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (winningNumber < 1 || winningNumber > 200) {
      return NextResponse.json({ error: 'Invalid winning number' }, { status: 400 });
    }
    
    // 4. Call Convex mutation
    const result = await convexClient.mutation(api.draws.setWinningNumber, {
      drawId,
      winningNumber,
      prizeAmount
    });
    
    // 5. Invalidate cache
    invalidateWinningNumbersCache();
    
    // 6. Log audit event
    await auditLog({
      eventType: 'WINNING_NUMBER_SET',
      status: 'success',
      message: `Admin set winning number ${winningNumber} for draw ${drawId}`,
      severity: 'info',
      userId: user._id,
      email: user.email,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
    
    // 7. Return response
    return NextResponse.json({ success: true, draw: result });
  } catch (error: any) {
    logger.error('POST winning number error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT Handler (similar structure)
export async function PUT(request: NextRequest) {
  // Similar to POST but for updates
}

// DELETE Handler (similar structure)
export async function DELETE(request: NextRequest) {
  // Similar to POST but for deletion
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Operation completed |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Not admin |
| 404 | Not Found | Draw doesn't exist |
| 409 | Conflict | Can't update (business rule) |
| 500 | Server Error | Database/system error |

### Error Response Format
```json
{
  "error": "Error message",
  "status": 400,
  "details": {
    "field": "value",
    "reason": "explanation"
  }
}
```

---

## Testing Checklist

- [ ] POST - Set winning number (success)
- [ ] POST - Invalid number (400)
- [ ] POST - Not admin (403)
- [ ] POST - Draw not found (404)
- [ ] PUT - Update winning number (success)
- [ ] PUT - Invalid number (400)
- [ ] PUT - Not admin (403)
- [ ] DELETE - Remove winning number (success)
- [ ] DELETE - Draw not found (404)
- [ ] DELETE - Not admin (403)
- [ ] Cache invalidation works
- [ ] Audit logging works
- [ ] Users see updated number after cache clear

---

## Implementation Timeline

| Task | Time | Status |
|------|------|--------|
| Create Convex mutations | 30 min | ⏳ TODO |
| Implement POST handler | 30 min | ⏳ TODO |
| Implement PUT handler | 20 min | ⏳ TODO |
| Implement DELETE handler | 20 min | ⏳ TODO |
| Testing & debugging | 30 min | ⏳ TODO |
| **TOTAL** | **2-3 hours** | ⏳ TODO |

---

## Summary

The Winning Numbers API needs 3 write operations:

1. **POST** - Set winning number for a draw
2. **PUT** - Update/correct a winning number
3. **DELETE** - Remove a winning number

Each operation requires:
- Admin authentication
- Input validation
- Convex mutation call
- Cache invalidation
- Audit logging
- Proper error handling

**Status**: Ready to implement
**Priority**: HIGH (core functionality)
**Difficulty**: Medium
**Time**: 2-3 hours

---

## Documentation Files

1. `WINNING_NUMBERS_API_EXPLANATION.md` - Detailed explanation
2. `WINNING_NUMBERS_API_VISUAL_GUIDE.md` - Diagrams and flows
3. `WINNING_NUMBERS_API_QUICK_START.md` - Quick reference
4. `WINNING_NUMBERS_API_SUMMARY.md` - High-level summary
5. `WINNING_NUMBERS_API_EXPLANATION_COMPLETE.md` - This file

---

## Next Steps

1. ✅ Read this explanation
2. ⏳ Review the visual guide
3. ⏳ Create Convex mutations
4. ⏳ Implement API handlers
5. ⏳ Test thoroughly
6. ⏳ Deploy to production

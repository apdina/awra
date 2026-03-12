# Winning Numbers API - Explanation & Implementation Plan

## Current State

### What Exists ✅
The API currently has:
- **GET** `/api/winning-numbers` - Fully implemented
  - Fetches winning numbers from Convex
  - Caches results in Redis and memory
  - Supports pagination
  - Returns formatted data with day, date, number

### What's Missing ❌
The API is missing write operations:
- **POST** `/api/winning-numbers` - Not implemented (returns 501)
- **PUT** `/api/winning-numbers` - Not implemented (returns 501)
- **DELETE** `/api/winning-numbers` - Not implemented (returns 501)

---

## Database Structure

### dailyDraws Table (Convex)
```typescript
{
  drawId: string,              // "2025-02-10"
  ticketPrice: number,         // Cost per ticket
  maxTickets: number,          // Max tickets allowed
  currentPot: number,          // Prize pool
  startTime: number,           // Draw start timestamp
  endTime: number,             // Draw end timestamp
  drawingTime: number,         // When drawing happens
  status: string,              // "upcoming" | "active" | "drawing" | "completed"
  winningNumber: number,       // THE WINNING NUMBER (what we need to set)
  winnerUserId: string,        // User who won
  prizeAmount: number,         // Prize amount
  totalTickets: number,        // Total tickets sold
  uniquePlayers: number,       // Unique players
  drawDurationHours: number,   // 24 or 48 hours
  createdAt: number,           // Creation timestamp
  updatedAt: number,           // Last update timestamp
}
```

---

## What Each Operation Should Do

### POST - Create/Add Winning Number
**Purpose**: Admin sets the winning number for a draw

**Request**:
```json
{
  "drawId": "2025-02-10",
  "winningNumber": 123,
  "prizeAmount": 5000
}
```

**Process**:
1. Authenticate admin user
2. Validate drawId exists
3. Validate winningNumber (1-200)
4. Update the draw record with winningNumber
5. Invalidate cache (so users see new number)
6. Log audit event
7. Return updated draw

**Response**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": 123,
    "status": "completed",
    "updatedAt": 1707600000000
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid data
- `401` - Not authenticated
- `403` - Not authorized (not admin)
- `404` - Draw not found
- `500` - Server error

---

### PUT - Update Winning Number
**Purpose**: Admin updates/corrects a winning number

**Request**:
```json
{
  "drawId": "2025-02-10",
  "winningNumber": 125,
  "reason": "Correction - previous number was incorrect"
}
```

**Process**:
1. Authenticate admin user
2. Validate drawId exists
3. Validate winningNumber (1-200)
4. Check if draw already has a winning number
5. Update the draw record
6. Invalidate cache
7. Log audit event with reason
8. Return updated draw

**Response**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": 125,
    "previousNumber": 123,
    "updatedAt": 1707600000000
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid data
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Draw not found
- `409` - Draw already completed (can't update)
- `500` - Server error

---

### DELETE - Remove Winning Number
**Purpose**: Admin removes a winning number (e.g., draw cancelled)

**Request**:
```json
{
  "drawId": "2025-02-10",
  "reason": "Draw cancelled due to technical issues"
}
```

**Process**:
1. Authenticate admin user
2. Validate drawId exists
3. Check if draw has a winning number
4. Clear winningNumber field
5. Update status to "cancelled" or "upcoming"
6. Invalidate cache
7. Log audit event with reason
8. Return updated draw

**Response**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": null,
    "status": "cancelled",
    "updatedAt": 1707600000000
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid data
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Draw not found
- `500` - Server error

---

## Security Requirements

### Authentication
- All write operations require admin authentication
- Check access token from HTTP-only cookie
- Verify user is admin (isAdmin: true)

### Authorization
- Only admins can create/update/delete winning numbers
- Log all admin actions for audit trail
- Track IP address and user agent

### Validation
- DrawId must exist in database
- WinningNumber must be 1-200
- PrizeAmount must be positive
- Can't update completed draws (optional business rule)

### Audit Logging
- Log who made the change
- Log what changed (old value → new value)
- Log when it changed
- Log why it changed (reason field)
- Log from which IP address

---

## Cache Invalidation

### Current Cache System
- Redis cache: 48 hours
- Memory cache: In-memory fallback
- Lock mechanism: Prevents cache stampede

### What Needs to Happen
When a winning number is set/updated/deleted:
1. Call `invalidateWinningNumbersCache()` function
2. This clears both Redis and memory caches
3. Next GET request will fetch fresh data
4. Users see updated winning number immediately

---

## Implementation Approach

### Step 1: Create Convex Mutations
Need to create mutations in Convex for:
- `setWinningNumber(drawId, winningNumber, prizeAmount)`
- `updateWinningNumber(drawId, newWinningNumber, reason)`
- `deleteWinningNumber(drawId, reason)`

### Step 2: Implement POST Handler
```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate admin
  // 2. Parse request body
  // 3. Validate data
  // 4. Call Convex mutation
  // 5. Invalidate cache
  // 6. Log audit event
  // 7. Return response
}
```

### Step 3: Implement PUT Handler
```typescript
export async function PUT(request: NextRequest) {
  // Similar to POST but for updates
  // Check if draw already has number
  // Log the change
}
```

### Step 4: Implement DELETE Handler
```typescript
export async function DELETE(request: NextRequest) {
  // 1. Authenticate admin
  // 2. Parse drawId from query
  // 3. Validate draw exists
  // 4. Call Convex mutation to clear number
  // 5. Invalidate cache
  // 6. Log audit event
  // 7. Return response
}
```

---

## Error Scenarios

### Invalid DrawId
```json
{
  "error": "Draw not found",
  "drawId": "2025-02-10",
  "status": 404
}
```

### Invalid Winning Number
```json
{
  "error": "Winning number must be between 1 and 200",
  "received": 250,
  "status": 400
}
```

### Not Authenticated
```json
{
  "error": "Authentication required",
  "status": 401
}
```

### Not Authorized
```json
{
  "error": "Only admins can set winning numbers",
  "status": 403
}
```

### Draw Already Completed
```json
{
  "error": "Cannot update completed draw",
  "drawId": "2025-02-10",
  "status": 409
}
```

---

## Testing Scenarios

### Test 1: Set Winning Number
```bash
POST /api/winning-numbers
{
  "drawId": "2025-02-10",
  "winningNumber": 123,
  "prizeAmount": 5000
}
```
Expected: 200 OK with updated draw

### Test 2: Update Winning Number
```bash
PUT /api/winning-numbers
{
  "drawId": "2025-02-10",
  "winningNumber": 125,
  "reason": "Correction"
}
```
Expected: 200 OK with updated draw

### Test 3: Delete Winning Number
```bash
DELETE /api/winning-numbers?drawId=2025-02-10
```
Expected: 200 OK with cleared number

### Test 4: Invalid Number
```bash
POST /api/winning-numbers
{
  "drawId": "2025-02-10",
  "winningNumber": 250
}
```
Expected: 400 Bad Request

### Test 5: Not Admin
```bash
POST /api/winning-numbers (as regular user)
```
Expected: 403 Forbidden

---

## Implementation Checklist

- [ ] Create Convex mutations for write operations
- [ ] Implement POST handler (create/set winning number)
- [ ] Implement PUT handler (update winning number)
- [ ] Implement DELETE handler (remove winning number)
- [ ] Add admin authentication checks
- [ ] Add input validation
- [ ] Add cache invalidation
- [ ] Add audit logging
- [ ] Add error handling
- [ ] Add TypeScript types
- [ ] Test all scenarios
- [ ] Document API endpoints

---

## Files to Modify

1. **convex/draws.ts** - Add mutations for write operations
2. **app/api/winning-numbers/route.ts** - Implement POST, PUT, DELETE handlers
3. **lib/convex-data-fetching.ts** - Add helper functions if needed

---

## Estimated Effort

- Convex mutations: 30 minutes
- POST handler: 30 minutes
- PUT handler: 20 minutes
- DELETE handler: 20 minutes
- Testing & debugging: 30 minutes
- **Total: 2-3 hours**

---

## Summary

The Winning Numbers API needs write operations (POST, PUT, DELETE) to allow admins to:
- **POST**: Set winning number for a draw
- **PUT**: Update/correct a winning number
- **DELETE**: Remove a winning number

Each operation requires:
1. Admin authentication
2. Input validation
3. Convex mutation call
4. Cache invalidation
5. Audit logging
6. Proper error handling

The implementation is straightforward - mostly following the same pattern as the existing GET operation.

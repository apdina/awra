# Winning Numbers API - Visual Guide

## Current API Status

```
┌─────────────────────────────────────────────────────────────┐
│           WINNING NUMBERS API ENDPOINTS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET  /api/winning-numbers          ✅ IMPLEMENTED          │
│       └─ Fetch winning numbers                              │
│       └─ Cached (Redis + Memory)                            │
│       └─ Paginated results                                  │
│                                                              │
│  POST /api/winning-numbers          ❌ NOT IMPLEMENTED      │
│       └─ Set winning number for draw                        │
│       └─ Admin only                                         │
│       └─ Returns 501 (Not Implemented)                      │
│                                                              │
│  PUT  /api/winning-numbers          ❌ NOT IMPLEMENTED      │
│       └─ Update winning number                              │
│       └─ Admin only                                         │
│       └─ Returns 501 (Not Implemented)                      │
│                                                              │
│  DELETE /api/winning-numbers        ❌ NOT IMPLEMENTED      │
│       └─ Remove winning number                              │
│       └─ Admin only                                         │
│       └─ Returns 501 (Not Implemented)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow - GET (Currently Working)

```
┌──────────────┐
│   User       │
│  (Browser)   │
└──────┬───────┘
       │ GET /api/winning-numbers
       ▼
┌──────────────────────────────────┐
│  API Route Handler (GET)         │
│  - Check Redis cache             │
│  - Check Memory cache            │
│  - If no cache, fetch from DB    │
└──────┬───────────────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────┐            ┌──────────────────┐
│  Redis Cache     │            │  Memory Cache    │
│  (48 hours)      │            │  (Fallback)      │
└──────────────────┘            └──────────────────┘
       │                                     │
       └─────────────────────────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Convex Database │
            │  (dailyDraws)    │
            └──────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Format Response │
            │  - Day of week   │
            │  - Date          │
            │  - Number        │
            └──────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Return to User  │
            │  (JSON)          │
            └──────────────────┘
```

---

## Data Flow - POST (Needs Implementation)

```
┌──────────────┐
│   Admin      │
│  (Browser)   │
└──────┬───────┘
       │ POST /api/winning-numbers
       │ { drawId, winningNumber, prizeAmount }
       ▼
┌──────────────────────────────────┐
│  API Route Handler (POST)        │
│  1. Authenticate admin           │
│  2. Validate input               │
│  3. Call Convex mutation         │
│  4. Invalidate cache             │
│  5. Log audit event              │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Convex Mutation                 │
│  setWinningNumber()              │
│  - Update dailyDraws table       │
│  - Set winningNumber field       │
│  - Update status to "completed"  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Cache Invalidation              │
│  - Clear Redis cache             │
│  - Clear Memory cache            │
│  - Next GET will fetch fresh     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Audit Logging                   │
│  - Log admin action              │
│  - Log IP address                │
│  - Log timestamp                 │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Return Response                 │
│  { success: true, draw: {...} }  │
└──────────────────────────────────┘
```

---

## Data Flow - PUT (Needs Implementation)

```
┌──────────────┐
│   Admin      │
│  (Browser)   │
└──────┬───────┘
       │ PUT /api/winning-numbers
       │ { drawId, winningNumber, reason }
       ▼
┌──────────────────────────────────┐
│  API Route Handler (PUT)         │
│  1. Authenticate admin           │
│  2. Validate input               │
│  3. Check if draw exists         │
│  4. Check if already has number  │
│  5. Call Convex mutation         │
│  6. Invalidate cache             │
│  7. Log audit event (with reason)│
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Convex Mutation                 │
│  updateWinningNumber()           │
│  - Update dailyDraws table       │
│  - Set new winningNumber         │
│  - Keep old number for audit     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Cache Invalidation              │
│  - Clear Redis cache             │
│  - Clear Memory cache            │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Audit Logging                   │
│  - Log old number                │
│  - Log new number                │
│  - Log reason for change         │
│  - Log admin who made change     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Return Response                 │
│  { success: true,                │
│    draw: {...},                  │
│    previousNumber: 123 }         │
└──────────────────────────────────┘
```

---

## Data Flow - DELETE (Needs Implementation)

```
┌──────────────┐
│   Admin      │
│  (Browser)   │
└──────┬───────┘
       │ DELETE /api/winning-numbers?drawId=2025-02-10
       │ { reason: "Draw cancelled" }
       ▼
┌──────────────────────────────────┐
│  API Route Handler (DELETE)      │
│  1. Authenticate admin           │
│  2. Validate drawId              │
│  3. Check if draw exists         │
│  4. Call Convex mutation         │
│  5. Invalidate cache             │
│  6. Log audit event              │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Convex Mutation                 │
│  deleteWinningNumber()           │
│  - Update dailyDraws table       │
│  - Clear winningNumber field     │
│  - Update status to "cancelled"  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Cache Invalidation              │
│  - Clear Redis cache             │
│  - Clear Memory cache            │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Audit Logging                   │
│  - Log deletion                  │
│  - Log reason                    │
│  - Log admin who deleted         │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Return Response                 │
│  { success: true,                │
│    draw: {...},                  │
│    status: "cancelled" }         │
└──────────────────────────────────┘
```

---

## Request/Response Examples

### POST - Set Winning Number

**Request**:
```http
POST /api/winning-numbers
Content-Type: application/json
Cookie: access_token=...

{
  "drawId": "2025-02-10",
  "winningNumber": 123,
  "prizeAmount": 5000
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": 123,
    "prizeAmount": 5000,
    "status": "completed",
    "updatedAt": 1707600000000
  }
}
```

**Response (403 Forbidden)**:
```json
{
  "error": "Only admins can set winning numbers",
  "status": 403
}
```

---

### PUT - Update Winning Number

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

**Response (200 OK)**:
```json
{
  "success": true,
  "draw": {
    "drawId": "2025-02-10",
    "winningNumber": 125,
    "previousNumber": 123,
    "status": "completed",
    "updatedAt": 1707600000000
  }
}
```

---

### DELETE - Remove Winning Number

**Request**:
```http
DELETE /api/winning-numbers?drawId=2025-02-10
Content-Type: application/json
Cookie: access_token=...

{
  "reason": "Draw cancelled due to technical issues"
}
```

**Response (200 OK)**:
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

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. AUTHENTICATION                                          │
│     ├─ Extract access_token from HTTP-only cookie          │
│     ├─ Verify token is valid                               │
│     └─ Get user from token                                 │
│                                                              │
│  2. AUTHORIZATION                                           │
│     ├─ Check if user.isAdmin === true                      │
│     └─ Reject if not admin (403 Forbidden)                 │
│                                                              │
│  3. INPUT VALIDATION                                        │
│     ├─ Validate drawId exists in database                  │
│     ├─ Validate winningNumber is 1-200                     │
│     ├─ Validate prizeAmount is positive                    │
│     └─ Reject invalid input (400 Bad Request)              │
│                                                              │
│  4. BUSINESS LOGIC VALIDATION                              │
│     ├─ Check if draw is already completed (PUT/DELETE)     │
│     ├─ Check if draw has winning number (DELETE)           │
│     └─ Reject if business rules violated (409 Conflict)    │
│                                                              │
│  5. AUDIT LOGGING                                           │
│     ├─ Log admin ID and email                              │
│     ├─ Log IP address                                      │
│     ├─ Log user agent                                      │
│     ├─ Log action (POST/PUT/DELETE)                        │
│     ├─ Log old and new values                              │
│     └─ Log timestamp                                       │
│                                                              │
│  6. CACHE INVALIDATION                                      │
│     ├─ Clear Redis cache                                   │
│     ├─ Clear Memory cache                                  │
│     └─ Next GET will fetch fresh data                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

```
STEP 1: Create Convex Mutations
├─ setWinningNumber(drawId, winningNumber, prizeAmount)
├─ updateWinningNumber(drawId, newWinningNumber, reason)
└─ deleteWinningNumber(drawId, reason)
   └─ Time: 30 minutes

STEP 2: Implement POST Handler
├─ Authenticate admin
├─ Validate input
├─ Call Convex mutation
├─ Invalidate cache
├─ Log audit event
└─ Return response
   └─ Time: 30 minutes

STEP 3: Implement PUT Handler
├─ Authenticate admin
├─ Validate input
├─ Check if draw exists
├─ Call Convex mutation
├─ Invalidate cache
├─ Log audit event with reason
└─ Return response
   └─ Time: 20 minutes

STEP 4: Implement DELETE Handler
├─ Authenticate admin
├─ Validate drawId
├─ Call Convex mutation
├─ Invalidate cache
├─ Log audit event
└─ Return response
   └─ Time: 20 minutes

STEP 5: Testing & Debugging
├─ Test all scenarios
├─ Test error cases
├─ Test cache invalidation
├─ Test audit logging
└─ Fix any issues
   └─ Time: 30 minutes

TOTAL TIME: 2-3 hours
```

---

## Error Handling Matrix

```
┌──────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  400 Bad Request                                             │
│  ├─ Invalid winningNumber (not 1-200)                       │
│  ├─ Invalid prizeAmount (negative)                          │
│  ├─ Missing required fields                                 │
│  └─ Invalid JSON format                                     │
│                                                               │
│  401 Unauthorized                                            │
│  ├─ No access token provided                                │
│  ├─ Invalid access token                                    │
│  └─ Token expired                                           │
│                                                               │
│  403 Forbidden                                               │
│  ├─ User is not admin                                       │
│  └─ User doesn't have permission                            │
│                                                               │
│  404 Not Found                                               │
│  ├─ DrawId doesn't exist                                    │
│  └─ Draw not found in database                              │
│                                                               │
│  409 Conflict                                                │
│  ├─ Draw already completed (can't update)                   │
│  ├─ Draw already has winning number (POST)                  │
│  └─ Draw doesn't have winning number (DELETE)               │
│                                                               │
│  500 Internal Server Error                                   │
│  ├─ Database error                                          │
│  ├─ Cache error                                             │
│  └─ Unexpected error                                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

The Winning Numbers API needs 3 write operations:

1. **POST** - Set winning number for a draw
2. **PUT** - Update/correct a winning number
3. **DELETE** - Remove a winning number

Each operation requires:
- Admin authentication
- Input validation
- Convex mutation
- Cache invalidation
- Audit logging
- Proper error handling

Estimated effort: **2-3 hours**

# Winning Numbers API - Summary & Explanation

## What Is This Task?

The Winning Numbers API is an endpoint that manages lottery draw results. Currently, it can **read** winning numbers but cannot **write** them. We need to implement the write operations so admins can set, update, and delete winning numbers.

---

## Current Situation

### What Works ✅
- **GET** `/api/winning-numbers` - Users can fetch winning numbers
- Cached for performance (Redis + Memory)
- Paginated results
- Formatted nicely (day, date, number)

### What's Broken ❌
- **POST** `/api/winning-numbers` - Returns "not implemented" error
- **PUT** `/api/winning-numbers` - Returns "not implemented" error
- **DELETE** `/api/winning-numbers` - Returns "not implemented" error

---

## Why Is This Important?

Without these operations, admins cannot:
- Set the winning number after a draw
- Correct a wrong winning number
- Cancel a draw

This is **core functionality** - the app can't work without it.

---

## What Needs to Be Done

### 1. POST - Set Winning Number
**When**: Admin runs a draw and gets the winning number
**What**: Store the winning number in the database
**Who**: Admin only
**Example**:
```
POST /api/winning-numbers
{
  "drawId": "2025-02-10",
  "winningNumber": 123,
  "prizeAmount": 5000
}
```

### 2. PUT - Update Winning Number
**When**: Admin needs to correct a wrong number
**What**: Update the winning number with a reason
**Who**: Admin only
**Example**:
```
PUT /api/winning-numbers
{
  "drawId": "2025-02-10",
  "winningNumber": 125,
  "reason": "Correction - previous was wrong"
}
```

### 3. DELETE - Remove Winning Number
**When**: Draw is cancelled or needs to be reset
**What**: Clear the winning number
**Who**: Admin only
**Example**:
```
DELETE /api/winning-numbers?drawId=2025-02-10
{
  "reason": "Draw cancelled"
}
```

---

## How It Works

### Database
- Winning numbers are stored in the `dailyDraws` table
- Each draw has a `winningNumber` field (1-200)
- Also stores `status`, `prizeAmount`, `updatedAt`, etc.

### Cache
- When a winning number is set, the cache is cleared
- Next time users fetch, they get the fresh number
- This ensures users see updates immediately

### Security
- Only admins can set/update/delete
- All actions are logged (who, when, from where)
- Input is validated (number must be 1-200)

---

## Implementation Overview

### Files to Modify
1. **convex/draws.ts** - Add Convex mutations
2. **app/api/winning-numbers/route.ts** - Implement POST, PUT, DELETE

### What Each Handler Does

**POST Handler**:
1. Check if user is admin
2. Validate the input
3. Call Convex to save the number
4. Clear the cache
5. Log the action
6. Return success

**PUT Handler**:
1. Check if user is admin
2. Validate the input
3. Check if draw exists
4. Call Convex to update the number
5. Clear the cache
6. Log the action with reason
7. Return success

**DELETE Handler**:
1. Check if user is admin
2. Validate the drawId
3. Call Convex to clear the number
4. Clear the cache
5. Log the action with reason
6. Return success

---

## Security Checks

Every write operation must:
1. **Authenticate** - Verify user is logged in
2. **Authorize** - Verify user is admin
3. **Validate** - Check input is correct
4. **Log** - Record who did what and when
5. **Invalidate Cache** - Clear old data

---

## Error Handling

The API should return proper error codes:
- `200` - Success
- `400` - Bad input (invalid number, missing fields)
- `401` - Not logged in
- `403` - Not admin
- `404` - Draw not found
- `409` - Can't update (draw already completed)
- `500` - Server error

---

## Example Scenarios

### Scenario 1: Admin Sets Winning Number
```
Admin: "The winning number for today is 123"
System: Saves 123 to database
System: Clears cache
System: Logs "Admin set winning number 123 for 2025-02-10"
Users: See 123 when they refresh
```

### Scenario 2: Admin Corrects Wrong Number
```
Admin: "Oops, I made a mistake. It's 125, not 123"
System: Updates database from 123 to 125
System: Clears cache
System: Logs "Admin corrected winning number from 123 to 125"
Users: See 125 when they refresh
```

### Scenario 3: Admin Cancels Draw
```
Admin: "Draw is cancelled due to technical issues"
System: Clears winning number from database
System: Clears cache
System: Logs "Admin cancelled draw 2025-02-10"
Users: See no winning number
```

---

## Why This Matters

### For Users
- They can see the correct winning number
- They know if they won
- They can claim their prize

### For Admins
- They can manage draws
- They can correct mistakes
- They can cancel draws if needed

### For Business
- Core functionality works
- Can run the lottery
- Can manage results

---

## Complexity Level

**Difficulty**: Medium
- Not too hard (similar to other API endpoints)
- Not too easy (requires multiple steps)
- Requires understanding of:
  - Authentication/Authorization
  - Database operations
  - Cache invalidation
  - Error handling

**Time**: 2-3 hours
- Convex mutations: 30 min
- POST handler: 30 min
- PUT handler: 20 min
- DELETE handler: 20 min
- Testing: 30 min

---

## Key Concepts

### Convex Mutations
- Functions that write to the database
- Run on the server
- Can't be called directly from frontend
- Must be called through API

### Cache Invalidation
- When data changes, cache must be cleared
- Otherwise users see old data
- Happens automatically after write

### Admin Authorization
- Only users with `isAdmin: true` can write
- Checked on every write operation
- Prevents regular users from changing data

### Audit Logging
- Records who did what and when
- Helps investigate issues
- Required for compliance

---

## What You'll Learn

By implementing this, you'll understand:
1. How to create API endpoints
2. How to authenticate users
3. How to authorize actions
4. How to validate input
5. How to call Convex mutations
6. How to invalidate caches
7. How to log actions
8. How to handle errors

---

## Next Steps

1. **Read the detailed explanation** - `WINNING_NUMBERS_API_EXPLANATION.md`
2. **Review the visual guide** - `WINNING_NUMBERS_API_VISUAL_GUIDE.md`
3. **Implement the mutations** - Create Convex functions
4. **Implement the handlers** - Create API endpoints
5. **Test thoroughly** - Verify all scenarios work
6. **Deploy** - Push to production

---

## Questions to Ask

Before starting, make sure you understand:
- What is a Convex mutation?
- How does authentication work?
- What is cache invalidation?
- Why do we need audit logging?
- What are HTTP status codes?

---

## Summary

**Task**: Implement write operations for Winning Numbers API
**What**: POST, PUT, DELETE endpoints
**Why**: Admins need to manage draw results
**How**: Create Convex mutations and API handlers
**Time**: 2-3 hours
**Difficulty**: Medium
**Status**: Ready to start

The implementation is straightforward - mostly following the same pattern as the existing GET operation, but with added security checks and cache invalidation.

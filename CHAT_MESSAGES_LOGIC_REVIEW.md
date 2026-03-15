# Chat Messages Logic Review

## Overview
The chat system implements a multi-room messaging platform with rate limiting, message editing/deletion, and video ad-gated message limits. Here's a comprehensive review of the logic flow.

---

## 1. Message Sending Flow (`sendMessage` mutation)

### Current Implementation
```
User Input → Validation → Rate Limit Check → Message Limit Check → Sanitization → DB Insert → Presence Update
```

### Key Logic Points

**1.1 User & Permission Validation**
- Verifies user profile exists
- Restricts system messages to admins only
- ✅ Good: Prevents unauthorized system messages

**1.2 Room Configuration Check**
- Fetches room config (maxUsers, maxMessagesPerUser)
- Validates room exists
- ✅ Good: Ensures room is valid before processing

**1.3 Room Capacity Check**
- Queries online users in room
- Compares against `maxUsers` (default 100)
- ✅ Good: Prevents overcrowding

**1.4 Message Limit Check** ⚠️ **POTENTIAL ISSUE**
```typescript
const messages = await ctx.db
  .query("chatMessages")
  .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
  .filter((q) => q.and(
    q.eq(q.field("roomId"), args.roomId),
    q.eq(q.field("isDeleted"), false),
    q.gt(q.field("createdAt"), userProfile.lastChatVideoWatchAt || 0)
  ))
  .collect();
```

**Issues Found:**
- Counts messages since `lastChatVideoWatchAt` (video ad watch timestamp)
- Limit is 3 messages per video watch
- **Problem**: If `lastChatVideoWatchAt` is never set, it defaults to 0 (epoch), meaning ALL messages since account creation are counted
- **Problem**: No mechanism to update `lastChatVideoWatchAt` when user watches a video ad
- **Problem**: The logic assumes video ad watching updates this field, but no mutation does this

**1.5 Rate Limiting**
- Uses `checkRateLimit()` with 3-second window
- Checks `userProfile.lastMessageAt`
- ✅ Good: Prevents spam (1 message per 3 seconds)

**1.6 Message Validation & Sanitization**
- Validates message length (1-140 chars)
- Sanitizes XSS patterns
- ✅ Good: Security-focused

**1.7 Database Insert**
- Creates message with metadata (userId, roomId, content, type, timestamps)
- ✅ Good: Proper schema

**1.8 Presence Update**
- Updates user presence with consistent sessionId
- ✅ Good: Tracks active users

---

## 2. Message Deletion Flow (`deleteMessage` mutation)

### Current Implementation
```
User owns message OR is admin/moderator → Soft delete with reason
```

### Key Logic Points

**2.1 Authorization**
```typescript
const canDelete = message.userId === userProfile._id || 
                 userProfile.isAdmin || 
                 (userProfile.isModerator || false);
```
- ✅ Good: Allows own deletion, admin/moderator override
- ✅ Good: Soft delete (preserves data for audit)

**2.2 Deletion Reason**
- Tracks who deleted (admin/moderator/self)
- ✅ Good: Audit trail

---

## 3. Message Editing Flow (`editMessage` mutation)

### Current Implementation
```
User owns message → Within 5-min window → Rate limit check → Sanitization → Update
```

### Key Logic Points

**3.1 Ownership Check**
- Only message owner can edit
- ✅ Good: Prevents unauthorized edits

**3.2 Time Window**
- 5-minute edit window (`EDIT_WINDOW_MS = 5 * 60 * 1000`)
- ✅ Good: Prevents editing old messages

**3.3 Rate Limiting on Edits**
- Uses same 3-second window as sending
- ✅ Good: Prevents edit spam

**3.4 Validation & Sanitization**
- Same as send message
- ✅ Good: Consistent validation

---

## 4. Message Retrieval Flow (`getMessages` query)

### Current Implementation
```
Query by room → Filter deleted → Order desc → Fetch user profiles → Format with user info → Return
```

### Key Logic Points

**4.1 Pagination**
- Default limit: 50 messages (reduced to 30 in UI)
- Cursor-based pagination for older messages
- ✅ Good: Efficient pagination

**4.2 Deleted Message Filtering**
```typescript
.filter((q) => q.eq(q.field("isDeleted"), false))
```
- ✅ Good: Hides soft-deleted messages

**4.3 User Profile Enrichment**
- Fetches all user profiles for messages
- Handles missing profiles gracefully
- ✅ Good: Fallback for deleted users

**4.4 System Message Handling**
```typescript
if (!msg.userId || msg.messageType === 'system') {
  return {
    ...msg,
    user: {
      id: 'system',
      displayName: 'System',
      // ...
    },
  };
}
```
- ✅ Good: Handles system messages without userId

**4.5 Message Ordering**
- Returns in chronological order (reversed from desc query)
- ✅ Good: Natural reading order

---

## 5. Online Users Flow (`getOnlineUsers` query)

### Current Implementation
```
Query by room + status + recent activity → Deduplicate by userId → Fetch profiles → Format
```

### Key Logic Points

**5.1 Activity Window**
- 5-minute window (`fiveMinutesAgo = Date.now() - (5 * 60 * 1000)`)
- ✅ Good: Reasonable timeout

**5.2 Deduplication**
- Keeps most recent presence record per user
- ✅ Good: Handles multiple sessions

**5.3 Profile Filtering**
```typescript
.filter(u => u.profile !== null)
```
- ✅ Good: Only returns users with valid profiles

---

## 6. Typing Indicator Flow (`setTypingStatus` mutation)

### Current Implementation
```
Update presence with isTyping flag → 5-second timeout
```

### Key Logic Points

**6.1 Debouncing in UI**
- 500ms debounce before sending typing status
- ✅ Good: Reduces API calls

**6.2 Timeout**
- 5-second auto-clear
- ✅ Good: Prevents stale typing indicators

---

## 7. Presence Cleanup (`cleanupPresence` mutation)

### Current Implementation
```
Find stale records (>15 min inactive) → Delete
```

### Key Logic Points

**7.1 Stale Record Detection**
- 15-minute threshold
- ✅ Good: Reasonable cleanup window

**7.2 Internal Mutation**
- `cleanupPresenceInternal` for cron jobs
- ✅ Good: Prevents client-side cleanup calls

---

## 8. UI Message Handling (`chat-container.tsx`)

### Current Implementation

**8.1 Message Sending**
```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  // Validation → sendMessageDirectly
}

const sendMessageDirectly = async (messageContent: string) => {
  // Try send → Catch VIDEO_AD_REQUIRED → Show modal
}
```

**Issues Found:**
- ✅ Good: Catches VIDEO_AD_REQUIRED error
- ✅ Good: Shows video ad modal
- ⚠️ **Problem**: After video ad, sends pending message but doesn't update `lastChatVideoWatchAt`
- ⚠️ **Problem**: No mechanism to reset message count after video watch

**8.2 Auto-Scroll Logic**
```typescript
useEffect(() => {
  // Track message count → Scroll if near bottom or first load
}, [messagesData])
```
- ✅ Good: Prevents jarring scrolls
- ✅ Good: Shows "New messages" indicator if scrolled up

**8.3 Character Limit**
- Hard limit at 140 characters
- Prevents typing beyond limit
- ✅ Good: UX feedback

**8.4 Message Editing UI**
- 5-minute window enforced
- Character counter
- ✅ Good: Clear feedback

---

## Critical Issues Found

### 🔴 Issue 1: Message Limit Reset Never Happens
**Severity**: HIGH

**Problem**: 
- Message limit is based on `lastChatVideoWatchAt`
- No mutation updates `lastChatVideoWatchAt` when user watches video ad
- Users can never send more messages after hitting limit

**Current Flow**:
1. User sends 3 messages
2. 4th message triggers VIDEO_AD_REQUIRED
3. User watches video ad
4. Pending message is sent
5. ❌ `lastChatVideoWatchAt` is never updated
6. User still can't send more messages (still at 3 messages since epoch)

**Fix Required**:
- Create mutation to update `lastChatVideoWatchAt` when video ad is watched
- Call this mutation after successful video ad completion
- Reset message count logic to use this timestamp

### 🟡 Issue 2: Message Limit Logic Fragile
**Severity**: MEDIUM

**Problem**:
- Relies on `lastChatVideoWatchAt` being set
- If field is missing/null, defaults to 0 (epoch)
- Counts ALL messages since account creation
- No validation that this field exists

**Fix Required**:
- Initialize `lastChatVideoWatchAt` to current time on user creation
- Add migration for existing users
- Consider using a different approach (e.g., message count per session)

### 🟡 Issue 3: No Message Count Reset on Room Change
**Severity**: MEDIUM

**Problem**:
- Message limit is per-room but based on global `lastChatVideoWatchAt`
- User can't distinguish between rooms
- Unclear if limit resets per room or globally

**Current Behavior**:
- User sends 3 messages in Room A
- Switches to Room B
- Still can't send messages (limit is global)

**Fix Required**:
- Clarify if limit should be per-room or global
- If per-room: track `lastChatVideoWatchAt` per room
- If global: document this behavior clearly

### 🟡 Issue 4: Rate Limiting Error Handling
**Severity**: LOW

**Problem**:
```typescript
if (!rateLimit.allowed) {
  const waitSeconds = Math.ceil(rateLimit.waitMs / 1000);
  throw new Error(`Please wait ${waitSeconds} seconds before sending another message`);
}
```
- Error message is user-facing but might be confusing
- UI silently clears input on rate limit error
- User doesn't know why message didn't send

**Fix Required**:
- Show clear error message to user
- Don't silently clear input
- Let user retry after timeout

### 🟡 Issue 5: Profanity Filter Not Integrated
**Severity**: LOW

**Problem**:
- `chatModeration.ts` has `containsProfanity()` and `isSpam()` functions
- These are never called in `sendMessage` mutation
- Profanity filter is dead code

**Fix Required**:
- Integrate profanity check in `sendMessage`
- Integrate spam detection
- Or remove unused code

---

## Recommendations

### Priority 1 (Critical)
1. **Implement `lastChatVideoWatchAt` update mechanism**
   - Create mutation: `updateLastChatVideoWatchAt(userId, timestamp)`
   - Call after successful video ad completion
   - Test message limit reset

2. **Initialize `lastChatVideoWatchAt` on user creation**
   - Set to current time
   - Add migration for existing users

### Priority 2 (Important)
3. **Clarify message limit scope**
   - Decide: per-room or global?
   - Update schema if needed
   - Document in code

4. **Improve rate limit error handling**
   - Show user-facing error message
   - Don't silently clear input
   - Provide retry guidance

### Priority 3 (Nice to Have)
5. **Integrate profanity/spam detection**
   - Call `containsProfanity()` in `sendMessage`
   - Call `isSpam()` with recent messages
   - Log violations for moderation

6. **Add message statistics**
   - Track messages per user per room
   - Track deletion reasons
   - Add admin dashboard

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Sends Message                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Validate User & Permissions   │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Check Room Configuration      │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Check Room Capacity           │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Check Message Limit           │ ⚠️ ISSUE: lastChatVideoWatchAt never updated
        │  (since lastChatVideoWatchAt)  │
        └────────────┬───────────────────┘
                     │
        ┌────────────┴──────────────────┐
        │                               │
        ▼                               ▼
   ✅ Under Limit              ❌ Limit Reached
        │                               │
        ▼                               ▼
   Check Rate Limit         Return VIDEO_AD_REQUIRED
        │                               │
   ┌────┴────┐                         ▼
   │          │                   Show Video Ad Modal
   ▼          ▼                         │
✅ OK    ❌ Wait                        ▼
   │          │                   User Watches Video
   ▼          ▼                         │
Sanitize  Error                        ▼
   │                            ⚠️ MISSING: Update lastChatVideoWatchAt
   ▼                                    │
Insert Message                         ▼
   │                            Send Pending Message
   ▼                                    │
Update Presence                        ▼
   │                            ✅ Message Sent
   ▼
✅ Success
```

---

## Testing Recommendations

### Unit Tests
- [ ] Message limit calculation with various `lastChatVideoWatchAt` values
- [ ] Rate limiting edge cases (exactly at window boundary)
- [ ] Message sanitization with XSS payloads
- [ ] Profanity detection

### Integration Tests
- [ ] Full message send → video ad → message send flow
- [ ] Message limit reset after video watch
- [ ] Room capacity limits
- [ ] Presence cleanup after 15 minutes

### E2E Tests
- [ ] User sends 3 messages → hits limit → watches video → sends more messages
- [ ] User edits message within 5-minute window
- [ ] Admin deletes user message
- [ ] Typing indicator appears/disappears

---

## Summary

The chat system has solid fundamentals with good validation, sanitization, and authorization. However, the **message limit reset mechanism is broken** - users can never send more messages after hitting the limit because `lastChatVideoWatchAt` is never updated. This is the critical issue that needs immediate attention.

Secondary issues include unclear message limit scope (per-room vs global), poor rate limit error handling, and unused profanity detection code.

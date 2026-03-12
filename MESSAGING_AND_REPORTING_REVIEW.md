# System Messages, Admin Messages, and User Reporting Review

## Overview
The application has a comprehensive messaging and moderation system with three distinct message types and a user reporting mechanism. This review covers all components related to system messages, admin messages, and user report messages in chat.

---

## 1. MESSAGE TYPES

### 1.1 System Messages
**Purpose**: Automated messages from the system to guide user behavior
**Characteristics**:
- Sent by admins only (permission check: `userProfile.isAdmin`)
- No userId associated (optional field)
- Display name: "System"
- Types: "manners", "behavior", "encouragement", "custom"
- Appear centered in chat with special styling

**Location**: `convex/chat.ts` - `adminSendMessage` mutation (line 123)

**Predefined Types**:
- **Manners**: Reminders about good chat etiquette
- **Behavior**: Behavioral guidelines and warnings
- **Encouragement**: Positive reinforcement messages
- **Custom**: Admin-written custom messages (up to 500 characters)

**Sending Flow**:
1. Admin accesses system message panel in chat
2. Selects message type or writes custom message
3. Chooses target room (global or draw-specific)
4. Message sent via `/api/chat/system-message` endpoint
5. Stored in database with `messageType: "system"`

---

### 1.2 Admin Messages
**Purpose**: Direct communication from admins to users
**Characteristics**:
- Sent by admins with admin secret verification
- Can have userId or be anonymous (system-level)
- Display name: "Admin" or "System" depending on context
- Type: "admin"
- Appear centered in chat with admin styling

**Location**: `convex/chat.ts` - `adminSendMessage` mutation (line 123)

**Sending Flow**:
1. Admin accesses admin message tab in dashboard
2. Writes message content
3. Selects target room
4. Message sent via `/api/admin/send-message` endpoint
5. Requires `ADMIN_SECRET` verification (server-side)
6. Stored with `messageType: "admin"`

**Security**:
- CSRF token validation required
- Admin secret verification (environment variable)
- IP-based rate limiting (10 requests per minute)
- Session validation

---

### 1.3 Investigation Messages
**Purpose**: Special messages for admin investigations or announcements
**Characteristics**:
- Type: "investigation"
- Similar to admin messages but marked for investigation purposes
- Can be used for special announcements or moderation notes

**Location**: `convex/chat.ts` - `adminSendMessage` mutation supports this type

---

## 2. USER REPORTING SYSTEM

### 2.1 Report Message Functionality
**Purpose**: Allow users to flag inappropriate messages for admin review

**Location**: `convex/chat.ts` - `reportMessage` mutation (line 551)

**Report Data Tracked**:
```typescript
{
  reportCount: number,           // Total number of reports
  reportedBy: Id<"userProfiles">[],  // Array of user IDs who reported
  lastReportedAt: number,        // Timestamp of last report
  lastReportReason: string,      // Reason from last report
}
```

**Reporting Rules**:
- Users cannot report their own messages
- Duplicate reports from same user are prevented
- Each report increments `reportCount`
- Reason is optional (defaults to "Inappropriate content")

**Sending Flow**:
1. User clicks report button on message
2. Optional reason provided
3. Report sent via `reportMessageMutation` in chat container
4. System checks:
   - Message exists
   - User is not message author
   - User hasn't already reported this message
5. Report data updated in database

---

### 2.2 Viewing Reported Messages
**Purpose**: Admin dashboard to review flagged messages

**Location**: `convex/chat.ts` - `getReportedMessages` query (line 596)

**Data Returned**:
```typescript
{
  ...message,
  author: {
    id: string,
    displayName: string,
    avatarUrl?: string,
    avatarName?: string,
    avatarType?: 'basic' | 'special',
  },
  reporters: Array<{
    id: string,
    displayName: string,
  }>
}
```

**Features**:
- Returns up to 100 reported messages
- Includes message author information
- Lists all users who reported the message
- Sorted by most recent first
- Only shows messages with `reportCount >= 1`

---

## 3. ADMIN DASHBOARD INTERFACE

### 3.1 Admin Dashboard Location
**File**: `app/admin/page.tsx`

**Tabs Available**:
1. **set-result**: Set winning numbers
2. **set-time**: Set draw times
3. **auto-schedule**: Auto-schedule draws
4. **admin-message**: Send admin messages
5. **system-message**: Send system messages
6. **user-management**: Manage users (ban/unban/promote moderators)

### 3.2 Admin Message Tab
**UI Components**:
- Room selector (Global Chat / Draw Room)
- Message textarea (max length: unlimited in UI, but validated server-side)
- Send button with loading state
- Success/error message display

**Validation**:
- Message content required
- Room selection required
- CSRF token validation
- Admin secret verification

### 3.3 System Message Tab
**UI Components**:
- Room selector (Global Chat / Draw Room)
- Quick action buttons:
  - Good Manners (Heart icon)
  - Behavior Reminder (Shield icon)
  - Encouragement (Sparkles icon)
- Custom message input (max 500 characters)
- Character counter
- Send button

**Features**:
- Pre-defined message templates
- Custom message support
- Real-time character count
- Loading states during send

---

## 4. CHAT CONTAINER REPORTING UI

### 4.1 Report Message Button
**Location**: `components/chat/chat-container.tsx`

**Features**:
- Report button on each message
- Confirmation dialog before reporting
- Success message after report
- Error handling with user feedback
- Prevents duplicate reports

**User Experience**:
1. User hovers over message
2. Report button appears
3. Click opens report dialog
4. Optional reason input
5. Confirmation required
6. Success notification shown

---

## 5. API ENDPOINTS

### 5.1 System Message Endpoint
**Route**: `app/api/chat/system-message/route.ts`

**Method**: POST

**Request Body**:
```typescript
{
  roomId: string,
  messageType: "manners" | "behavior" | "encouragement" | "custom",
  customMessage?: string,
  userId: string
}
```

**Security**:
- CSRF token validation
- Session validation
- IP rate limiting (10 requests/minute)
- Access token verification

**Response**:
```typescript
{
  success: boolean,
  result: messageId
}
```

### 5.2 Admin Send Message Endpoint
**Route**: `app/api/admin/send-message/route.ts`

**Method**: POST

**Request Body**:
```typescript
{
  roomId: string,
  content: string,
  messageType?: "text" | "system" | "admin" | "investigation",
  adminSecret: string
}
```

**Security**:
- CSRF token validation
- Admin secret verification
- Session validation

**Response**:
```typescript
{
  success: boolean,
  messageId: string,
  message: string
}
```

---

## 6. DATABASE SCHEMA

### 6.1 Chat Messages Table
**Location**: `convex/schema.ts`

**Fields**:
```typescript
{
  userId: optional<Id<"userProfiles">>,  // Optional for system messages
  roomId: string,                         // "global", "draw_123", etc.
  content: string,                        // Message text
  messageType: "text" | "system" | "winner" | "admin" | "investigation",
  
  // Moderation
  isDeleted: boolean,
  isEdited: boolean,
  editedAt?: number,
  reportCount?: number,                   // Number of reports
  reportedBy?: Id<"userProfiles">[],     // Users who reported
  lastReportedAt?: number,
  lastReportReason?: string,
  deletedReason?: string,
  
  createdAt: number,
}
```

**Indexes**:
- `by_room_created`: For efficient room message queries
- `by_user_created`: For user message queries

---

## 7. SECURITY FEATURES

### 7.1 Message Validation
- Content sanitization via `validateChatMessage()`
- Max length enforcement
- Profanity filtering (basic implementation in `convex/chatModeration.ts`)
- Spam detection (repeated messages, excessive caps, repeated characters)

### 7.2 Access Control
- System messages: Admin only
- Admin messages: Admin secret + CSRF token
- Report messages: Authenticated users only
- Delete messages: Owner, admin, or moderator
- Edit messages: Owner only (within 5-minute window)

### 7.3 Rate Limiting
- IP-based rate limiting for admin actions
- Per-user message rate limiting
- Edit rate limiting (prevent spam editing)
- Typing status debouncing

### 7.4 CSRF Protection
- Token validation on all admin endpoints
- Session ID verification
- HTTP-only cookies

---

## 8. USER MANAGEMENT IN ADMIN DASHBOARD

### 8.1 User Management Component
**Location**: `components/admin/UserManagement.tsx`

**Features**:
- Search users by username/email
- View user details (email, join date, coins, winnings)
- Ban/unban users
- Promote/demote moderators (admin only)
- Pagination support
- Real-time status updates

**Actions Available**:
- **Ban**: Prevents user login and access
- **Unban**: Restores user access
- **Promote to Moderator**: Grants moderation privileges
- **Demote from Moderator**: Removes moderation privileges

**API Endpoint**: `app/api/admin/users` (POST)

---

## 9. MODERATION CAPABILITIES

### 9.1 Admin Capabilities
- Send system messages
- Send admin messages
- View reported messages
- Delete any message
- Ban/unban users
- Promote/demote moderators
- Access full admin dashboard

### 9.2 Moderator Capabilities
- Delete messages (own or others)
- View reported messages (implied)
- Cannot ban users
- Cannot promote other moderators

### 9.3 User Capabilities
- Send regular messages
- Edit own messages (within 5 minutes)
- Delete own messages
- Report inappropriate messages
- Cannot access admin features

---

## 10. MESSAGE DISPLAY IN CHAT

### 10.1 System Message Display
**Styling**:
- Centered alignment
- Special background color (blue/purple gradient)
- System icon
- No user avatar
- Display name: "System"

**Example**:
```
┌─────────────────────────────────────┐
│  🛡️ System: Please be respectful   │
│     to other players in chat        │
└─────────────────────────────────────┘
```

### 10.2 Admin Message Display
**Styling**:
- Centered alignment
- Admin-specific styling
- Admin icon
- Display name: "Admin"

**Example**:
```
┌─────────────────────────────────────┐
│  📢 Admin: Important announcement   │
│     about upcoming maintenance      │
└─────────────────────────────────────┘
```

### 10.3 Regular Message Display
**Styling**:
- Left-aligned (own messages) or right-aligned (others)
- User avatar
- Display name
- Timestamp
- Report button on hover

---

## 11. ISSUES & RECOMMENDATIONS

### 11.1 Current Issues
1. **No dedicated reported messages admin view**: Reported messages are queried but no UI component exists to display them
2. **Limited profanity filter**: Only basic word list, no advanced NLP
3. **No message moderation queue**: No workflow for reviewing and acting on reports
4. **No audit logging for admin actions**: Admin message sends not logged
5. **System message types hardcoded**: No dynamic system message type management

### 11.2 Recommendations

#### High Priority
1. **Create Reported Messages Dashboard**
   - Display all reported messages with reporter info
   - Allow admins to approve/dismiss reports
   - Delete messages with reason
   - Ban users for repeated violations

2. **Add Audit Logging**
   - Log all admin actions (messages sent, users banned, etc.)
   - Include timestamp, admin ID, action details
   - Create audit log viewer in admin dashboard

3. **Implement Message Moderation Queue**
   - Queue for reported messages
   - Workflow: Review → Approve/Dismiss → Action
   - Track moderation decisions

#### Medium Priority
1. **Enhance Profanity Filter**
   - Expand word list
   - Add context-aware filtering
   - Allow custom word lists per room

2. **Add Message Templates**
   - Create reusable system message templates
   - Allow admins to create custom templates
   - Version control for templates

3. **Implement Moderation Analytics**
   - Track report trends
   - Identify problematic users
   - Monitor admin action frequency

#### Low Priority
1. **Add Message Reactions**
   - Allow users to react to messages
   - Track reaction counts
   - Display popular reactions

2. **Implement Message Threading**
   - Allow replies to specific messages
   - Create message threads
   - Reduce chat clutter

---

## 12. TESTING CHECKLIST

- [ ] System message sends correctly to specified room
- [ ] Admin message sends with proper authentication
- [ ] User can report message successfully
- [ ] Duplicate reports are prevented
- [ ] Self-reporting is blocked
- [ ] Reported messages appear in admin query
- [ ] Message deletion works for admins/moderators
- [ ] Message editing respects 5-minute window
- [ ] Rate limiting prevents spam
- [ ] CSRF protection blocks unauthorized requests
- [ ] User ban/unban works correctly
- [ ] Moderator promotion/demotion works
- [ ] Message content is sanitized
- [ ] Profanity filter catches violations
- [ ] Spam detection identifies patterns

---

## 13. SUMMARY

The messaging and reporting system is well-structured with:
- ✅ Three distinct message types (system, admin, regular)
- ✅ User reporting mechanism with duplicate prevention
- ✅ Admin dashboard for user management
- ✅ Security features (CSRF, rate limiting, auth)
- ✅ Moderation capabilities (delete, ban, promote)

**Main Gap**: No UI for reviewing reported messages and taking action on them. This should be the next priority for implementation.

# Chat Message Flow - Quick Reference

## The Flow (What Users Experience)

```
Message 1 ✓ → Message 2 ✓ → Message 3 ✓ → [Video Ad Opens] → Watch 3s → [Message Sent] → Message 1 ✓ → ...
```

## User Actions

| Action | Result |
|--------|--------|
| Send message 1-3 | Sends immediately, no delay |
| Send message 4 | Video ad opens automatically |
| Click X on video | Modal closes, message discarded |
| Watch video 3s | "Continue Chatting" button appears |
| Click "Continue Chatting" | Message sent, count resets |

## No User Sees

- ❌ No error messages
- ❌ No loading spinners
- ❌ No rate limit warnings
- ❌ No confirmation dialogs
- ❌ No debug info

## Backend Logic

**Message Limit Check:**
```
Count messages since lastChatVideoWatchAt
If count >= 3 → throw VIDEO_AD_REQUIRED
```

**Message Limit Reset:**
```
User completes video → Update lastChatVideoWatchAt to now()
Next message query → Counts from new timestamp
Message count resets to 0
```

## Key Constants

- `MESSAGES_BEFORE_AD = 3` - Messages allowed before video ad
- Video duration: `3 seconds`
- No rate limiting between messages

## Files Changed

1. **convex/chat.ts** - Removed rate limiting, message limit logic
2. **components/chat/chat-container.tsx** - Silent error handling, video ad flow
3. **components/account/VideoAdModal.tsx** - Removed debug info

## How It Works

### Step 1: User sends message
```
sendMessage mutation called
→ Check message count since lastChatVideoWatchAt
→ If < 3: Insert message, return success
→ If >= 3: Throw VIDEO_AD_REQUIRED error
```

### Step 2: Frontend catches error
```
Catch VIDEO_AD_REQUIRED error
→ Queue message in state
→ Clear input (no error shown)
→ Open video ad modal
```

### Step 3: User watches video
```
Video plays for 3 seconds
→ User clicks "Continue Chatting"
→ completeChatVideoWatch mutation called
→ Backend updates lastChatVideoWatchAt
→ Pending message is sent
→ Modal closes
```

### Step 4: Message count resets
```
Next message query
→ Counts messages since NEW lastChatVideoWatchAt
→ Count is 0 (or 1 if message was just sent)
→ User can send 2-3 more messages
```

## Testing

Quick test:
1. Send 3 messages (should all work)
2. Try to send 4th (video should open)
3. Click X (modal closes, no error)
4. Try again (video opens again)
5. Watch video (button appears)
6. Click button (message sent, count resets)
7. Send 3 more messages (should all work)

## Troubleshooting

**Video doesn't open?**
- Check `showVideoAd` state is being set
- Check `VIDEO_AD_REQUIRED` error is being thrown

**Message not sent after video?**
- Check `onChatSuccess` callback is being called
- Check `completeChatVideoWatch` mutation is updating `lastChatVideoWatchAt`

**Count not resetting?**
- Check `lastChatVideoWatchAt` is being updated in database
- Check message query is using correct timestamp

**Error showing to user?**
- Check error handling in `sendMessageDirectly`
- Check no error state is being set

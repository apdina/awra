# TICKET FLOW: From Purchase to Win Calculation

## 🎯 **Overview**
This document details the **complete end-to-end flow** from user purchasing a ticket to win calculation and payout in the lottery system. The system uses **unifiedTickets** (single table design) with precise **24-hour draw windows**, **UTC time calculations**, and **atomic coin transactions**.

**Key Design Principles:**
- **Date-only matching**: Tickets stored with `drawDate` (DD/MM/YYYY) - no time dependency
- **24-hour purchase windows**: Tickets bought between Draw N-1 and Draw N belong to Draw N
- **Sunday skipping**: Automatic 48-hour window when skipping Sundays
- **Atomic payouts**: Optimistic locking prevents race conditions
- **Idempotency**: Duplicate protection via unique keys

## 📊 **Data Models (schema.ts)**

### `unifiedTickets` Table (Core)
```typescript
{
  ticketId: \"TICKET-1234567890-ABCDEF\",        // Unique ID
  userId: Id<\"userProfiles\">,                  // Buyer
  bets: [{number: 123, amount: 5}, ...],       // Multiple bets per ticket
  totalAmount: 15,                             // Total coins spent
  status: \"active\" | \"won\" | \"lost\",           // Lifecycle
  drawDate: \"20/02/2026\",                      // DD/MM/YYYY - MATCHING KEY
  purchasedAt: 1234567890123,                  // Timestamp (ms)
  winningNumber: 123 | null,                   // Set after draw
  winningAmount: 1500,                         // Payout (if won)
  matchType: \"exact\" | \"partial\" | \"none\"      // Win type
}
```

### Payout Rules (`unifiedTickets.ts`)
```
Numbers: 1-200 (3 digits)
Exact match (all 3 digits):    bet × 100
Partial match (last 2 digits): bet × 20  
No match:                      0
```

**Example:**
```
Bet: 123 ($5)  → Winning: 123 → $500 (100x)
Bet: 123 ($5)  → Winning: 223 → $100 (20x) 
Bet: 123 ($5)  → Winning: 456 → $0
```

## 🕐 **Time Windows & Draw Logic**

### **24-Hour Window Rule** (`draws.ts`, `getNextDrawInfo`)
```
Draw 20/02/2026 @ 21:40 UTC
├── Window START: 19/02/2026 21:40:01 UTC  ← Tickets bought here belong to 20/02
├── Window END:   20/02/2026 21:40:00 UTC  ← Tickets bought here belong to 20/02
└── NEXT Window: 20/02/2026 21:40:01 UTC  → Tickets bought here belong to 21/02
```

**Sunday Skip Logic (UTC Critical!):**
```
Friday 21:40 → Sunday 21:40 (skip Saturday? No - normal 24H)
Sunday 21:40 → Tuesday 21:40 (48H window, skip Monday)
UTC Methods ONLY: getUTCDay(), setUTCDate(), etc.
```

**Draw Creation Flow:**
```
1. Cron checks if current draw.drawingTime < now
2. Calculates next draw date (skipping Sundays/holidays)
3. Creates dailyDraws record
4. Frontend queries getCurrentDraw → shows countdown
```

## 💳 **1. USER BUYS TICKET** (`purchaseUnifiedTicket`)

### **Frontend → Backend Flow**
```
QuickPlay.tsx → buyTicket() → /api/tickets → convex/unifiedTickets.purchaseUnifiedTicket
```

### **Server Processing** (`unifiedTickets.ts`)
```typescript
1. validateBets(): numbers 1-200, amount ≥ 1
2. Calculate totalAmount = Σ(bet.amount)
3. Check user.coinBalance ≥ totalAmount
4. Generate ticketId = \"TICKET-{timestamp}-{random}\"
5. now = Date.now() → getNextDrawInfo(ctx, now) → drawDate
6. Insert unifiedTickets: {bets, drawDate, status: \"active\"}
7. PATCH user: coinBalance -= totalAmount (optimistic lock)
8. Insert coinTransactions: type=\"purchase\"
9. Return {ticketId, newBalance, drawDate}
```

⚠️ **KNOWN ISSUE**: `drawDate` calculation via `getNextDrawInfo` not working correctly - tickets may assign wrong draw date

## ⏳ **2. TICKET WAITS** (`status: \"active\"`)

```
Tickets stored by drawDate only (DD/MM/YYYY)
Multiple bets per ticket supported
Query: getUserUnifiedTickets({drawDate: \"20/02/2026\"})
```

## 🏆 **3. ADMIN SETS WINNING NUMBER** (`setWinningNumber`)

### **Admin Flow** (`app/admin/page.tsx`)
```
Admin → POST /api/draws/set-winning → convex/draws.setWinningNumber
```

### **Processing Steps** (`draws.ts → unifiedTickets.processDraw`)
```typescript
1. Verify adminSecret from systemConfig
2. Validate winningNumber (1-200)
3. Parse drawDate → calculate drawingTime (UTC)
4. Verify drawingTime < now (can't set future)
5. Find ALL active tickets: status=\"active\" && drawDate=args.drawDate
6. For each ticket.bets[]:
   ├─ calculatePayout(bet.number, winningNumber, bet.amount)
   ├─ exact: 100x → status=\"won\"
   ├─ partial: 20x → status=\"won\" 
   └─ none: 0 → status=\"lost\"
7. For winning tickets:
   ├─ PATCH ticket: winningAmount, matchType, status=\"won\"
   ├─ PATCH user: coinBalance += winningAmount
   └─ Insert coinTransactions: type=\"winning\"
8. Invalidate caches (Redis + memory)
9. Return {winners: X, totalPayout: YYY}
```

## 💰 **4. COIN SYSTEM** (`coins.ts`)

### **Atomic Transactions**
```
Optimistic Locking: coinBalanceVersion++ prevents race conditions
Idempotency: unique idempotencyKey prevents duplicates
Rate Limiting: max 10 tx/min per user
Validation: coinAmountSchema, coinBalanceSchema
```

**Transaction Types:**
```
purchase:  -15 coins (buy ticket)
winning:  +1500 coins (win payout)
bonus:     +50 coins (daily reward)
```

## 🔍 **5. USER QUERIES RESULTS**

```
My Tickets: GET /api/tickets → getUserUnifiedTickets()
Filter: status=\"won\", drawDate=\"20/02/2026\"
RecentActivity.tsx shows: Numbers, Status, Winnings
```

## 🛡️ **Edge Cases & Safety**

### **Time Safety (UTC Critical)**
```
❌ **ACTUAL BUG**: lib/getCurrentDraw.ts `getNextDrawInfo` UTC logic failing - causing drawDate miscalculation
✅ RIGHT: new Date().getUTCDay()  → UTC (matches frontend)
```

### **Duplicate Protection**
```
Idempotency keys prevent double-spend
Version conflicts auto-retry (3x)
```

### **Rate Limiting**
```
10 coin transactions/minute/user
Built into userProfile.recentCoinTransactions[]
```

## 📈 **Admin Monitoring**

```
1. app/admin/ → set-winning-number form
2. Process ALL tickets for drawDate (date-only matching)
3. Live stats: totalTickets, winners, totalPayout
4. Auto cache invalidation
```

## 🎮 **Frontend Components**
```
QuickPlay.tsx          → Buy ticket
RecentActivity.tsx     → Show recent tickets + wins  
TicketsContent.tsx     → Full ticket history
WinningNumberDisplay   → Live results
```

## ✅ **Verification Checklist**
- [ ] Tickets match correct draw (24H window)
- [ ] Sunday skipping works (48H window)  
- [ ] UTC calculations consistent (no local time bugs)
- [ ] Payouts: exact=100x, partial=20x
- [ ] Atomic coins: no double-spend
- [ ] Idempotency: no duplicate tickets
- [ ] Caches invalidate after draws

**CRITICAL BUG**: Server-side `drawDate` calculation broken → tickets match wrong draws → **FIX REQUIRED**


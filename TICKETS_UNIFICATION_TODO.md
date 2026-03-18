# Tickets Page Unification TODO

## Status: In Progress

### 1. [x] Read & enhance `app/[locale]/tickets/hooks/useTicketsLogic.ts`
   - Add auth/translations if missing
   - Ensure returns: tickets, loading, error, calculateTotalWinnings, summaryStats, t, locale

### 2. [x] Create unified `app/[locale]/tickets/TicketsContent.tsx`
   - Responsive Tailwind: mobile cards → desktop table/header
   - Use useTicketsLogic for all data
   - PageWithSidebarAds for desktop layout
   - Mobile: expandable accordions, grouped bets
   - Desktop: full table, load more, stats

### 3. [x] Update `app/[locale]/tickets/page.tsx`
   - Direct render TicketsContent

### 4. [x] Delete redundant files
   - TicketsContentMobile.tsx
   - TicketsContentUnified.tsx
   - (Optional) TicketsList.tsx, TicketsTable.tsx if fully integrated

### 5. [x] Test & Verify ✅
   - npm run lint ✅
   - Responsive: mobile cards + "see more" pagination vs desktop ✅
   - Auth-gated, API data transform, expand/bets/winnings calc ✅
   - npm run dev

### 6. [x] Complete Task
   - attempt_completion


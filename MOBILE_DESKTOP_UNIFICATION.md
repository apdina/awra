# Mobile & Desktop Unification Strategy

## Current State Analysis

### Components with Mobile/Desktop Duplication

1. **Play Page**
   - `PlayContent.tsx` (Desktop)
   - `PlayContent-Mobile.tsx` (Mobile)
   - **Duplication Level:** HIGH (70% logic duplication)

2. **Home Page**
   - `HomeContent.tsx` (Desktop)
   - `HomeContentMobile.tsx` (Mobile)
   - **Duplication Level:** MEDIUM (40% logic duplication)

3. **Tickets Page**
   - `page.tsx` (Main)
   - `TicketsContentMobile.tsx` (Mobile)
   - **Duplication Level:** MEDIUM (50% logic duplication)

4. **Winning Numbers Page**
   - `WinningNumbersContent.tsx` (Desktop)
   - No separate mobile (uses responsive design)
   - **Duplication Level:** LOW

---

## Key Differences Identified

### PlayContent (Desktop vs Mobile)

**Desktop:**
- Uses `Set<number>` for selected numbers
- Uses `Map<number, number>` for bet amounts
- Grid-based number selection (visual grid)
- Inline editing of bets
- Complex state management

**Mobile:**
- Uses `BetLine[]` array structure
- Simpler linear input approach
- 8 input rows for bet entry
- Different localStorage keys

**Common Logic:**
- Validation (number range 1-200, amount > 0)
- Bet submission
- Error handling
- Authentication checks
- localStorage persistence

---

## Recommended Unification Approach

### Strategy: Unified Component with Responsive Rendering

**Best Practice:** Keep business logic unified, separate only UI/styling

### Structure:

```
app/[locale]/play/
├── PlayContent.tsx (Unified - handles all logic)
├── components/
│   ├── PlayGrid.tsx (Desktop grid UI)
│   └── PlayForm.tsx (Mobile form UI)
└── hooks/
    └── usePlayLogic.ts (Shared business logic)
```

### Benefits:
✅ Single source of truth for logic
✅ Easier maintenance
✅ Consistent behavior across devices
✅ Reduced code duplication (70% → 10%)
✅ Easier testing
✅ Easier to add features

---

## Implementation Plan

### Phase 1: Extract Shared Logic
1. Create `hooks/usePlayLogic.ts`
2. Move all business logic (validation, submission, state management)
3. Keep device-specific state separate

### Phase 2: Create Responsive Components
1. Create `components/PlayGrid.tsx` (Desktop UI)
2. Create `components/PlayForm.tsx` (Mobile UI)
3. Both use same logic from hook

### Phase 3: Unify Main Component
1. Update `PlayContent.tsx` to use hook + responsive rendering
2. Remove `PlayContent-Mobile.tsx`
3. Use `useMediaQuery` or responsive classes

### Phase 4: Repeat for Other Components
1. HomeContent
2. TicketsContent
3. Other duplicated components

---

## Code Examples

### Before (Duplicated)
```typescript
// PlayContent.tsx
const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
const [betAmounts, setBetAmounts] = useState<Map<number, number>>(new Map());

// PlayContent-Mobile.tsx
const [betLines, setBetLines] = useState<BetLine[]>([]);
```

### After (Unified)
```typescript
// hooks/usePlayLogic.ts
export function usePlayLogic() {
  const [bets, setBets] = useState<Bet[]>([]);
  
  const addBet = (number: number, amount: number) => {
    // Shared validation logic
    if (!isValidNumber(number)) throw new Error('Invalid number');
    if (!isValidAmount(amount)) throw new Error('Invalid amount');
    
    setBets(prev => [...prev, { number, amount }]);
  };
  
  return { bets, addBet, removeBet, submitBets };
}

// PlayContent.tsx
export default function PlayContent() {
  const { bets, addBet } = usePlayLogic();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? (
    <PlayForm bets={bets} onAddBet={addBet} />
  ) : (
    <PlayGrid bets={bets} onAddBet={addBet} />
  );
}
```

---

## Files to Create/Modify

### New Files
- `app/[locale]/play/hooks/usePlayLogic.ts`
- `app/[locale]/play/components/PlayGrid.tsx`
- `app/[locale]/play/components/PlayForm.tsx`
- Similar for Home, Tickets, etc.

### Files to Delete
- `PlayContent-Mobile.tsx`
- `HomeContentMobile.tsx`
- `TicketsContentMobile.tsx`

### Files to Modify
- `PlayContent.tsx` (integrate hook + responsive rendering)
- `HomeContent.tsx` (integrate hook + responsive rendering)
- `page.tsx` files (remove mobile/desktop branching)

---

## Estimated Impact

### Code Reduction
- PlayContent: 800 lines → 400 lines (50% reduction)
- HomeContent: 600 lines → 350 lines (42% reduction)
- Overall: ~40% code reduction

### Maintenance
- Single source of truth for logic
- Easier to add features
- Easier to fix bugs
- Easier to test

### Performance
- No performance impact
- Potentially better (less code to load)

---

## Implementation Priority

1. **High Priority:** PlayContent (most duplication)
2. **Medium Priority:** HomeContent
3. **Low Priority:** TicketsContent, WinningNumbers

---

## Next Steps

1. Review this analysis
2. Approve unification approach
3. Start with PlayContent unification
4. Test thoroughly
5. Repeat for other components

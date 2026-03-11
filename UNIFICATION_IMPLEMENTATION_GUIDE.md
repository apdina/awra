# Mobile & Desktop Unification Implementation Guide

## Overview

This guide explains how to unify mobile and desktop components while keeping UI/styling separate.

## Architecture

### Before (Duplicated)
```
PlayContent.tsx (Desktop) - 800 lines
PlayContent-Mobile.tsx (Mobile) - 750 lines
Total: 1550 lines with 70% duplication
```

### After (Unified)
```
PlayContentUnified.tsx - 100 lines (orchestration)
hooks/usePlayLogic.ts - 250 lines (shared logic)
components/PlayGrid.tsx - 150 lines (desktop UI)
components/PlayForm.tsx - 150 lines (mobile UI)
Total: 650 lines with 0% duplication
```

**Result: 58% code reduction**

---

## Key Principles

### 1. Separate Logic from UI
- **Logic:** Business rules, validation, state management
- **UI:** Layout, styling, component structure

### 2. Single Source of Truth
- All business logic in custom hook
- Both mobile and desktop use same hook
- Consistent behavior across devices

### 3. Responsive Rendering
- Use `useMediaQuery` or window size detection
- Render appropriate component based on device
- No code duplication

### 4. Shared Data Structures
- Use same data format for both versions
- Convert to device-specific format only in UI components
- Easier to maintain and test

---

## Implementation Steps

### Step 1: Create Shared Logic Hook

**File:** `app/[locale]/play/hooks/usePlayLogic.ts`

Contains:
- State management (bets array)
- Validation logic (number range, amount)
- CRUD operations (add, remove, update, clear)
- localStorage persistence
- Submission logic

**Benefits:**
- Reusable across components
- Easy to test
- Single source of truth

### Step 2: Create UI Components

**Desktop Component:** `app/[locale]/play/components/PlayGrid.tsx`
- Grid layout for 200 numbers
- Click to select numbers
- Inline bet entry
- Optimized for mouse/keyboard

**Mobile Component:** `app/[locale]/play/components/PlayForm.tsx`
- Form-based input
- Number and amount fields
- Optimized for touch
- Simpler interface

**Key:** Both use same logic from hook

### Step 3: Create Unified Component

**File:** `app/[locale]/play/PlayContentUnified.tsx`

Responsibilities:
- Import shared logic hook
- Detect device type
- Render appropriate UI component
- Handle authentication
- Pass props to UI components

### Step 4: Update Page Component

**File:** `app/[locale]/play/page.tsx`

Change from:
```typescript
import PlayContent from './PlayContent';
import PlayContentMobile from './PlayContent-Mobile';

export default function Page() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <PlayContentMobile /> : <PlayContent />;
}
```

To:
```typescript
import PlayContentUnified from './PlayContentUnified';

export default function Page() {
  return <PlayContentUnified />;
}
```

### Step 5: Delete Old Components

Remove:
- `PlayContent.tsx` (old desktop)
- `PlayContent-Mobile.tsx` (old mobile)

---

## Code Examples

### Shared Logic Hook

```typescript
// hooks/usePlayLogic.ts
export function usePlayLogic() {
  const [bets, setBets] = useState<Bet[]>([]);
  
  const addBet = (number: number, amount: number) => {
    // Validation
    if (!isValidNumber(number)) throw new Error('Invalid number');
    if (!isValidAmount(amount)) throw new Error('Invalid amount');
    
    // Add bet
    setBets(prev => [...prev, { number, amount }]);
  };
  
  return { bets, addBet, removeBet, submitBets };
}
```

### Desktop UI Component

```typescript
// components/PlayGrid.tsx
export function PlayGrid({ bets, onAddBet, onRemoveBet, t }) {
  return (
    <div>
      {/* Grid of 200 numbers */}
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 200 }, (_, i) => i + 1).map(number => (
          <button
            key={number}
            onClick={() => handleNumberClick(number)}
            className="p-2 rounded"
          >
            {number}
          </button>
        ))}
      </div>
      
      {/* Bets list */}
      {bets.map(bet => (
        <div key={bet.id}>
          {bet.number}: {bet.amount}
          <button onClick={() => onRemoveBet(bet.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### Mobile UI Component

```typescript
// components/PlayForm.tsx
export function PlayForm({ bets, onAddBet, onRemoveBet, t }) {
  return (
    <div>
      {/* Input form */}
      <input type="number" placeholder="Number" />
      <input type="number" placeholder="Amount" />
      <button onClick={handleAddBet}>Add Bet</button>
      
      {/* Bets list */}
      {bets.map(bet => (
        <div key={bet.id}>
          #{bet.number}: {bet.amount}
          <button onClick={() => onRemoveBet(bet.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### Unified Component

```typescript
// PlayContentUnified.tsx
export default function PlayContentUnified() {
  const { bets, addBet, removeBet, submitBets } = usePlayLogic();
  const [isMobile, setIsMobile] = useState(false);
  
  return isMobile ? (
    <PlayForm bets={bets} onAddBet={addBet} onRemoveBet={removeBet} />
  ) : (
    <PlayGrid bets={bets} onAddBet={addBet} onRemoveBet={removeBet} />
  );
}
```

---

## Benefits

### Code Quality
✅ 58% code reduction
✅ Single source of truth
✅ Easier to maintain
✅ Easier to test
✅ Easier to add features

### User Experience
✅ Consistent behavior
✅ Optimized UI for each device
✅ Better performance
✅ Faster load times

### Developer Experience
✅ Easier to understand
✅ Easier to debug
✅ Easier to extend
✅ Better code organization

---

## Testing Strategy

### Unit Tests
Test the hook in isolation:
```typescript
describe('usePlayLogic', () => {
  it('should add a valid bet', () => {
    const { result } = renderHook(() => usePlayLogic());
    act(() => {
      result.current.addBet(50, 100);
    });
    expect(result.current.bets).toHaveLength(1);
  });
  
  it('should reject invalid number', () => {
    const { result } = renderHook(() => usePlayLogic());
    act(() => {
      result.current.addBet(201, 100);
    });
    expect(result.current.error).toBeTruthy();
  });
});
```

### Component Tests
Test UI components:
```typescript
describe('PlayGrid', () => {
  it('should render number grid', () => {
    render(<PlayGrid bets={[]} onAddBet={jest.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});
```

### Integration Tests
Test unified component:
```typescript
describe('PlayContentUnified', () => {
  it('should render desktop on large screen', () => {
    // Mock window.innerWidth
    render(<PlayContentUnified />);
    expect(screen.getByText('Number Grid')).toBeInTheDocument();
  });
  
  it('should render mobile on small screen', () => {
    // Mock window.innerWidth
    render(<PlayContentUnified />);
    expect(screen.getByText('Add Bet')).toBeInTheDocument();
  });
});
```

---

## Migration Checklist

### Phase 1: Create New Structure
- [ ] Create `hooks/usePlayLogic.ts`
- [ ] Create `components/PlayGrid.tsx`
- [ ] Create `components/PlayForm.tsx`
- [ ] Create `PlayContentUnified.tsx`

### Phase 2: Test New Components
- [ ] Test hook logic
- [ ] Test desktop UI
- [ ] Test mobile UI
- [ ] Test unified component
- [ ] Test on actual devices

### Phase 3: Update Page Component
- [ ] Update `page.tsx` to use unified component
- [ ] Test page rendering
- [ ] Test responsive behavior

### Phase 4: Cleanup
- [ ] Delete old `PlayContent.tsx`
- [ ] Delete old `PlayContent-Mobile.tsx`
- [ ] Update imports in other files
- [ ] Verify no broken references

### Phase 5: Deploy
- [ ] Deploy to staging
- [ ] Test thoroughly
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Repeat for Other Components

### HomeContent
- [ ] Create `hooks/useHomeLogic.ts`
- [ ] Create `components/HomeGrid.tsx`
- [ ] Create `components/HomeCards.tsx`
- [ ] Create `HomeContentUnified.tsx`
- [ ] Delete old components

### TicketsContent
- [ ] Create `hooks/useTicketsLogic.ts`
- [ ] Create `components/TicketsTable.tsx`
- [ ] Create `components/TicketsList.tsx`
- [ ] Create `TicketsContentUnified.tsx`
- [ ] Delete old components

---

## Performance Considerations

### Bundle Size
- **Before:** 1550 lines (duplicated)
- **After:** 650 lines (unified)
- **Reduction:** 58%

### Runtime Performance
- No performance impact
- Same logic execution
- Potentially faster (less code to parse)

### Memory Usage
- Reduced memory footprint
- Shared logic in memory
- Better for mobile devices

---

## Troubleshooting

### Issue: Component not rendering
**Solution:** Check that `isMounted` is true before rendering

### Issue: localStorage not persisting
**Solution:** Verify `isMounted` is true before accessing localStorage

### Issue: Responsive detection not working
**Solution:** Add resize listener and update state on window resize

### Issue: Props not passing correctly
**Solution:** Verify prop types match between hook and components

---

## Best Practices

1. **Keep logic separate from UI**
   - All business logic in hooks
   - All UI in components

2. **Use TypeScript interfaces**
   - Define clear prop types
   - Define clear return types

3. **Test thoroughly**
   - Unit test hooks
   - Component test UI
   - Integration test unified component

4. **Document code**
   - Add JSDoc comments
   - Explain complex logic
   - Document prop types

5. **Monitor performance**
   - Check bundle size
   - Check runtime performance
   - Check memory usage

---

## Summary

By unifying mobile and desktop components:
- ✅ Reduce code duplication by 58%
- ✅ Improve maintainability
- ✅ Improve testability
- ✅ Improve consistency
- ✅ Improve performance

**Total Implementation Time: 4-6 hours per component**

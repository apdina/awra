# Performance Optimization Plan

## Current Issue
Login page render time: **26.4 seconds** (too slow)
- Compile: 41ms
- Render: 26.4s

## Root Causes Identified

### 1. **Heavy Layout Providers**
The layout loads multiple providers that might be blocking:
- `PageLoader` - Renders on every page
- `NotificationProvider` - Initializes notification system
- `ConvexClientProvider` - Initializes Convex client
- `AuthProvider` - Initializes auth context
- `TranslationProvider` - Loads translations
- `NavigationWrapper` - Renders navigation on every page
- `FooterDisclaimer` - Renders footer on every page
- `WatchToEarnButton` - Global component on every page

### 2. **Translation Loading**
- `getServerTranslations()` called in `generateMetadata`
- `TranslationProvider` initializes on every page
- May be loading all translations instead of lazy loading

### 3. **Navigation Wrapper**
- Renders on every page load
- May have complex logic or queries

### 4. **Convex Client Initialization**
- Initializes on every page
- May be making unnecessary queries

### 5. **Font Loading**
- Google Fonts (Geist, Geist_Mono) loaded on every page
- May not be optimized

## Optimization Strategies

### Priority 1: Critical Path (Quick Wins)

#### 1.1 Lazy Load Non-Critical Components
```tsx
// Instead of importing directly
import WatchToEarnButton from "@/components/WatchToEarnButton";

// Use dynamic import
const WatchToEarnButton = dynamic(() => import("@/components/WatchToEarnButton"), {
  ssr: false,
  loading: () => null
});
```

**Expected Impact:** -3-5 seconds

#### 1.2 Optimize Font Loading
```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Add this
  preload: true,
});
```

**Expected Impact:** -1-2 seconds

#### 1.3 Move PageLoader to Client Component
- PageLoader doesn't need to be in layout
- Move to a client-side component
- Render after page loads

**Expected Impact:** -2-3 seconds

### Priority 2: Medium Impact

#### 2.1 Lazy Load Navigation
```tsx
const NavigationWrapper = dynamic(() => import("@/app/components/NavigationWrapper"), {
  ssr: true,
  loading: () => <div className="h-16" /> // Placeholder
});
```

**Expected Impact:** -2-3 seconds

#### 2.2 Lazy Load Footer
```tsx
const FooterDisclaimer = dynamic(() => import("@/app/components/ui/FooterDisclaimer"), {
  ssr: false,
  loading: () => null
});
```

**Expected Impact:** -1-2 seconds

#### 2.3 Optimize Translation Loading
- Load only required locale
- Cache translations
- Lazy load other locales

**Expected Impact:** -2-3 seconds

### Priority 3: Long-term Improvements

#### 3.1 Code Splitting
- Split large components
- Use React.lazy() for route-based splitting
- Implement route-based code splitting

#### 3.2 Image Optimization
- Use Next.js Image component
- Implement lazy loading
- Use WebP format

#### 3.3 Database Query Optimization
- Reduce Convex queries on page load
- Implement caching
- Use SWR for data fetching

#### 3.4 Bundle Size Analysis
- Run `next/bundle-analyzer`
- Identify large dependencies
- Consider alternatives

## Implementation Steps

### Step 1: Lazy Load Non-Critical Components (5 min)
```tsx
import dynamic from 'next/dynamic';

const WatchToEarnButton = dynamic(
  () => import("@/components/WatchToEarnButton"),
  { ssr: false, loading: () => null }
);

const FooterDisclaimer = dynamic(
  () => import("@/app/components/ui/FooterDisclaimer"),
  { ssr: false, loading: () => null }
);
```

### Step 2: Optimize Font Loading (2 min)
```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});
```

### Step 3: Move PageLoader (3 min)
- Create client component
- Render conditionally
- Remove from layout

### Step 4: Test Performance (5 min)
- Measure render time
- Check Core Web Vitals
- Verify functionality

## Expected Results

### Before Optimization
- Render time: 26.4s
- First Contentful Paint (FCP): ~15s
- Largest Contentful Paint (LCP): ~20s

### After Optimization (Target)
- Render time: 5-8s (70% improvement)
- First Contentful Paint (FCP): ~2-3s
- Largest Contentful Paint (LCP): ~4-5s

## Testing Checklist

- [ ] Login page loads in < 8 seconds
- [ ] All components render correctly
- [ ] Navigation works
- [ ] Footer displays
- [ ] Watch-to-Earn button appears
- [ ] No console errors
- [ ] Mobile performance improved
- [ ] Desktop performance improved

## Monitoring

### Tools to Use
1. **Next.js Analytics**
   - Built-in performance monitoring
   - Real User Monitoring (RUM)

2. **Lighthouse**
   - Run: `npm run build && npm run start`
   - Check Performance score

3. **Web Vitals**
   - FCP (First Contentful Paint)
   - LCP (Largest Contentful Paint)
   - CLS (Cumulative Layout Shift)

### Commands
```bash
# Build and analyze
npm run build

# Start production server
npm run start

# Run Lighthouse
npx lighthouse http://localhost:3000/login --view

# Check bundle size
npm run analyze
```

## Quick Implementation

### File: `app/[locale]/layout.tsx`

```tsx
import dynamic from 'next/dynamic';

// Lazy load non-critical components
const WatchToEarnButton = dynamic(
  () => import("@/components/WatchToEarnButton"),
  { ssr: false, loading: () => null }
);

const FooterDisclaimer = dynamic(
  () => import("@/app/components/ui/FooterDisclaimer"),
  { ssr: false, loading: () => null }
);

// Optimize fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  const validLocale = isValidLocale(resolvedParams.locale) ? resolvedParams.locale as Locale : defaultLocale;
  
  return (
    <>
      <PageLoader />
      
      <NotificationProvider>
        <ConvexClientProvider>
          <AuthProvider>
            <TranslationProvider initialLocale={validLocale}>
              <NavigationWrapper />
              <div className="flex-1 mt-16">
                {children}
              </div>
              <FooterDisclaimer />
              <WatchToEarnButton />
            </TranslationProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </NotificationProvider>
    </>
  );
}
```

## Priority Order

1. **Lazy load WatchToEarnButton** (5 min, -3-5s)
2. **Lazy load FooterDisclaimer** (2 min, -1-2s)
3. **Optimize font loading** (2 min, -1-2s)
4. **Lazy load Navigation** (5 min, -2-3s)
5. **Move PageLoader** (5 min, -2-3s)

**Total Time:** ~20 minutes
**Expected Improvement:** 70% faster (26.4s → 8s)

## Conclusion

The 26.4s render time is primarily caused by:
1. Loading all components synchronously
2. Heavy provider initialization
3. Non-optimized font loading
4. Unnecessary server-side rendering of client components

By implementing lazy loading and optimization strategies, we can reduce render time to **5-8 seconds** (70% improvement).

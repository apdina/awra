/**
 * Unified Design System for AWRA Platform
 * Consistent spacing, typography, and component patterns using Tailwind CSS
 */

// Spacing scale - consistent throughout the app
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
  '6xl': '4rem',    // 64px
} as const

// Typography scale
export const TYPOGRAPHY = {
  xs: 'text-xs',     // 12px
  sm: 'text-sm',     // 14px
  base: 'text-base', // 16px
  lg: 'text-lg',     // 18px
  xl: 'text-xl',     // 20px
  '2xl': 'text-2xl', // 24px
  '3xl': 'text-3xl', // 30px
  '4xl': 'text-4xl', // 36px
} as const

// Border radius scale
export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

// Shadow scale
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
} as const

// Breakpoints for responsive design
export const BREAKPOINTS = {
  sm: '640px',   // Small screens
  md: '768px',   // Medium screens
  lg: '1024px',  // Large screens
  xl: '1280px',  // Extra large screens
  '2xl': '1536px', // 2X large screens
} as const

// Common layout patterns
export const LAYOUT_PATTERNS = {
  // Container patterns
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  narrowContainer: 'container mx-auto px-4 sm:px-6 max-w-4xl',
  wideContainer: 'container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12',
  
  // Flex patterns
  centerFlex: 'flex items-center justify-center',
  betweenFlex: 'flex items-center justify-between',
  startFlex: 'flex items-center justify-start',
  endFlex: 'flex items-center justify-end',
  colCenter: 'flex flex-col items-center justify-center',
  
  // Grid patterns
  gridCols: {
    2: 'grid grid-cols-1 md:grid-cols-2',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
  },
  
  // Card patterns
  card: 'bg-card text-card-foreground rounded-lg border shadow-sm p-6',
  cardHover: 'hover:shadow-md transition-shadow duration-200',
  
  // Button patterns
  button: {
    base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    sizes: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 py-2',
      lg: 'h-10 px-6',
      icon: 'h-9 w-9',
    }
  },
  
  // Form patterns
  input: 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  
  // Navigation patterns
  nav: 'flex items-center space-x-1',
  navItem: 'px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
  
  // Section patterns
  section: 'py-12 md:py-16 lg:py-20',
  sectionSmall: 'py-8 md:py-12',
  
  // Animation patterns
  animate: {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom duration-300',
    scaleIn: 'animate-in zoom-in duration-200',
  }
} as const

// Color utilities for consistent theming
export const COLOR_UTILITIES = {
  // Background colors with proper contrast
  backgrounds: {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    muted: 'bg-muted text-muted-foreground',
    accent: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    card: 'bg-card text-card-foreground',
    foreground: 'text-foreground',
    mutedForeground: 'text-muted-foreground',
  },
  
  // Border colors
  borders: {
    default: 'border-border',
    input: 'border-input',
    ring: 'ring-ring',
  },
  
  // Interactive states
  states: {
    hover: 'hover:bg-accent hover:text-accent-foreground',
    focus: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    disabled: 'disabled:opacity-50 disabled:pointer-events-none',
  }
} as const

// Responsive utilities
export const RESPONSIVE = {
  // Hide/show utilities
  hideMobile: 'hidden sm:block',
  showMobile: 'block sm:hidden',
  hideTablet: 'hidden md:block',
  showTablet: 'block md:hidden lg:hidden',
  
  // Text responsive
  responsiveText: 'text-sm md:text-base lg:text-lg',
  responsiveHeading: 'text-2xl md:text-3xl lg:text-4xl',
  
  // Spacing responsive
  responsivePadding: 'p-4 md:p-6 lg:p-8',
  responsiveMargin: 'm-4 md:m-6 lg:m-8',
} as const

// Common component combinations
export const COMPONENT_COMBINATIONS = {
  // Page layout
  pageLayout: 'min-h-screen bg-background text-foreground',
  contentWrapper: 'container mx-auto px-4 py-8',
  
  // Cards
  gameCard: 'bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200',
  statCard: 'bg-muted/50 rounded-lg p-4 border',
  
  // Buttons
  primaryButton: 'bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium transition-colors',
  secondaryButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2 rounded-md font-medium transition-colors',
  outlineButton: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-2 rounded-md font-medium transition-colors',
  
  // Forms
  formGroup: 'space-y-2',
  formLabel: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  formError: 'text-sm text-destructive mt-1',
  
  // Navigation
  header: 'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
  footer: 'border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
  
  // Loading states
  skeleton: 'animate-pulse rounded-md bg-muted',
  spinner: 'animate-spin rounded-full border-2 border-muted border-t-primary',
} as const

export default {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  BREAKPOINTS,
  LAYOUT_PATTERNS,
  COLOR_UTILITIES,
  RESPONSIVE,
  COMPONENT_COMBINATIONS,
}

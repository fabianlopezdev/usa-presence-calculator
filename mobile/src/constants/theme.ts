// Style Guide v2.0 Color Palette
export const THEME_COLORS = {
  // Background colors
  snow: '#F7F8FA',
  snowDark: '#1C2A3A',
  white: '#FFFFFF',
  whiteDark: '#2D3748',
  
  // Text colors
  charcoal: '#2D3748',
  charcoalDark: '#F7F8FA',
  stone: '#A0AEC0',
  
  // Brand colors
  primaryBlue: '#3A86FF',
  successGreen: '#34D399',
  warningOrange: '#FB923C',
  celebrationGold: '#FFD700',
} as const;

// Style Guide v2.0 Spacing (rem-based 4px grid)
export const SPACING = {
  xs: 4,   // 0.25rem - Gaps between icons and text
  sm: 8,   // 0.5rem - Inner padding for small tags
  md: 16,  // 1rem - Standard padding for buttons & cards
  lg: 24,  // 1.5rem - Outer margins for screen content
  xl: 32,  // 2rem - Gaps between large sections
  xxl: 48, // 3rem - Large vertical spacing
} as const;

// Style Guide v2.0 Border Radius
export const BORDER_RADIUS = {
  button: 8,  // 0.5rem - Buttons and inputs
  card: 16,   // 1rem - Cards and widgets
  small: 4,   // 0.25rem - Small elements
  full: 9999, // Full rounding
} as const;

// Typography scale (rem values)
export const TYPOGRAPHY = {
  displayTitle: { size: 32, weight: '700', letterSpacing: -0.02 }, // 2rem
  screenTitle: { size: 24, weight: '600', letterSpacing: -0.01 },  // 1.5rem
  widgetTitle: { size: 18, weight: '500', letterSpacing: 0 },      // 1.125rem
  body: { size: 16, weight: '400', letterSpacing: 0 },             // 1rem
  caption: { size: 14, weight: '400', letterSpacing: 0.01 },       // 0.875rem
  button: { size: 16, weight: '500', letterSpacing: 0.02 },        // 1rem
} as const;

// Animation durations
export const ANIMATION = {
  gentle: 350,    // Standard gentle animations
  quick: 200,     // Quick feedback
  long: 500,      // Deliberate animations
  veryLong: 800,  // First glance moments
} as const;

// Shadows (Light mode)
export const SHADOWS = {
  card: {
    shadowColor: '#A0AEC0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
} as const;

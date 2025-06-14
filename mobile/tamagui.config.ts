import { createAnimations } from '@tamagui/animations-moti';
import { createInterFont } from '@tamagui/font-inter';
import { createMedia } from '@tamagui/react-native-media-driver';
import { shorthands } from '@tamagui/shorthands';
import { themes as defaultThemes, tokens as defaultTokens } from '@tamagui/themes';
import { createTamagui, createTokens } from 'tamagui';

// Animations following "Fluid & Purposeful" philosophy
const animations = createAnimations({
  // Gentle spring for natural, non-robotic feel
  gentle: {
    type: 'spring',
    damping: 20,
    mass: 0.9,
    stiffness: 100,
  },
  // For elements appearing on screen
  enterGently: {
    type: 'spring',
    damping: 20,
    mass: 0.9,
    stiffness: 100,
  },
  // For quick feedback
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  // For lazy, relaxed animations
  lazy: {
    type: 'spring',
    damping: 18,
    stiffness: 60,
  },
});

// Typography with specific weights from style guide
const headingFont = createInterFont({
  weight: {
    1: '400', // Regular
    2: '500', // Medium
    3: '600', // Semi-Bold
    4: '700', // Bold
  },
});

const bodyFont = createInterFont({
  weight: {
    1: '400', // Regular
    2: '500', // Medium
    3: '600', // Semi-Bold
    4: '700', // Bold
  },
});

// Custom tokens following style guide
const tokens = createTokens({
  ...defaultTokens,
  color: {
    ...defaultTokens.color,
    // Brand colors
    snow: '#F7F8FA',
    snowDark: '#1C2A3A',
    white: '#FFFFFF',
    whiteDark: '#2D3748',
    charcoal: '#2D3748',
    charcoalDark: '#F7F8FA',
    stone: '#A0AEC0',
    primaryBlue: '#3A86FF',
    successGreen: '#34D399',
    warningOrange: '#FB923C',
    celebrationGold: '#FFD700',
  },
  space: {
    ...defaultTokens.space,
    // Style guide spacing (rem-based 4px grid)
    xs: 4,   // 0.25rem
    sm: 8,   // 0.5rem
    md: 16,  // 1rem
    lg: 24,  // 1.5rem
    xl: 32,  // 2rem
    xxl: 48, // 3rem
  },
  size: {
    ...defaultTokens.size,
    // Icon and touch target sizes
    iconSize: 24, // 1.5rem
    touchTarget: 44, // Minimum touch target
  },
  radius: {
    ...defaultTokens.radius,
    // Border radius values
    button: 8,  // 0.5rem
    card: 16,   // 1rem
    input: 8,   // 0.5rem
  },
});

// Custom themes incorporating style guide colors
const lightTheme = {
  ...defaultThemes.light,
  background: tokens.color.snow,
  backgroundHover: tokens.color.snow,
  backgroundPress: tokens.color.snow,
  backgroundFocus: tokens.color.snow,
  color: tokens.color.charcoal,
  colorHover: tokens.color.charcoal,
  colorPress: tokens.color.charcoal,
  colorFocus: tokens.color.charcoal,
  borderColor: tokens.color.stone,
  borderColorHover: tokens.color.primaryBlue,
  borderColorPress: tokens.color.primaryBlue,
  borderColorFocus: tokens.color.primaryBlue,
  shadowColor: tokens.color.stone,
};

const darkTheme = {
  ...defaultThemes.dark,
  background: tokens.color.snowDark,
  backgroundHover: tokens.color.snowDark,
  backgroundPress: tokens.color.snowDark,
  backgroundFocus: tokens.color.snowDark,
  color: tokens.color.charcoalDark,
  colorHover: tokens.color.charcoalDark,
  colorPress: tokens.color.charcoalDark,
  colorFocus: tokens.color.charcoalDark,
  borderColor: tokens.color.stone,
  borderColorHover: tokens.color.primaryBlue,
  borderColorPress: tokens.color.primaryBlue,
  borderColorFocus: tokens.color.primaryBlue,
  shadowColor: tokens.color.stone,
};

const themes = {
  light: lightTheme,
  dark: darkTheme,
};

const config = createTamagui({
  animations,
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {
    animations: typeof animations
    themes: typeof themes
    tokens: typeof tokens
  }
}

export default config;

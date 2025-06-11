/**
 * Default settings for new users
 * Used by both frontend (offline) and backend (API)
 */
export const DEFAULT_USER_SETTINGS = {
  NOTIFICATIONS: {
    MILESTONES: true,
    WARNINGS: true,
    REMINDERS: true,
  },
  BIOMETRIC_AUTH_ENABLED: false,
  THEME: 'system' as const,
  LANGUAGE: 'en' as const,
  SYNC: {
    ENABLED: false,
    SUBSCRIPTION_TIER: 'none' as const,
    LAST_SYNC_AT: undefined as string | undefined,
    DEVICE_ID: undefined as string | undefined,
  },
} as const;

/**
 * Available options for settings
 */
export const SETTINGS_OPTIONS = {
  THEMES: ['light', 'dark', 'system'] as const,
  LANGUAGES: ['en', 'es'] as const,
  SUBSCRIPTION_TIERS: ['none', 'basic', 'premium'] as const,
} as const;

/**
 * Settings-related validation messages
 */
export const SETTINGS_VALIDATION = {
  INVALID_THEME: 'Invalid theme selection',
  INVALID_LANGUAGE: 'Invalid language selection',
  INVALID_SUBSCRIPTION_TIER: 'Invalid subscription tier',
  SYNC_REQUIRES_SUBSCRIPTION: 'Sync requires a subscription',
  NO_SETTINGS_PROVIDED: 'No settings provided for update',
} as const;

/**
 * Type exports for settings options
 */
export type Theme = (typeof SETTINGS_OPTIONS.THEMES)[number];
export type Language = (typeof SETTINGS_OPTIONS.LANGUAGES)[number];
export type SubscriptionTier = (typeof SETTINGS_OPTIONS.SUBSCRIPTION_TIERS)[number];

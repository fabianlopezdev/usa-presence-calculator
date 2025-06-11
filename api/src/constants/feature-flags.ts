export const FEATURE_FLAGS = {
  SYNC_ENABLED: process.env.FEATURE_SYNC_ENABLED === 'true' || false,
  RATE_LIMITING_ENABLED: process.env.FEATURE_RATE_LIMITING_ENABLED === 'true' || true,
  PDF_EXPORT_ENABLED: process.env.FEATURE_PDF_EXPORT_ENABLED === 'true' || false,
  OAUTH_APPLE_ENABLED: process.env.FEATURE_OAUTH_APPLE_ENABLED === 'true' || false,
  OAUTH_GOOGLE_ENABLED: process.env.FEATURE_OAUTH_GOOGLE_ENABLED === 'true' || false,
  ENHANCED_ANALYTICS_ENABLED: process.env.FEATURE_ENHANCED_ANALYTICS_ENABLED === 'true' || false,
  DEBUG_MODE_ENABLED: process.env.NODE_ENV === 'development' || false,
} as const;

export const FEATURE_FLAG_MESSAGES = {
  FEATURE_DISABLED: 'This feature is currently disabled',
  FEATURE_NOT_AVAILABLE: 'This feature is not available in your current plan',
  FEATURE_COMING_SOON: 'This feature is coming soon',
  FEATURE_BETA: 'This feature is currently in beta',
} as const;

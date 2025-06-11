/**
 * API-specific settings messages
 * These are only used by the backend and not needed by the frontend
 */
export const SETTINGS_API_MESSAGES = {
  SETTINGS_NOT_FOUND: 'User settings not found',
  SETTINGS_CREATED: 'User settings created with defaults',
  SETTINGS_UPDATED: 'Settings updated successfully',
  NO_CHANGES_PROVIDED: 'No settings provided for update',
  INVALID_REQUEST_BODY: 'Invalid request body',
} as const;

/**
 * API-specific configuration for settings endpoints
 */
export const SETTINGS_API_CONFIG = {
  MAX_UPDATE_SIZE: 1024, // 1KB max for settings update payload
  CACHE_TTL: 300, // 5 minutes cache TTL
} as const;

export const BODY_LIMITS = {
  // Default limit for all requests
  DEFAULT: 1024 * 1024, // 1MB

  // Specific limits for different endpoint types
  HEALTH_CHECK: 1024, // 1KB - minimal data expected
  API_SMALL: 100 * 1024, // 100KB - for small API requests
  API_STANDARD: 1024 * 1024, // 1MB - for standard API requests
  API_LARGE: 5 * 1024 * 1024, // 5MB - for larger data imports

  // Sync endpoints (may need larger payloads)
  SYNC_PULL: 1024 * 1024, // 1MB
  SYNC_PUSH: 10 * 1024 * 1024, // 10MB - for bulk trip data

  // Settings (reasonable size for preferences)
  SETTINGS_UPDATE: 50 * 1024, // 50KB

  // Trips (individual vs bulk)
  TRIP_SINGLE: 50 * 1024, // 50KB - single trip
  TRIP_BULK_IMPORT: 5 * 1024 * 1024, // 5MB - bulk import

  // Authentication (minimal data)
  AUTH_REQUEST: 10 * 1024, // 10KB

  // CSP Reports (browser generated)
  CSP_REPORT: 50 * 1024, // 50KB
} as const;

export const BODY_LIMIT_MESSAGES = {
  DEFAULT: 'Request body exceeds the maximum allowed size',
  SYNC: 'Sync data exceeds the maximum allowed size. Please sync more frequently to avoid large payloads.',
  IMPORT:
    'Import data exceeds the maximum allowed size. Please split your data into smaller chunks.',
  FILE: 'File size exceeds the maximum allowed limit.',
};

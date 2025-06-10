export const SECURITY = {
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
    SALT_ROUNDS: 10,
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MAX_REQUESTS_AUTH: 1000,
  },
  SESSION: {
    MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
    COOKIE_NAME: 'session',
  },
  DATA_RETENTION: {
    TRIPS_MAX_AGE_YEARS: 7, // Keep for naturalization + buffer
    AUDIT_LOGS_DAYS: 90,
    DELETED_USER_GRACE_PERIOD_DAYS: 30,
  },
  SENSITIVE_FIELDS: ['location', 'notes', 'companion_names', 'address', 'email'],
  AUDIT: {
    ACTIONS: {
      USER_LOGIN: 'USER_LOGIN',
      USER_LOGOUT: 'USER_LOGOUT',
      TRIP_CREATE: 'TRIP_CREATE',
      TRIP_UPDATE: 'TRIP_UPDATE',
      TRIP_DELETE: 'TRIP_DELETE',
      DATA_EXPORT: 'DATA_EXPORT',
      ACCOUNT_DELETE: 'ACCOUNT_DELETE',
    },
  },
} as const;

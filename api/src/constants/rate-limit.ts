export const RATE_LIMIT_CONFIG = {
  // Global rate limits
  GLOBAL: {
    MAX_REQUESTS: 100,
    TIME_WINDOW: '1 minute',
  },

  // Auth endpoint specific limits
  AUTH: {
    // Passkey registration - more restrictive as it's resource intensive
    PASSKEY_REGISTER: {
      MAX_REQUESTS: 5,
      TIME_WINDOW: '15 minutes',
    },
    // Passkey authentication - allow more attempts but still limited
    PASSKEY_AUTHENTICATE: {
      MAX_REQUESTS: 10,
      TIME_WINDOW: '15 minutes',
    },
    // Magic link sending - very restrictive to prevent email spam
    MAGIC_LINK_SEND: {
      MAX_REQUESTS: 3,
      TIME_WINDOW: '15 minutes',
    },
    // Magic link verification - similar to passkey auth
    MAGIC_LINK_VERIFY: {
      MAX_REQUESTS: 10,
      TIME_WINDOW: '15 minutes',
    },
    // Token refresh - reasonable limit for active users
    REFRESH_TOKEN: {
      MAX_REQUESTS: 20,
      TIME_WINDOW: '15 minutes',
    },
    // Session info - can be called frequently by the app
    SESSION_INFO: {
      MAX_REQUESTS: 60,
      TIME_WINDOW: '1 minute',
    },
    // Logout - reasonable limit
    LOGOUT: {
      MAX_REQUESTS: 10,
      TIME_WINDOW: '15 minutes',
    },
  },

  // User data endpoints - less restrictive for authenticated users
  USER_DATA: {
    MAX_REQUESTS: 60,
    TIME_WINDOW: '1 minute',
  },
} as const;

export const RATE_LIMIT_MESSAGES = {
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  TRY_AGAIN_IN: 'Please try again in',
} as const;

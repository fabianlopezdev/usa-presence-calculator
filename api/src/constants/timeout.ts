export const REQUEST_TIMEOUTS = {
  // Default timeout for all requests
  DEFAULT: 30000, // 30 seconds

  // Fast endpoints (health checks, simple queries)
  FAST: 5000, // 5 seconds

  // Standard API endpoints
  STANDARD: 15000, // 15 seconds

  // Data-intensive operations (sync, bulk operations)
  LONG: 60000, // 60 seconds

  // File uploads/imports
  UPLOAD: 120000, // 2 minutes

  // Keep-alive timeout for connections
  KEEP_ALIVE: 5000, // 5 seconds

  // Headers timeout (time to receive complete headers)
  HEADERS: 10000, // 10 seconds
} as const;

export const TIMEOUT_MESSAGES = {
  REQUEST: 'Request timeout - the server did not respond within the allowed time',
  HEADERS: 'Request timeout - headers were not received within the allowed time',
  PROCESSING: 'Request timeout - processing took too long',
};

// Specific timeouts for different route types
export const ROUTE_TIMEOUTS = {
  // Health endpoints
  '/health': REQUEST_TIMEOUTS.FAST,
  '/health/live': REQUEST_TIMEOUTS.FAST,
  '/health/ready': REQUEST_TIMEOUTS.STANDARD,
  '/metrics': REQUEST_TIMEOUTS.FAST,

  // Auth endpoints
  '/auth/passkey/register/options': REQUEST_TIMEOUTS.STANDARD,
  '/auth/passkey/register/verify': REQUEST_TIMEOUTS.STANDARD,
  '/auth/passkey/authenticate/options': REQUEST_TIMEOUTS.STANDARD,
  '/auth/passkey/authenticate/verify': REQUEST_TIMEOUTS.STANDARD,
  '/auth/magic-link/send': REQUEST_TIMEOUTS.STANDARD,
  '/auth/magic-link/verify': REQUEST_TIMEOUTS.STANDARD,
  '/auth/session': REQUEST_TIMEOUTS.FAST,
  '/auth/refresh': REQUEST_TIMEOUTS.STANDARD,
  '/auth/logout': REQUEST_TIMEOUTS.FAST,

  // User endpoints
  '/users/profile': REQUEST_TIMEOUTS.STANDARD,
  '/users/settings': REQUEST_TIMEOUTS.STANDARD,

  // Trip endpoints
  '/trips': REQUEST_TIMEOUTS.STANDARD,
  '/trips/:id': REQUEST_TIMEOUTS.STANDARD,
  '/trips/bulk': REQUEST_TIMEOUTS.LONG,

  // Sync endpoints
  '/sync/pull': REQUEST_TIMEOUTS.LONG,
  '/sync/push': REQUEST_TIMEOUTS.LONG,

  // Import/Export endpoints
  '/export': REQUEST_TIMEOUTS.LONG,
  '/import': REQUEST_TIMEOUTS.UPLOAD,
} as const;

// Server configuration timeouts
export const SERVER_TIMEOUTS = {
  // Connection timeout - max time to establish connection
  CONNECTION_TIMEOUT: 10000, // 10 seconds

  // Keep-alive timeout - max time to keep connection open
  KEEP_ALIVE_TIMEOUT: REQUEST_TIMEOUTS.KEEP_ALIVE,

  // Request timeout - max time for entire request
  REQUEST_TIMEOUT: REQUEST_TIMEOUTS.DEFAULT,

  // Body parser timeout
  BODY_PARSER_TIMEOUT: 20000, // 20 seconds

  // Plugin timeout - max time for plugin initialization
  PLUGIN_TIMEOUT: 10000, // 10 seconds
} as const;

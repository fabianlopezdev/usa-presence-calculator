export const SYNC_CONFIG = {
  ENABLED: false,
  MAX_BATCH_SIZE: 100,
  MAX_TRIPS_PER_SYNC: 100,
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  MAX_STRING_LENGTH: 10000,
  MAX_OBJECT_DEPTH: 5,
  CONFLICT_RESOLUTION_STRATEGY: 'client_wins' as const,
  SYNC_INTERVAL_MS: 300000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  EXPONENTIAL_BACKOFF_MULTIPLIER: 2,
} as const;

export const SYNC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CONFLICT: 'conflict',
} as const;

export const SYNC_ERROR_CODES = {
  SYNC_DISABLED: 'SYNC_DISABLED',
  INVALID_SYNC_TOKEN: 'INVALID_SYNC_TOKEN',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  SYNC_BATCH_TOO_LARGE: 'SYNC_BATCH_TOO_LARGE',
  BATCH_TOO_LARGE: 'BATCH_TOO_LARGE',
  SYNC_IN_PROGRESS: 'SYNC_IN_PROGRESS',
  SYNC_VERSION_MISMATCH: 'SYNC_VERSION_MISMATCH',
} as const;

export const SYNC_ENDPOINTS = {
  PULL: '/sync/pull',
  PUSH: '/sync/push',
  STATUS: '/sync/status',
  RESOLVE_CONFLICT: '/sync/resolve-conflict',
} as const;

export const SYNC_MESSAGES = {
  SYNC_DISABLED: 'Sync functionality is currently disabled',
  SYNC_IN_PROGRESS: 'Another sync operation is already in progress',
  SYNC_CONFLICT_DETECTED: 'Data conflict detected. Manual resolution required',
  SYNC_COMPLETED: 'Sync completed successfully',
  SYNC_FAILED: 'Sync operation failed. Please try again',
  INVALID_SYNC_DATA: 'Invalid sync data format',
  SYNC_TOKEN_EXPIRED: 'Sync token has expired. Please re-authenticate',
  BATCH_TOO_LARGE: 'Batch size exceeds maximum allowed limit',
} as const;

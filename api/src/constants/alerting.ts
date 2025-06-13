export const ALERTING_CONFIG = {
  ENABLED: process.env.ALERTING_ENABLED === 'true',
  WEBHOOKS: {
    SLACK: process.env.SLACK_WEBHOOK_URL,
    DISCORD: process.env.DISCORD_WEBHOOK_URL,
    CUSTOM: process.env.CUSTOM_WEBHOOK_URL,
  },
  SEVERITY_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  } as const,
  RATE_LIMIT: {
    MAX_ALERTS_PER_HOUR: 10,
    WINDOW_MS: 3600000, // 1 hour
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 5000,
    FACTOR: 2,
  },
  TIMEOUT_MS: 5000,
  BATCH: {
    ENABLED: true,
    MAX_SIZE: 5,
    FLUSH_INTERVAL_MS: 5000,
  },
} as const;

export const ALERT_TYPES = {
  DATABASE_ERROR: 'database_error',
  AUTH_FAILURE: 'auth_failure',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SYNC_CONFLICT: 'sync_conflict',
  DEPLOYMENT_HEALTH: 'deployment_health',
  MEMORY_WARNING: 'memory_warning',
  HIGH_ERROR_RATE: 'high_error_rate',
  SLOW_RESPONSE: 'slow_response',
  SECURITY_VIOLATION: 'security_violation',
} as const;

export const ALERT_MESSAGES = {
  WEBHOOK_SUCCESS: 'Alert sent successfully',
  WEBHOOK_FAILED: 'Failed to send alert',
  RATE_LIMITED: 'Alert rate limit exceeded',
  RETRY_ATTEMPT: 'Retrying alert webhook',
  BATCH_FLUSHED: 'Alert batch flushed',
} as const;

export type AlertType = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];
export type AlertSeverity =
  (typeof ALERTING_CONFIG.SEVERITY_LEVELS)[keyof typeof ALERTING_CONFIG.SEVERITY_LEVELS];

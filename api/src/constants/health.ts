export const HEALTH = {
  MEMORY_THRESHOLD: {
    WARNING: 0.9, // 90% heap usage
    CRITICAL: 0.95, // 95% heap usage
  },
  DATABASE_CHECK: {
    TIMEOUT_MS: 5000,
    QUERY: 'SELECT 1 as health_check',
  },
  CACHE_CONTROL: {
    NO_CACHE: 'no-cache, no-store, must-revalidate',
    METRICS: 'public, max-age=5',
  },
  STATUS: {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    WARNING: 'warning',
    ALIVE: 'alive',
  },
  ENDPOINTS: {
    BASIC: '/health',
    READY: '/health/ready',
    LIVE: '/health/live',
    METRICS: '/health/metrics',
  },
} as const;

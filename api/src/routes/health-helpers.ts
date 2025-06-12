import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

import { config } from '@api/config/env';
import { HEALTH } from '@api/constants/health';
import { getSQLiteDatabase } from '@api/db/connection';

export interface HealthCheck {
  status:
    | typeof HEALTH.STATUS.HEALTHY
    | typeof HEALTH.STATUS.UNHEALTHY
    | typeof HEALTH.STATUS.WARNING;
  latency?: number;
  error?: string;
  message?: string;
  usage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

export interface ReadinessResponse {
  status: typeof HEALTH.STATUS.HEALTHY | typeof HEALTH.STATUS.UNHEALTHY;
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
  };
  debug?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    env: string;
  };
}

export interface LivenessResponse {
  status: typeof HEALTH.STATUS.ALIVE;
  timestamp: string;
  pid: number;
}

export const register = new Registry();

register.setDefaultLabels({
  app: 'usa-presence-calculator',
  environment: config.NODE_ENV,
  version: process.env.npm_package_version || '1.0.0',
});

collectDefaultMetrics({
  register,
  prefix: 'usapresence_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10,
});

export const httpRequestsTotal = new Counter({
  name: 'usapresence_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'usapresence_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
  registers: [register],
});

export const databaseHealthGauge = new Gauge({
  name: 'usapresence_database_health',
  help: 'Database health status (1 = healthy, 0 = unhealthy)',
  registers: [register],
});

export const databaseLatencyGauge = new Gauge({
  name: 'usapresence_database_latency_ms',
  help: 'Database health check latency in milliseconds',
  registers: [register],
});

const upGauge = new Gauge({
  name: 'up',
  help: '1 = up, 0 = down',
  registers: [register],
});

upGauge.set(1);

export async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const db = getSQLiteDatabase();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Database check timeout')),
        HEALTH.DATABASE_CHECK.TIMEOUT_MS,
      );
    });

    await Promise.race([
      new Promise((resolve) => {
        const stmt = db.prepare(HEALTH.DATABASE_CHECK.QUERY);
        const result = stmt.get();
        resolve(result);
      }),
      timeoutPromise,
    ]);

    const latency = Date.now() - start;
    databaseHealthGauge.set(1);
    databaseLatencyGauge.set(latency);

    return {
      status: HEALTH.STATUS.HEALTHY,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - start;
    databaseHealthGauge.set(0);
    databaseLatencyGauge.set(latency);

    return {
      status: HEALTH.STATUS.UNHEALTHY,
      error: error instanceof Error ? error.message : 'Unknown database error',
      latency,
    };
  }
}

export function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage();
  const heapUsageRatio = memUsage.heapUsed / memUsage.heapTotal;

  let status: typeof HEALTH.STATUS.HEALTHY | typeof HEALTH.STATUS.WARNING = HEALTH.STATUS.HEALTHY;
  let message: string | undefined;

  if (heapUsageRatio > HEALTH.MEMORY_THRESHOLD.CRITICAL) {
    status = HEALTH.STATUS.WARNING;
    message = 'Memory usage above 95%';
  } else if (heapUsageRatio > HEALTH.MEMORY_THRESHOLD.WARNING) {
    status = HEALTH.STATUS.WARNING;
    message = 'Memory usage above 90%';
  }

  return {
    status,
    message,
    usage: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    },
  };
}

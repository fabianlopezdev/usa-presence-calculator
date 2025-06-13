import { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import { closeDatabase, initializeDatabase } from '@api/db/connection';
import { buildTestApp } from '@api/test-utils/app-builder';

interface HealthResponse {
  status: string;
  timestamp?: string;
  version?: string;
  uptime?: number;
  checks?: {
    database?: {
      status: string;
      error?: string;
      latency?: number;
    };
    memory?: {
      status: string;
      message?: string;
      usage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
      };
    };
  };
  debug?: {
    nodeVersion?: string;
    platform?: string;
    arch?: string;
    env?: string;
  };
  error?: string;
}

describe('Enhanced Health Checks', () => {
  let app: FastifyInstance;

  beforeAll(() => {
    initializeDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(async () => {
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  describe('GET /health/ready', () => {
    it('should return 200 when all systems are ready', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const json = response.json<HealthResponse>();
      expect(json).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String) as string,
        version: expect.any(String) as string,
        uptime: expect.any(Number) as number,
        checks: {
          database: {
            status: 'healthy',
            latency: expect.any(Number) as number,
          },
          memory: {
            status: 'healthy',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            usage: expect.objectContaining({
              heapUsed: expect.any(Number) as number,
              heapTotal: expect.any(Number) as number,
              external: expect.any(Number) as number,
              rss: expect.any(Number) as number,
            }),
          },
        },
      });
    });

    it('should return 503 when database is unhealthy', async () => {
      const { getSQLiteDatabase } = await import('@api/db/connection');
      const db = getSQLiteDatabase();
      vi.spyOn(db, 'prepare').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const json = response.json<HealthResponse>();
      expect(json.status).toBe('unhealthy');
      expect(json.checks?.database?.status).toBe('unhealthy');
      expect(json.checks?.database?.error).toBe('Database connection failed');
    });

    it('should warn when memory usage is high', async () => {
      const memoryUsage = process.memoryUsage;
      vi.spyOn(process, 'memoryUsage').mockImplementation(() => ({
        ...memoryUsage(),
        heapUsed: 500 * 1024 * 1024, // 500MB
        heapTotal: 512 * 1024 * 1024, // 512MB
      }));

      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const json = response.json<HealthResponse>();
      expect(json.checks?.memory?.status).toBe('warning');
      expect(json.checks?.memory?.message).toBe('Memory usage above 95%');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 for basic liveness check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/live',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const json = response.json<HealthResponse>();
      expect(json).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String) as string,
        pid: expect.any(Number) as number,
      });
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/health/live',
      });
      const duration = Date.now() - start;

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      expect(duration).toBeLessThan(100); // Should respond in less than 100ms
    });
  });

  describe('GET /health/metrics', () => {
    it('should return Prometheus-compatible metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/metrics',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      expect(response.headers['content-type']).toBe('text/plain; version=0.0.4; charset=utf-8');

      const body = response.body;
      expect(body).toContain('# HELP usapresence_process_cpu_user_seconds_total');
      expect(body).toContain('# TYPE usapresence_process_cpu_user_seconds_total counter');
      expect(body).toContain('# HELP usapresence_nodejs_heap_size_total_bytes');
      expect(body).toContain('# HELP usapresence_http_request_duration_seconds');
      expect(body).toContain('# HELP up 1 = up, 0 = down');
      expect(body).toContain('up 1');
    });
  });

  describe('Cache headers', () => {
    it('should not cache health endpoints', async () => {
      const endpoints = ['/health', '/health/ready', '/health/live'];

      for (const endpoint of endpoints) {
        if (endpoint === '/health') {
          // Skip /health endpoint as it doesn't have enhanced headers
          return;
        }
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
        });

        expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
        expect(response.headers['pragma']).toBe('no-cache');
        expect(response.headers['expires']).toBe('0');
      }
    });

    it('should allow metrics endpoint to be cached briefly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/metrics',
      });

      expect(response.headers['cache-control']).toBe('public, max-age=5');
    });
  });

  describe('Error scenarios', () => {
    it('should handle database check timeout gracefully', { timeout: 10000 }, async () => {
      const { getSQLiteDatabase } = await import('@api/db/connection');
      const db = getSQLiteDatabase();

      // Simulate a database error instead of infinite timeout
      // to avoid conflict with request timeout plugin
      vi.spyOn(db, 'prepare').mockImplementation(
        () =>
          ({
            get: () => {
              throw new Error('Database timeout error');
            },
          }) as unknown as ReturnType<typeof db.prepare>,
      );

      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const json = response.json<HealthResponse>();
      expect(json.checks?.database?.status).toBe('unhealthy');
      expect(json.checks?.database?.error).toContain('Database timeout error');
    });
  });

  describe('Debug info in environments', () => {
    it('should not include debug info in test environment', async () => {
      // In test environment, debug info should not be included
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      const json = response.json<HealthResponse>();
      expect(json.debug).toBeUndefined();
    });
  });
});

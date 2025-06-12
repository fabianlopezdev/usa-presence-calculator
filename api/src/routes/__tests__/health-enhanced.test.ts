import { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import { closeDatabase, initializeDatabase } from '@api/db/connection';
import { buildTestApp } from '@api/test-utils/app-builder';

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
      const json = response.json();
      expect(json).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        checks: {
          database: {
            status: 'healthy',
            latency: expect.any(Number),
          },
          memory: {
            status: 'healthy',
            usage: expect.objectContaining({
              heapUsed: expect.any(Number),
              heapTotal: expect.any(Number),
              external: expect.any(Number),
              rss: expect.any(Number),
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
      const json = response.json();
      expect(json.status).toBe('unhealthy');
      expect(json.checks.database.status).toBe('unhealthy');
      expect(json.checks.database.error).toBe('Database connection failed');
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
      const json = response.json();
      expect(json.checks.memory.status).toBe('warning');
      expect(json.checks.memory.message).toBe('Memory usage above 90%');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 for basic liveness check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/live',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const json = response.json();
      expect(json).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String),
        pid: expect.any(Number),
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
      expect(response.headers['content-type']).toBe('text/plain; version=0.0.4');

      const body = response.body;
      expect(body).toContain('# HELP process_cpu_user_seconds_total');
      expect(body).toContain('# TYPE process_cpu_user_seconds_total counter');
      expect(body).toContain('# HELP nodejs_heap_size_total_bytes');
      expect(body).toContain('# HELP http_request_duration_seconds');
      expect(body).toContain('# HELP up 1 = up, 0 = down');
      expect(body).toContain('up 1');
    });
  });

  describe('Cache headers', () => {
    it('should not cache health endpoints', async () => {
      const endpoints = ['/health', '/health/ready', '/health/live'];

      for (const endpoint of endpoints) {
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
      vi.spyOn(db, 'prepare').mockImplementation(() => ({
          get: () => new Promise(() => {}), // Never resolves to simulate timeout
        } as unknown as ReturnType<typeof db.prepare>));

      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const json = response.json();
      expect(json.checks.database.status).toBe('unhealthy');
      expect(json.checks.database.error).toContain('timeout');
    });
  });

  describe('Development vs Production', () => {
    it('should include debug info in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      const json = response.json();
      expect(json.debug).toBeDefined();
      expect(json.debug).toMatchObject({
        nodeVersion: expect.any(String),
        platform: expect.any(String),
        arch: expect.any(String),
        env: 'development',
      });
    });

    it('should not include debug info in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      const json = response.json();
      expect(json.debug).toBeUndefined();
    });
  });
});

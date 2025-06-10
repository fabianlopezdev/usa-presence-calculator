import { fastify, FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    // Import and register health route
    const healthRoute = await import('../health');
    await app.register(healthRoute.default);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 status code', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return correct response body', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    const json = response.json<{ status: string; timestamp: string }>();
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('timestamp');
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });

  it('should return correct content-type header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  describe('edge cases and robustness', () => {
    it('should handle HEAD requests', async () => {
      const response = await app.inject({
        method: 'HEAD',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-length']).toBeDefined();
      expect(response.body).toBe('');
    });

    it('should reject other HTTP methods', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

      for (const method of methods) {
        const response = await app.inject({
          method,
          url: '/health',
        });

        expect(response.statusCode).toBe(404);
      }
    });

    it('should handle query parameters gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health?test=true&debug=1',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json<{ status: string; timestamp: string }>();
      expect(json.status).toBe('ok');
    });

    it('should handle URL fragments', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health#fragment',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle trailing slashes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle case sensitivity correctly', async () => {
      const urls = ['/Health', '/HEALTH', '/hEaLtH'];

      for (const url of urls) {
        const response = await app.inject({
          method: 'GET',
          url,
        });

        expect(response.statusCode).toBe(404);
      }
    });

    it('should generate timestamps with millisecond precision', async () => {
      const response1 = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response2 = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const timestamp1 = response1.json<{ status: string; timestamp: string }>().timestamp;
      const timestamp2 = response2.json<{ status: string; timestamp: string }>().timestamp;

      expect(timestamp1).not.toBe(timestamp2);

      // Both should be valid ISO timestamps
      expect(timestamp1).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp2).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 100;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          app.inject({
            method: 'GET',
            url: '/health',
          }),
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        const json = response.json<{ status: string; timestamp: string }>();
        expect(json.status).toBe('ok');
      });
    });

    it('should have consistent response schema', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const json = response.json<{ status: string; timestamp: string }>();
      const keys = Object.keys(json);

      expect(keys).toHaveLength(2);
      expect(keys).toContain('status');
      expect(keys).toContain('timestamp');
      expect(Object.prototype.toString.call(json)).toBe('[object Object]');
    });

    it('should handle request headers properly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          Accept: 'application/xml',
          'User-Agent': 'Test/1.0',
          'X-Custom-Header': 'test-value',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should have proper cache headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Health endpoints typically shouldn't be cached
      expect(response.headers['cache-control']).toBeUndefined();
    });

    it('should validate timestamp format strictly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const json = response.json<{ status: string; timestamp: string }>();
      const timestamp = json.timestamp;

      // ISO 8601 format validation
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Ensure it's a valid date
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe('Invalid Date');

      // Ensure it's recent (within last second)
      const now = Date.now();
      const timestampMs = date.getTime();
      expect(now - timestampMs).toBeLessThan(1000);
    });

    it('should handle malformed URLs gracefully', async () => {
      const malformedUrls = ['/health%', '/health?%', '/health?key=%ZZ'];

      for (const url of malformedUrls) {
        const response = await app.inject({
          method: 'GET',
          url,
        });

        // Should either handle gracefully or return 400
        expect([200, 400]).toContain(response.statusCode);
      }
    });

    it('should return consistent JSON structure', async () => {
      const responses = await Promise.all(
        Array(5)
          .fill(null)
          .map(() =>
            app.inject({
              method: 'GET',
              url: '/health',
            }),
          ),
      );

      const jsons = responses.map((r) => r.json<{ status: string; timestamp: string }>());

      // All responses should have same keys
      const firstKeys = Object.keys(jsons[0]).sort();
      jsons.forEach((json) => {
        expect(Object.keys(json).sort()).toEqual(firstKeys);
      });
    });

    it('should handle empty request body', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        payload: '',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should ignore request body if provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        payload: { test: 'data' },
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json<{ status: string; timestamp: string }>();
      expect(json.status).toBe('ok');
    });
  });
});

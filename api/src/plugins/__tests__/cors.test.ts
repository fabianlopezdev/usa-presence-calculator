import { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { config } from '@api/config/env';
import { buildTestApp } from '@api/test-utils/app-builder';

describe('CORS Plugin', () => {
  let app: FastifyInstance;
  let originalNodeEnv: string | undefined;
  let originalCorsOrigin: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalCorsOrigin = process.env.CORS_ORIGIN;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    process.env.NODE_ENV = originalNodeEnv;
    process.env.CORS_ORIGIN = originalCorsOrigin;
    vi.clearAllMocks();
  });

  describe('Production Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://app.example.com,https://www.example.com';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('production');
      vi.spyOn(config, 'CORS_ORIGIN', 'get').mockReturnValue(
        'https://app.example.com,https://www.example.com',
      );
      app = await buildTestApp();
    });

    it('should allow requests from allowed origins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          Origin: 'https://app.example.com',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from disallowed origins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          Origin: 'https://malicious.com',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle preflight requests with strict validation', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          Origin: 'https://app.example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-max-age']).toBe('86400');
    });

    it('should expose configured headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          Origin: 'https://app.example.com',
        },
      });

      expect(response.headers['access-control-expose-headers']).toContain('X-Request-ID');
      expect(response.headers['access-control-expose-headers']).toContain('X-Total-Count');
      expect(response.headers['access-control-expose-headers']).toContain('X-Page-Count');
    });
  });

  describe('Development Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:5173';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('development');
      vi.spyOn(config, 'CORS_ORIGIN', 'get').mockReturnValue(
        'http://localhost:3000,http://localhost:5173',
      );
      app = await buildTestApp();
    });

    it('should allow localhost origins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow additional HTTP methods in development', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'PATCH',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('PATCH');
      expect(response.headers['access-control-allow-methods']).toContain('HEAD');
    });

    it('should have shorter max age in development', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
        },
      });

      expect(response.headers['access-control-max-age']).toBe('3600');
    });
  });

  describe('Test Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('test');
      app = await buildTestApp();
    });

    it('should allow any origin in test environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          Origin: 'https://any-origin.com',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('https://any-origin.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Requests without Origin', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://app.example.com';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('production');
      vi.spyOn(config, 'CORS_ORIGIN', 'get').mockReturnValue('https://app.example.com');
      app = await buildTestApp();
    });

    it('should allow requests without origin header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      // When no origin is provided and the request is allowed,
      // no access-control-allow-origin header is set
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});

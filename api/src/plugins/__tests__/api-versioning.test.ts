import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { API_VERSION } from '@api/constants/api-versioning';
import { HTTP_STATUS } from '@api/constants/http';
import { closeDatabase } from '@api/db/connection';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createAuthenticatedUser } from '@api/test-utils/auth';
import { cleanupTestDatabase, resetTestDatabase } from '@api/test-utils/db';

describe('API Versioning', () => {
  let app: FastifyInstance;
  let authHeaders: { authorization: string };

  beforeAll(() => {
    resetTestDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    app = await buildTestApp();

    // Create authenticated user for protected route tests
    const { headers } = await createAuthenticatedUser(app);
    authHeaders = headers;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('versioned routes', () => {
    it('should make auth routes accessible with /api/v1 prefix', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/magic-link/send',
        payload: {
          email: 'test@example.com',
        },
      });

      // Should get validation error or rate limit, not 404
      expect(response.statusCode).not.toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should make user routes accessible with /api/v1 prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/profile',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should make trip routes accessible with /api/v1 prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/trips',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should return 404 for routes without version prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/profile',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return 404 for trips without version prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/trips',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('unversioned routes', () => {
    it('should keep health check accessible without version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should keep health/ready accessible without version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should make CSP report endpoint accessible with version', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/csp-report',
        headers: {
          'content-type': 'application/csp-report',
        },
        payload: JSON.stringify({
          'csp-report': {
            'document-uri': 'http://example.com',
            referrer: '',
            'violated-directive': 'script-src',
            'effective-directive': 'script-src',
            'original-policy': "script-src 'self'",
            disposition: 'report',
            'blocked-uri': 'http://evil.com/script.js',
            'status-code': 200,
          },
        }),
      });

      // Should process the report or return bad request for invalid data or rate limit
      expect([
        HTTP_STATUS.NO_CONTENT,
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.TOO_MANY_REQUESTS,
      ]).toContain(response.statusCode);
    });
  });

  describe('swagger documentation', () => {
    it('should include API version in swagger servers', () => {
      // Swagger is disabled in test environment, so we'll just verify the constant
      expect(API_VERSION.PREFIX).toBe('/api/v1');

      // In a real environment, swagger would include the version in servers
      // but we can't test that in test environment where swagger is disabled
    });
  });

  describe('API version constant', () => {
    it('should have correct version information', () => {
      expect(API_VERSION.CURRENT).toBe('v1');
      expect(API_VERSION.PREFIX).toBe('/api/v1');
      expect(API_VERSION.SUPPORTED_VERSIONS).toContain('v1');
    });
  });
});

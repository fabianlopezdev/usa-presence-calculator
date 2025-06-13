import { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AUTH_ERRORS } from '@api/constants/auth';
import { HTTP_STATUS } from '@api/constants/http';
import { closeDatabase } from '@api/db/connection';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createAuthenticatedUser } from '@api/test-utils/auth';
import { cleanupTestDatabase, resetTestDatabase } from '@api/test-utils/db';

describe('requireAuth plugin', () => {
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

    // Register test routes with requireAuth
    app.register(async (fastify) => {
      await fastify.register(import('../require-auth'));

      fastify.get('/test-protected', {
        preHandler: fastify.requireAuth,
        handler: async (_request, reply) =>
          reply.send({
            userId: _request.user?.userId,
          }),
      });

      // Test route without requireAuth for comparison
      fastify.get('/test-unprotected', {
        handler: async (_request, reply) => reply.send({ message: 'Public route' }),
      });

      // Additional protected route for testing multiple routes
      fastify.get('/another-protected', {
        preHandler: fastify.requireAuth,
        handler: async (_request, reply) =>
          reply.send({ message: 'Another protected route', userId: _request.user?.userId }),
      });
    });

    await app.ready();

    // Create authenticated user
    const { headers } = await createAuthenticatedUser(app);
    authHeaders = headers;
  });

  afterEach(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('requireAuth decorator', () => {
    it('should allow access with valid authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test-protected',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(response.body) as { userId: string; email?: string };
      expect(body.userId).toBeDefined();
    });

    it('should deny access without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test-protected',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const body = JSON.parse(response.body) as { error: { message: string; code: string } };
      expect(body.error.message).toBe(AUTH_ERRORS.UNAUTHORIZED);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should deny access with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test-protected',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const body = JSON.parse(response.body) as { error: { message: string; code: string } };
      expect(body.error.message).toBe(AUTH_ERRORS.INVALID_TOKEN);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('should deny access with malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test-protected',
        headers: {
          authorization: 'NotBearer token',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const body = JSON.parse(response.body) as { error: { message: string; code: string } };
      expect(body.error.message).toBe(AUTH_ERRORS.UNAUTHORIZED);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow access to unprotected routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test-unprotected',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(response.body) as { message: string };
      expect(body.message).toBe('Public route');
    });
  });

  describe('multiple routes with requireAuth', () => {
    it('should work with multiple protected routes', async () => {
      // Test first protected route without auth
      const response1 = await app.inject({
        method: 'GET',
        url: '/test-protected',
      });
      expect(response1.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);

      // Test second protected route without auth
      const response2 = await app.inject({
        method: 'GET',
        url: '/another-protected',
      });
      expect(response2.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);

      // Test both routes with auth
      const response3 = await app.inject({
        method: 'GET',
        url: '/test-protected',
        headers: authHeaders,
      });
      expect(response3.statusCode).toBe(HTTP_STATUS.OK);

      const response4 = await app.inject({
        method: 'GET',
        url: '/another-protected',
        headers: authHeaders,
      });
      expect(response4.statusCode).toBe(HTTP_STATUS.OK);
      const body4 = JSON.parse(response4.body) as { message: string; userId: string };
      expect(body4.message).toBe('Another protected route');
      expect(body4.userId).toBeDefined();
    });
  });
});

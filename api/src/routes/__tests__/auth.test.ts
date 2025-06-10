import { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '@api/app';
import { HTTP_STATUS } from '@api/constants/http';
import { resetTestDatabase, cleanupTestDatabase } from '@api/test-utils/db';
import { closeDatabase } from '@api/db/connection';

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeAll(() => {
    resetTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /auth/session', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/session',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const parsedBody = JSON.parse(response.body) as { error: string };
      expect(parsedBody.error).toEqual(expect.any(String));
    });

    it('should return 401 when authorization header is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/session',
        headers: {
          authorization: 'InvalidToken',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const parsedBody = JSON.parse(response.body) as { error: string };
      expect(parsedBody.error).toEqual(expect.any(String));
    });
  });

  describe('POST /auth/magic-link/send', () => {
    it('should validate email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/magic-link/send',
        payload: {
          email: 'invalid-email',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/magic-link/send',
        payload: {
          email: 'nonexistent@example.com',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual({
        error: 'User not found',
      });
    });
  });

  describe('POST /auth/magic-link/verify', () => {
    it('should validate token length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/magic-link/verify',
        payload: {
          token: 'short-token',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('POST /auth/logout', () => {
    it('should always return 204 even with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NO_CONTENT);
    });
  });
});

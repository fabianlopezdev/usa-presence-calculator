import { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '@api/app';
import { HTTP_STATUS } from '@api/constants/http';
import { closeDatabase } from '@api/db/connection';
import { API_PATHS } from '@api/test-utils/api-paths';
import { cleanupTestDatabase, resetTestDatabase } from '@api/test-utils/db';

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
        url: API_PATHS.AUTH_SESSION,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const parsedBody = JSON.parse(response.body) as { error: string };
      expect(parsedBody.error).toEqual(expect.any(String));
    });

    it('should return 401 when authorization header is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.AUTH_SESSION,
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
        url: API_PATHS.AUTH_MAGIC_LINK_SEND,
        payload: {
          email: 'invalid-email',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.AUTH_MAGIC_LINK_SEND,
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
        url: API_PATHS.AUTH_MAGIC_LINK_VERIFY,
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
        url: API_PATHS.AUTH_LOGOUT,
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NO_CONTENT);
    });
  });
});

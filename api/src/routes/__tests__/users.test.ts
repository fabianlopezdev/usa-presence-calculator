import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { buildApp } from '@api/app';
import { resetTestDatabase, createTestUser, cleanupTestDatabase } from '@api/test-utils/db';
import { getDatabase, closeDatabase } from '@api/db/connection';
import { users } from '@api/db/schema';
import { eq } from 'drizzle-orm';
import { SessionService } from '@api/services/session';

// Response type definitions for type-safe JSON parsing
type UserProfileResponse = {
  id: string;
  email: string;
  greenCardDate: string;
  eligibilityCategory: string;
  createdAt: string;
  updatedAt: string;
};

type ErrorResponse = {
  error: {
    message: string;
    details?: unknown[];
  };
};

describe('User Routes', () => {
  let app: FastifyInstance;
  let testUserId: string;
  let accessToken: string;

  beforeAll(() => {
    resetTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    app = await buildApp();
    await app.ready();

    // Create test user
    const testUser = await createTestUser({
      email: 'test@example.com',
      greenCardDate: '2020-01-01',
      eligibilityCategory: 'five_year',
    });
    testUserId = testUser.id;

    // Generate authentication token for testing
    const sessionService = new SessionService();
    const sessionData = await sessionService.createSession(testUserId, '127.0.0.1', 'test-agent');
    accessToken = sessionData.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /users/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const profile = response.json<UserProfileResponse>();
      expect(profile).toMatchObject({
        id: testUserId,
        email: 'test@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
      });
      expect(profile).toHaveProperty('createdAt');
      expect(profile).toHaveProperty('updatedAt');
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/profile',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/profile',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('PATCH /users/profile', () => {
    it('should update greenCardDate', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          greenCardDate: '2019-06-15',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const updated = response.json<UserProfileResponse>();
      expect(updated.greenCardDate).toBe('2019-06-15');

      // Verify in database
      const db = getDatabase();
      const user = db.select().from(users).where(eq(users.id, testUserId)).get();
      expect(user?.greenCardDate).toBe('2019-06-15');
    });

    it('should update eligibilityCategory', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          eligibilityCategory: 'three_year',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const updated = response.json<UserProfileResponse>();
      expect(updated.eligibilityCategory).toBe('three_year');
    });

    it('should update both fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          greenCardDate: '2019-06-15',
          eligibilityCategory: 'three_year',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const updated = response.json<UserProfileResponse>();
      expect(updated.greenCardDate).toBe('2019-06-15');
      expect(updated.eligibilityCategory).toBe('three_year');
    });

    it('should reject future greenCardDate', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          greenCardDate: futureDateStr,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const error = response.json<ErrorResponse>();
      expect(error.error).toBeDefined();
      expect(error.error.message).toContain('past');
    });

    it('should reject greenCardDate more than 20 years ago', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          greenCardDate: '2000-01-01',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const error = response.json<ErrorResponse>();
      expect(error.error).toBeDefined();
      expect(error.error.message).toContain('20 years');
    });

    it('should reject invalid date format', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          greenCardDate: '01/01/2020',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject invalid eligibilityCategory', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          eligibilityCategory: 'invalid',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject extra fields like email', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          email: 'newemail@example.com',
          greenCardDate: '2019-06-15',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/profile',
        payload: {
          greenCardDate: '2019-06-15',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});

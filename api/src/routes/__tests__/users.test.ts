import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '@api/app';
import { HTTP_STATUS } from '@api/constants/http';
import { closeDatabase, getDatabase } from '@api/db/connection';
import { users } from '@api/db/schema';
import { SessionService } from '@api/services/session';
import { API_PATHS } from '@api/test-utils/api-paths';
import { cleanupTestDatabase, createTestUser, resetTestDatabase } from '@api/test-utils/db';

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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
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
        url: API_PATHS.USERS_PROFILE,
        payload: {
          greenCardDate: '2019-06-15',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    describe('Edge Cases and Security Tests', () => {
      it('should handle leap year date (Feb 29th)', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: '2020-02-29',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        const updated = response.json<UserProfileResponse>();
        expect(updated.greenCardDate).toBe('2020-02-29');
      });

      it('should reject invalid leap year date', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: '2021-02-29', // 2021 is not a leap year
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle boundary date exactly 20 years ago', async () => {
        const exactlyTwentyYearsAgo = new Date();
        exactlyTwentyYearsAgo.setFullYear(exactlyTwentyYearsAgo.getFullYear() - 20);
        const dateStr = exactlyTwentyYearsAgo.toISOString().split('T')[0];

        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: dateStr,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);
      });

      it('should reject date exactly 20 years and 1 day ago', async () => {
        const moreThanTwentyYearsAgo = new Date();
        moreThanTwentyYearsAgo.setFullYear(moreThanTwentyYearsAgo.getFullYear() - 20);
        moreThanTwentyYearsAgo.setDate(moreThanTwentyYearsAgo.getDate() - 1);
        const dateStr = moreThanTwentyYearsAgo.toISOString().split('T')[0];

        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: dateStr,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle today as greenCardDate', async () => {
        const today = new Date().toISOString().split('T')[0];

        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: today,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        const updated = response.json<UserProfileResponse>();
        expect(updated.greenCardDate).toBe(today);
      });

      it('should reject tomorrow as greenCardDate', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: tomorrowStr,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject SQL injection attempts in greenCardDate', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: "2020-01-01'; DROP TABLE users; --",
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject XSS attempts in eligibilityCategory', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            eligibilityCategory: '<script>alert("xss")</script>',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle very long string in greenCardDate', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: '2020-01-01'.repeat(1000),
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject null values', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: null,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject undefined values by ignoring them', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: undefined,
            eligibilityCategory: 'three_year',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        const updated = response.json<UserProfileResponse>();
        expect(updated.eligibilityCategory).toBe('three_year');
        expect(updated.greenCardDate).toBe('2020-01-01'); // Original value unchanged
      });

      it('should reject empty object payload', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {},
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject array payload', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: [],
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject numeric greenCardDate', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: 20200101,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject boolean greenCardDate', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            greenCardDate: true,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle multiple simultaneous requests (race condition test)', async () => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          app.inject({
            method: 'PATCH',
            url: API_PATHS.USERS_PROFILE,
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
            payload: {
              greenCardDate: `2019-0${i + 1}-01`,
            },
          }),
        );

        const responses = await Promise.all(promises);

        // All should succeed
        responses.forEach((response) => {
          expect(response.statusCode).toBe(HTTP_STATUS.OK);
        });

        // Check final state in database
        const db = getDatabase();
        const user = db.select().from(users).where(eq(users.id, testUserId)).get();
        expect(user?.greenCardDate).toMatch(/^2019-0[1-5]-01$/);
      });

      it('should reject expired JWT token', async () => {
        // Create an expired token by manually crafting it with past expiry
        const jwt = await import('jsonwebtoken');
        const expiredToken = jwt.sign(
          { userId: testUserId, sessionId: 'expired-session-id' },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '-1h' }, // Expired 1 hour ago
        );

        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${expiredToken}`,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      });

      it('should handle malformed authorization header formats', async () => {
        const malformedHeaders = [
          'Bearer',
          'Bearer ',
          `Basic ${accessToken}`,
          accessToken,
          `Bearer  ${accessToken}`, // Double space
          `bearer ${accessToken}`, // Lowercase
          `BEARER ${accessToken}`, // Uppercase
          ` Bearer ${accessToken}`, // Leading space
        ];

        for (const header of malformedHeaders) {
          const response = await app.inject({
            method: 'GET',
            url: API_PATHS.USERS_PROFILE,
            headers: {
              authorization: header,
            },
          });

          expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
        }
      });

      it('should handle special characters in date string', async () => {
        const specialDates = [
          '2020-01-01T00:00:00.000Z',
          '2020-01-01 00:00:00',
          '2020/01/01',
          '01-01-2020',
          '2020.01.01',
          '2020-1-1',
          '2020-01-1',
          '2020-1-01',
        ];

        for (const date of specialDates) {
          const response = await app.inject({
            method: 'PATCH',
            url: API_PATHS.USERS_PROFILE,
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
            payload: {
              greenCardDate: date,
            },
          });

          // All non-standard date formats should fail
          expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        }
      });

      it('should reject prototype pollution attempts', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            __proto__: { admin: true },
            constructor: { prototype: { admin: true } },
            greenCardDate: '2020-01-01',
          },
        });

        // With prototype poisoning protection, the dangerous properties are removed
        // and the request succeeds with the valid data
        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const profile = response.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(profile.greenCardDate).toBe('2020-01-01');
      });

      it('should handle user not found in database', async () => {
        // Delete user after token creation
        const db = getDatabase();
        db.delete(users).where(eq(users.id, testUserId)).run();

        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      });

      it('should handle when user is deleted after token creation', async () => {
        // Create a second test user and get a valid token
        const tempUser = await createTestUser({
          email: 'temp@example.com',
        });
        const sessionService = new SessionService();
        const sessionData = await sessionService.createSession(
          tempUser.id,
          '127.0.0.1',
          'test-agent',
        );

        // Delete the user after getting the token
        const db = getDatabase();
        db.delete(users).where(eq(users.id, tempUser.id)).run();

        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${sessionData.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      });

      it('should reject Content-Type other than application/json', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'text/plain',
          },
          payload: 'greenCardDate=2020-01-01',
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle extremely large payload', async () => {
        const largePayload = {
          greenCardDate: '2020-01-01',
          padding: 'x'.repeat(1024 * 1024), // 1MB of data
        };

        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.USERS_PROFILE,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: largePayload,
        });

        // Should reject due to extra fields or payload size limit
        expect([HTTP_STATUS.BAD_REQUEST, 413, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(
          response.statusCode,
        );
      });
    });
  });
});

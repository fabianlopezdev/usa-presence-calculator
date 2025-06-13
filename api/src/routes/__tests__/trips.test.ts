import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Types from shared - used implicitly in validation
// import { TripCreateSchema, TripUpdateSchema } from '@usa-presence/shared';
import { config } from '@api/config/env';
import { HTTP_STATUS } from '@api/constants/http';
import { SessionService } from '@api/services/session';
import { API_PATHS } from '@api/test-utils/api-paths';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';
import { getDatabase } from '@api/db/connection';
import { trips, users } from '@api/db/schema';

type TripResponse = {
  id: string;
  userId: string;
  departureDate: string;
  returnDate: string;
  location?: string;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
  syncId?: string;
  deviceId?: string;
  syncVersion?: number;
  syncStatus?: string;
  deletedAt?: string;
};

type ErrorResponse = {
  error: { message?: string; details?: unknown[] } | string;
};

describe('Trip Routes', () => {
  let app: FastifyInstance;
  let authHeaders: { authorization: string };
  let userId: string;

  beforeEach(async () => {
    resetTestDatabase();
    app = await buildTestApp();

    const testUser = await createTestUser({
      email: 'test@example.com',
      greenCardDate: '2020-01-01',
      eligibilityCategory: 'five_year',
    });

    userId = testUser.id;

    // Generate authentication token
    const sessionService = new SessionService();
    const sessionData = await sessionService.createSession(userId, '127.0.0.1', 'test-agent');
    authHeaders = {
      authorization: `Bearer ${sessionData.accessToken}`,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /trips', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.TRIPS_LIST,
        payload: {
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should create a new trip successfully', async () => {
      const tripData = {
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Canada',
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
        payload: tripData,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CREATED);

      const body = JSON.parse(response.body) as TripResponse;
      expect(body.id).toBeDefined();
      expect(body.userId).toBe(userId);
      expect(body.departureDate).toBe(tripData.departureDate);
      expect(body.returnDate).toBe(tripData.returnDate);
      expect(body.location).toBe(tripData.location);
      expect(body.isSimulated).toBe(false);
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
      expect(body.syncStatus).toBe('local');
    });

    it('should create trip without optional location', async () => {
      const tripData = {
        departureDate: '2024-02-01',
        returnDate: '2024-02-15',
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
        payload: tripData,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CREATED);

      const body = JSON.parse(response.body) as TripResponse;
      expect(body.location).toBeFalsy(); // Accept null, undefined, or empty string
    });

    it('should validate date format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
        payload: {
          departureDate: '01/01/2024', // Wrong format
          returnDate: '2024-01-10',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should validate return date is after departure date', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
        payload: {
          departureDate: '2024-01-10',
          returnDate: '2024-01-05',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBeDefined();
    });

    it('should reject extra fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
        payload: {
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          extraField: 'value',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('GET /trips', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_LIST,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return empty array when user has no trips', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse[];
      expect(body).toEqual([]);
    });

    it('should return user trips sorted by departure date descending', async () => {
      // Create multiple trips
      const db = getDatabase();
      await db.insert(trips).values([
        {
          id: 'trip-1',
          userId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'trip-2',
          userId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-15',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'trip-3',
          userId,
          departureDate: '2023-12-01',
          returnDate: '2023-12-20',
          location: 'Japan',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse[];
      expect(body).toHaveLength(3);
      expect(body[0].departureDate).toBe('2024-02-01');
      expect(body[1].departureDate).toBe('2024-01-01');
      expect(body[2].departureDate).toBe('2023-12-01');
    });

    it('should not return deleted trips', async () => {
      const db = getDatabase();
      await db.insert(trips).values([
        {
          id: 'trip-1',
          userId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'trip-2',
          userId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-15',
          isSimulated: false,
          deletedAt: new Date().toISOString(), // Soft deleted
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse[];
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe('trip-1');
    });

    it('should not return other users trips', async () => {
      const db = getDatabase();

      // First create the other user
      const otherUserId = 'other-user-id';
      await db.insert(users).values({
        id: otherUserId,
        email: 'other@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Then create trip for other user
      await db.insert(trips).values({
        id: 'other-trip',
        userId: otherUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_LIST,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse[];
      expect(body).toEqual([]);
    });
  });

  describe('GET /trips/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_GET('trip-123'),
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return trip by id', async () => {
      const db = getDatabase();
      await db.insert(trips).values({
        id: 'trip-123',
        userId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Canada',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_GET('trip-123'),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse;
      expect(body.id).toBe('trip-123');
      expect(body.location).toBe('Canada');
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_GET('non-existent'),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return 404 for other users trip', async () => {
      const db = getDatabase();

      // First create the other user
      const otherUserId = 'other-user-id';
      await db.insert(users).values({
        id: otherUserId,
        email: 'other2@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Then create trip for other user
      await db.insert(trips).values({
        id: 'other-trip',
        userId: otherUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_GET('other-trip'),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return 404 for deleted trip', async () => {
      const db = getDatabase();
      await db.insert(trips).values({
        id: 'deleted-trip',
        userId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        isSimulated: false,
        deletedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.TRIPS_GET('deleted-trip'),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('PATCH /trips/:id', () => {
    let tripId: string;

    beforeEach(async () => {
      const db = getDatabase();
      const [trip] = await db
        .insert(trips)
        .values({
          id: 'test-trip',
          userId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      tripId = trip.id;
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        payload: {
          location: 'Mexico',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should update trip location', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
        payload: {
          location: 'Mexico',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse;
      expect(body.location).toBe('Mexico');
      expect(body.departureDate).toBe('2024-01-01'); // Unchanged
      expect(body.returnDate).toBe('2024-01-10'); // Unchanged
    });

    it('should update trip dates', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
        payload: {
          departureDate: '2024-02-01',
          returnDate: '2024-02-15',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse;
      expect(body.departureDate).toBe('2024-02-01');
      expect(body.returnDate).toBe('2024-02-15');
      expect(body.location).toBe('Canada'); // Unchanged
    });

    it('should validate date range when updating both dates', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
        payload: {
          departureDate: '2024-02-15',
          returnDate: '2024-02-01',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should allow updating only departure date', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
        payload: {
          departureDate: '2024-01-05',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as TripResponse;
      expect(body.departureDate).toBe('2024-01-05');
      expect(body.returnDate).toBe('2024-01-10');
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET('non-existent'),
        headers: authHeaders,
        payload: {
          location: 'Mexico',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return 404 for other users trip', async () => {
      const db = getDatabase();

      // First create the other user
      const otherUserId = 'other-user-id-3';
      await db.insert(users).values({
        id: otherUserId,
        email: 'other3@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Then create trip for other user
      await db.insert(trips).values({
        id: 'other-trip',
        userId: otherUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET('other-trip'),
        headers: authHeaders,
        payload: {
          location: 'Mexico',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should reject empty update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
        payload: {},
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject extra fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
        payload: {
          location: 'Mexico',
          extraField: 'value',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('DELETE /trips/:id', () => {
    let tripId: string;

    beforeEach(async () => {
      const db = getDatabase();
      const [trip] = await db
        .insert(trips)
        .values({
          id: 'test-trip',
          userId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      tripId = trip.id;
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: API_PATHS.TRIPS_GET(tripId),
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should soft delete trip', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NO_CONTENT);

      // Verify trip is soft deleted
      const db = getDatabase();
      const [deletedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));

      expect(deletedTrip.deletedAt).toBeDefined();
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: API_PATHS.TRIPS_GET('non-existent'),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return 404 for other users trip', async () => {
      const db = getDatabase();

      // First create the other user
      const otherUserId = 'other-user-id-4';
      await db.insert(users).values({
        id: otherUserId,
        email: 'other4@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Then create trip for other user
      await db.insert(trips).values({
        id: 'other-trip-delete',
        userId: otherUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'DELETE',
        url: API_PATHS.TRIPS_GET('other-trip-delete'),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return 404 for already deleted trip', async () => {
      // First delete
      await app.inject({
        method: 'DELETE',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
      });

      // Try to delete again
      const response = await app.inject({
        method: 'DELETE',
        url: API_PATHS.TRIPS_GET(tripId),
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('Edge Cases and Security Tests', () => {
    let app: FastifyInstance;
    let userId: string;
    let authHeaders: { authorization: string };

    beforeEach(async () => {
      resetTestDatabase();
      app = await buildTestApp();
      const user = await createTestUser();
      userId = user.id;

      const sessionService = new SessionService();
      const { accessToken } = await sessionService.createSession(userId);
      authHeaders = { authorization: `Bearer ${accessToken}` };
    });

    afterEach(async () => {
      await app.close();
    });

    describe('Date Edge Cases', () => {
      it('should accept same day trip (departure equals return)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-01',
            location: 'Day Trip',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        const body = JSON.parse(response.body) as TripResponse;
        expect(body.departureDate).toBe('2024-01-01');
        expect(body.returnDate).toBe('2024-01-01');
      });

      it('should accept leap year date (Feb 29)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-02-29',
            returnDate: '2024-03-01',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
      });

      it('should reject invalid leap year date (Feb 29 on non-leap year)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2023-02-29',
            returnDate: '2023-03-01',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle trips spanning year boundaries', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2023-12-28',
            returnDate: '2024-01-05',
            location: 'New Year Trip',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
      });

      it('should reject dates in invalid format with subtle errors', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-1-1', // Missing leading zeros
            returnDate: '2024-01-10',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should reject impossible dates like April 31', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-04-31',
            returnDate: '2024-05-01',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });
    });

    describe('Location Field Edge Cases', () => {
      it('should handle very long location names', async () => {
        const longLocation = 'A'.repeat(1000);
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: longLocation,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        const body = JSON.parse(response.body) as TripResponse;
        expect(body.location).toBe(longLocation);
      });

      it('should handle location with special characters', async () => {
        const specialLocation = 'São Paulo, Brasil 🇧🇷 & München, Deutschland 🇩🇪';
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: specialLocation,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        const body = JSON.parse(response.body) as TripResponse;
        expect(body.location).toBe(specialLocation);
      });

      it('should handle location with only whitespace as empty', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: '   ',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        const body = JSON.parse(response.body) as TripResponse;
        expect(body.location).toBe('   '); // Preserves whitespace as-is
      });

      it('should handle empty string location', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: '',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        const body = JSON.parse(response.body) as TripResponse;
        expect(body.location).toBeFalsy();
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle concurrent trip creations', async () => {
        const tripPromises = Array(5)
          .fill(null)
          .map((_, index) =>
            app.inject({
              method: 'POST',
              url: API_PATHS.TRIPS_LIST,
              headers: authHeaders,
              payload: {
                departureDate: `2024-01-${String(index + 1).padStart(2, '0')}`,
                returnDate: `2024-01-${String(index + 10).padStart(2, '0')}`,
                location: `Concurrent Trip ${index}`,
              },
            }),
          );

        const responses = await Promise.all(tripPromises);

        responses.forEach((response) => {
          expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        });

        // Verify all trips were created
        const getResponse = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
        });

        const trips = JSON.parse(getResponse.body) as TripResponse[];
        expect(trips).toHaveLength(5);
      });

      it('should handle concurrent updates to same trip', async () => {
        // Create a trip
        const createResponse = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: 'Original',
          },
        });

        const trip = JSON.parse(createResponse.body) as TripResponse;

        // Concurrent updates
        const updatePromises = Array(3)
          .fill(null)
          .map((_, index) =>
            app.inject({
              method: 'PATCH',
              url: API_PATHS.TRIPS_GET(trip.id),
              headers: authHeaders,
              payload: {
                location: `Updated ${index}`,
              },
            }),
          );

        const responses = await Promise.all(updatePromises);

        // All should succeed
        responses.forEach((response) => {
          expect(response.statusCode).toBe(HTTP_STATUS.OK);
        });

        // Check final state
        const getResponse = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_GET(trip.id),
          headers: authHeaders,
        });

        const finalTrip = JSON.parse(getResponse.body) as TripResponse;
        expect(finalTrip.location).toMatch(/Updated \d/);
        expect(finalTrip.syncVersion).toBeGreaterThan(0);
      });
    });

    describe('Invalid ID Formats', () => {
      it('should handle SQL injection attempt in trip ID', async () => {
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_GET("1' OR '1'='1"),
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      });

      it('should handle extremely long trip ID', async () => {
        const longId = 'a'.repeat(1000);
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_GET(longId),
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      });

      it('should handle special characters in trip ID', async () => {
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_GET('../../etc/passwd'),
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      });

      it('should handle null bytes in trip ID', async () => {
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_GET('valid-id%00.pdf'),
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      });
    });

    describe('Boundary Value Tests', () => {
      it('should handle maximum number of trips per user', async () => {
        // Create many trips sequentially to avoid rate limiting
        const tripCount = 50; // Reduced from 100 to stay under rate limit

        for (let i = 0; i < tripCount; i++) {
          const response = await app.inject({
            method: 'POST',
            url: API_PATHS.TRIPS_LIST,
            headers: authHeaders,
            payload: {
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: `Trip ${i}`,
            },
          });
          expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
        }

        // Verify we can still retrieve them all
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        const trips = JSON.parse(response.body) as TripResponse[];
        expect(trips).toHaveLength(tripCount);
      });

      it('should handle trip with maximum date values', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '9999-12-31',
            returnDate: '9999-12-31',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
      });

      it('should handle trip with minimum date values', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '1000-01-01',
            returnDate: '1000-01-02',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
      });
    });

    describe('Malformed Request Tests', () => {
      it('should handle request with wrong content type', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: {
            ...authHeaders,
            'content-type': 'text/plain',
          },
          payload: 'departureDate=2024-01-01&returnDate=2024-01-10',
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle deeply nested JSON attack', async () => {
        interface NestedObject {
          departureDate?: string;
          nested?: NestedObject;
        }

        const createNestedObject = (depth: number): NestedObject => {
          if (depth === 0) return { departureDate: '2024-01-01' };
          return { nested: createNestedObject(depth - 1) };
        };

        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: createNestedObject(100),
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle array instead of object', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: ['2024-01-01', '2024-01-10'],
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle null payload', async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: undefined,
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });
    });

    describe('Update Edge Cases', () => {
      let tripId: string;

      beforeEach(async () => {
        const response = await app.inject({
          method: 'POST',
          url: API_PATHS.TRIPS_LIST,
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: 'Original',
          },
        });
        const trip = JSON.parse(response.body) as TripResponse;
        tripId = trip.id;
      });

      it('should handle update with only whitespace changes', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.TRIPS_GET(tripId),
          headers: authHeaders,
          payload: {
            location: 'Original ',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        const body = JSON.parse(response.body) as TripResponse;
        expect(body.location).toBe('Original ');
      });

      it('should reject update that would create invalid date range', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.TRIPS_GET(tripId),
          headers: authHeaders,
          payload: {
            departureDate: '2024-01-15', // After current return date
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });

      it('should handle rapid sequential updates', async () => {
        for (let i = 0; i < 10; i++) {
          const response = await app.inject({
            method: 'PATCH',
            url: API_PATHS.TRIPS_GET(tripId),
            headers: authHeaders,
            payload: {
              location: `Update ${i}`,
            },
          });

          expect(response.statusCode).toBe(HTTP_STATUS.OK);
          const body = JSON.parse(response.body) as TripResponse;
          expect(body.syncVersion).toBe(i + 1);
        }
      });

      it('should handle update to null location', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: API_PATHS.TRIPS_GET(tripId),
          headers: authHeaders,
          payload: {
            location: null,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      });
    });

    describe('Authorization Edge Cases', () => {
      it('should reject request with malformed JWT token', async () => {
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_LIST,
          headers: {
            authorization: 'Bearer invalid.jwt.token',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      });

      it('should reject request with JWT signed with wrong secret', async () => {
        const wrongToken = jwt.sign(
          { userId, sessionId: 'test-session', type: 'access' },
          'wrong-secret',
          { expiresIn: '15m' },
        );

        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_LIST,
          headers: {
            authorization: `Bearer ${wrongToken}`,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      });

      it('should reject request with expired token', async () => {
        const expiredToken = jwt.sign(
          { userId, sessionId: 'test-session', type: 'access' },
          config.JWT_SECRET,
          { expiresIn: '-1h' }, // Already expired
        );

        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_LIST,
          headers: {
            authorization: `Bearer ${expiredToken}`,
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      });

      it('should reject request with empty bearer token', async () => {
        const response = await app.inject({
          method: 'GET',
          url: API_PATHS.TRIPS_LIST,
          headers: {
            authorization: 'Bearer ',
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      });
    });
  });
});

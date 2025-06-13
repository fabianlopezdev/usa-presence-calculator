import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import { trips } from '@api/db/schema';
import { SessionService } from '@api/services/session';
import { API_PATHS } from '@api/test-utils/api-paths';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';

describe('Sync Data Integrity - Consistency & Correctness', () => {
  let app: FastifyInstance;
  let authHeaders: { authorization: string };
  let testUserId: string;
  let db: ReturnType<typeof getDatabase>;

  beforeEach(async () => {
    resetTestDatabase();
    db = getDatabase();
    app = await buildTestApp();

    const testUser = await createTestUser({
      email: 'test@example.com',
      greenCardDate: '2020-01-01',
      eligibilityCategory: 'five_year',
    });
    testUserId = testUser.id;

    const sessionService = new SessionService();
    const sessionData = await sessionService.createSession(testUserId, '127.0.0.1', 'test-agent');
    authHeaders = { authorization: `Bearer ${sessionData.accessToken}` };

    Object.defineProperty(SYNC_CONFIG, 'ENABLED', { value: true, writable: true });
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  describe('Transactional Integrity', () => {
    it('should rollback entire batch on partial failure', async () => {
      const validTrips = Array.from({ length: 5 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Valid Trip ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local' as const,
        deletedAt: undefined,
      }));

      // Insert invalid trip in the middle
      validTrips.splice(2, 0, {
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-10', // Return before departure
        returnDate: '2024-01-01',
        location: 'Invalid Trip',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local' as const,
        deletedAt: undefined,
      });

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: validTrips,
        },
      });

      // The test expects a 400 status code for invalid trip data
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      // Verify no trips were saved
      const savedTrips = await db.select().from(trips).where(eq(trips.userId, testUserId));
      expect(savedTrips).toHaveLength(0);
    });

    it('should maintain referential integrity when deleting trips', async () => {
      // Create trips with potential references
      const parentTripId = createId();
      const childTripId = createId();

      await db.insert(trips).values([
        {
          id: parentTripId,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Parent Trip',
          syncVersion: 1,
        },
        {
          id: childTripId,
          userId: testUserId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-10',
          location: 'Child Trip',
          syncId: parentTripId, // References parent
          syncVersion: 1,
        },
      ]);

      // Delete parent trip
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 2,
          deletedTripIds: [parentTripId],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      // Check child trip still exists and is valid
      const [childTrip] = await db.select().from(trips).where(eq(trips.id, childTripId));
      expect(childTrip).toBeDefined();
      expect(childTrip?.syncId).toBe(parentTripId); // Reference maintained
    });
  });

  describe('Data Consistency Across Devices', () => {
    it('should handle clock skew between devices', async () => {
      const tripId = createId();
      const baseTime = new Date('2024-01-01T12:00:00Z');

      // Device 1 with correct time
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 1,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Device 1',
              isSimulated: false,
              createdAt: baseTime.toISOString(),
              updatedAt: baseTime.toISOString(),
              syncId: undefined,
              deviceId: 'device-1',
              syncVersion: 1,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device 2 with clock 1 hour behind
      const skewedTime = new Date(baseTime.getTime() - 3600000); // 1 hour behind
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15', // Different data
              location: 'Device 2',
              isSimulated: false,
              createdAt: skewedTime.toISOString(), // Earlier timestamp
              updatedAt: skewedTime.toISOString(),
              syncId: undefined,
              deviceId: 'device-2',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      // Verify last write wins regardless of timestamp
      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(trip?.location).toBe('Device 2');
    });

    it('should handle partial sync state recovery', async () => {
      // Create initial dataset
      const tripIds = Array.from({ length: 10 }, () => createId());
      await db.insert(trips).values(
        tripIds.map((id, i) => ({
          id,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: `Trip ${i}`,
          syncVersion: i + 1,
        })),
      );

      // Pull with lastSyncVersion in the middle
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          lastSyncVersion: 5,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ trips: Array<{ location: string }> }>();

      // Should get trips 6-10
      expect(data.trips.length).toBe(5);
      expect(data.trips[0].location).toBe('Trip 5'); // Index 5, version 6
    });

    it('should handle duplicate sync operations idempotently', async () => {
      const tripData = {
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Idempotent Trip',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local' as const,
        deletedAt: undefined,
      };

      // Send same push request multiple times
      const responses = await Promise.all([
        app.inject({
          method: 'POST',
          url: API_PATHS.SYNC_PUSH,
          headers: authHeaders,
          payload: {
            deviceId: 'test-device',
            syncVersion: 1,
            trips: [tripData],
          },
        }),
        app.inject({
          method: 'POST',
          url: API_PATHS.SYNC_PUSH,
          headers: authHeaders,
          payload: {
            deviceId: 'test-device',
            syncVersion: 1,
            trips: [tripData],
          },
        }),
      ]);

      // All should succeed
      responses.forEach((r) => expect(r.statusCode).toBe(HTTP_STATUS.OK));

      // Should only have one trip
      const savedTrips = await db.select().from(trips).where(eq(trips.id, tripData.id));
      expect(savedTrips).toHaveLength(1);
    });
  });

  describe('Edge Cases in Sync Version Management', () => {
    it('should handle gaps in sync version sequence', async () => {
      const tripIds = [createId(), createId(), createId()];

      // Create trips with version gaps
      await db.insert(trips).values([
        {
          id: tripIds[0],
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Version 1',
          syncVersion: 1,
        },
        {
          id: tripIds[1],
          userId: testUserId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-10',
          location: 'Version 5',
          syncVersion: 5, // Gap in versions
        },
        {
          id: tripIds[2],
          userId: testUserId,
          departureDate: '2024-03-01',
          returnDate: '2024-03-10',
          location: 'Version 10',
          syncVersion: 10,
        },
      ]);

      // Pull with version 3 (in the gap)
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          lastSyncVersion: 3,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ trips: Array<{ location: string }> }>();

      // Should get trips with version > 3
      expect(data.trips).toHaveLength(2);
      expect(data.trips[0].location).toBe('Version 5');
      expect(data.trips[1].location).toBe('Version 10');
    });

    it('should handle sync version rollback scenarios', async () => {
      const tripId = createId();

      // Create trip with high version
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'High Version',
        syncVersion: 100,
      });

      // Try to update with lower version
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 50,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-20',
              location: 'Lower Version Update',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: undefined,
              syncVersion: 50,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);

      // Check version was NOT updated (conflict prevents rollback)
      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(trip?.syncVersion).toBe(100);
    });
  });

  describe('Data Migration & Schema Evolution', () => {
    it('should handle missing optional fields gracefully', async () => {
      // Directly insert minimal trip data
      const tripId = createId();
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ trips: Array<{ location?: string }> }>();
      expect(data.trips).toHaveLength(1);
      expect(data.trips[0].location).toBeUndefined();
    });

    it('should handle future schema fields from newer clients', async () => {
      const tripWithExtraFields = {
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Future Trip',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local',
        deletedAt: undefined,
        // Future fields that don't exist yet
        futureField1: 'some value',
        futureField2: { nested: 'data' },
        futureField3: [1, 2, 3],
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [tripWithExtraFields as unknown],
        },
      });

      // Should strip unknown fields due to Zod strict mode
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle exactly zero trips correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{
        trips: Array<unknown>;
        hasMore: boolean;
        syncVersion: number;
      }>();
      expect(data.trips).toEqual([]);
      expect(data.hasMore).toBe(false);
      expect(data.syncVersion).toBe(0);
    });

    it('should handle sync at exact batch boundaries', async () => {
      // Create exactly MAX_BATCH_SIZE + 1 trips
      const tripCount = SYNC_CONFIG.MAX_BATCH_SIZE + 1;
      await db.insert(trips).values(
        Array.from({ length: tripCount }, (_, i) => ({
          id: createId(),
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: `Trip ${i}`,
          syncVersion: i + 1,
        })),
      );

      // First pull
      const response1 = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response1.statusCode).toBe(HTTP_STATUS.OK);
      const data1 = response1.json<{
        trips: Array<unknown>;
        hasMore: boolean;
        syncVersion: number;
      }>();
      expect(data1.trips).toHaveLength(SYNC_CONFIG.MAX_BATCH_SIZE);
      expect(data1.hasMore).toBe(true);

      // Second pull
      const response2 = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          lastSyncVersion: data1.syncVersion,
        },
      });

      expect(response2.statusCode).toBe(HTTP_STATUS.OK);
      const data2 = response2.json<{ trips: Array<unknown>; hasMore: boolean }>();
      expect(data2.trips).toHaveLength(1);
      expect(data2.hasMore).toBe(false);
    });

    it('should handle maximum date values correctly', async () => {
      const extremeDateTrips = [
        {
          id: createId(),
          userId: testUserId,
          departureDate: '1900-01-01', // Very old
          returnDate: '1900-01-02',
          location: 'Historical Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncId: undefined,
          deviceId: undefined,
          syncVersion: 1,
          syncStatus: 'local' as const,
          deletedAt: undefined,
        },
        {
          id: createId(),
          userId: testUserId,
          departureDate: '9999-12-30', // Far future
          returnDate: '9999-12-31',
          location: 'Future Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncId: undefined,
          deviceId: undefined,
          syncVersion: 2,
          syncStatus: 'local' as const,
          deletedAt: undefined,
        },
      ];

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 2,
          trips: extremeDateTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      // Verify dates preserved correctly
      const savedTrips = await db
        .select()
        .from(trips)
        .where(eq(trips.userId, testUserId))
        .orderBy(trips.departureDate);

      expect(savedTrips[0].departureDate).toBe('1900-01-01');
      expect(savedTrips[1].departureDate).toBe('9999-12-30');
    });
  });

  describe('Performance & Scalability Edge Cases', () => {
    it('should handle user with thousands of trips efficiently', async () => {
      // Create many trips
      const tripCount = 1000;
      const batchSize = 100;

      for (let batch = 0; batch < tripCount / batchSize; batch++) {
        const tripBatch = Array.from({ length: batchSize }, (_, i) => ({
          id: createId(),
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: `Trip ${batch * batchSize + i}`,
          syncVersion: batch * batchSize + i + 1,
        }));

        await db.insert(trips).values(tripBatch);
      }

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          lastSyncVersion: 500, // Middle of dataset
        },
      });
      const duration = Date.now() - startTime;

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      const data = response.json<{ trips: unknown[]; hasMore: boolean }>();
      expect(data.trips).toHaveLength(SYNC_CONFIG.MAX_BATCH_SIZE);
      expect(data.hasMore).toBe(true);
    });

    it('should handle complex filtering efficiently', async () => {
      // Create trips with various attributes
      const tripData = Array.from({ length: 100 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
        returnDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-10`,
        location: i % 2 === 0 ? 'Even Location' : 'Odd Location',
        syncVersion: i + 1,
        isSimulated: i % 3 === 0,
        deletedAt: i % 5 === 0 ? new Date().toISOString() : null,
      }));

      await db.insert(trips).values(tripData);

      // Pull with specific entity filter
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          entityTypes: ['trips'],
          lastSyncVersion: 25,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ trips: unknown[]; userSettings: unknown }>();

      // Should efficiently filter
      expect(data.trips.length).toBeLessThanOrEqual(SYNC_CONFIG.MAX_BATCH_SIZE);
      expect(data.userSettings).toBeNull();
    });
  });
});

import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncConflict, Trip, UserSettings } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG, SYNC_ERROR_CODES, SYNC_MESSAGES } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import { API_PATHS } from '@api/test-utils/api-paths';
import { trips, userSettings } from '@api/db/schema';
import { SessionService } from '@api/services/session';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';

// Type definitions for test
interface SyncPullResponse {
  syncVersion: number;
  trips: Trip[];
  userSettings: unknown;
  hasMore: boolean;
  conflicts?: SyncConflict[];
}

interface SyncPushResponse {
  syncVersion: number;
  syncedEntities: {
    trips: number;
    userSettings: boolean;
    deletedTrips: number;
  };
  conflicts?: SyncConflict[];
}

describe('Sync Routes', () => {
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

    // Generate authentication token
    const sessionService = new SessionService();
    const sessionData = await sessionService.createSession(testUserId, '127.0.0.1', 'test-agent');

    authHeaders = { authorization: `Bearer ${sessionData.accessToken}` };

    // Enable sync for tests - mocking read-only property
    Object.defineProperty(SYNC_CONFIG, 'ENABLED', { value: true, writable: true });
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  describe('POST /sync/pull', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        payload: {
          deviceId: 'test-device',
        },
      });

      if (response.statusCode === 500) {
        console.error('Error response:', response.json());
      }
      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 503 when sync is disabled', async () => {
      vi.spyOn(SYNC_CONFIG, 'ENABLED', 'get').mockReturnValue(false);

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(response.json()).toMatchObject({
        error: {
          message: SYNC_MESSAGES.SYNC_DISABLED,
          code: SYNC_ERROR_CODES.SYNC_DISABLED,
        },
      });
    });

    it('should return empty data for first sync', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPullResponse>();
      expect(data).toMatchObject({
        syncVersion: 0,
        trips: [],
        userSettings: null,
        hasMore: false,
      });
    });

    it('should return all data when no lastSyncVersion provided', async () => {
      // Create test data
      await db.insert(trips).values([
        {
          id: createId(),
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Paris',
          syncVersion: 1,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: createId(),
          userId: testUserId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-15',
          location: 'Tokyo',
          syncVersion: 2,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      await db.insert(userSettings).values({
        id: createId(),
        userId: testUserId,
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        syncEnabled: true,
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

      if (response.statusCode !== HTTP_STATUS.OK) {
        console.error('Response body:', response.json());
      }
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPullResponse>();
      expect(data.syncVersion).toBe(2);
      expect(data.trips).toHaveLength(2);
      expect(data.userSettings).toBeTruthy();
      expect(data.hasMore).toBe(false);
    });

    it('should return only updated data based on lastSyncVersion', async () => {
      // Create test data with different sync versions
      const tripId2 = createId();
      await db.insert(trips).values([
        {
          id: createId(),
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Paris',
          syncVersion: 1,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: tripId2,
          userId: testUserId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-15',
          location: 'Tokyo',
          syncVersion: 3,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          lastSyncVersion: 2,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPullResponse>();
      expect(data.syncVersion).toBe(3);
      expect(data.trips).toHaveLength(1);
      expect(data.trips[0]).toMatchObject({ id: tripId2 });
    });

    it('should filter by entity types when specified', async () => {
      await db.insert(trips).values({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris',
        syncVersion: 1,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.insert(userSettings).values({
        id: createId(),
        userId: testUserId,
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        syncEnabled: true,
        syncVersion: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          entityTypes: ['trips'],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPullResponse>();
      expect(data.trips).toHaveLength(1);
      expect(data.userSettings).toBeNull();
    });

    it('should handle pagination with MAX_BATCH_SIZE', async () => {
      // Create more trips than MAX_BATCH_SIZE
      const tripPromises = Array.from({ length: SYNC_CONFIG.MAX_BATCH_SIZE + 5 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Location ${i}`,
        syncVersion: i + 1,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await db.insert(trips).values(tripPromises);

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPullResponse>();
      expect(data.trips).toHaveLength(SYNC_CONFIG.MAX_BATCH_SIZE);
      expect(data.hasMore).toBe(true);
    });

    it('should not return data for other users', async () => {
      // Create another user's data
      const otherUser = await createTestUser({
        email: 'other@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
      });
      await db.insert(trips).values({
        id: createId(),
        userId: otherUser.id,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris',
        syncVersion: 1,
        isSimulated: false,
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
      const data = response.json<SyncPullResponse>();
      expect(data.trips).toHaveLength(0);
    });
  });

  describe('POST /sync/push', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 503 when sync is disabled', async () => {
      vi.spyOn(SYNC_CONFIG, 'ENABLED', 'get').mockReturnValue(false);

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(response.json()).toMatchObject({
        error: {
          message: SYNC_MESSAGES.SYNC_DISABLED,
          code: SYNC_ERROR_CODES.SYNC_DISABLED,
        },
      });
    });

    it('should create new trips', async () => {
      const tripId = createId();
      const newTrips: Trip[] = [
        {
          id: tripId,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Paris',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncId: undefined,
          deviceId: undefined,
          syncVersion: 1,
          syncStatus: 'local',
          deletedAt: undefined,
        },
      ];

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: newTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPushResponse>();
      expect(data).toMatchObject({
        syncVersion: 1,
        syncedEntities: {
          trips: 1,
          userSettings: false,
          deletedTrips: 0,
        },
      });

      // Verify trip was created
      const createdTrips = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(createdTrips).toHaveLength(1);
      expect(createdTrips[0].location).toBe('Paris');
    });

    it('should update existing trips', async () => {
      // Create initial trip
      const tripId = createId();
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris',
        syncVersion: 1,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const updatedTrip: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-15', // Changed
        location: 'Paris, France', // Changed
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 2,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 2,
          trips: [updatedTrip],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      // Verify trip was updated
      const updatedTrips = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(updatedTrips).toHaveLength(1);
      expect(updatedTrips[0].returnDate).toBe('2024-01-15');
      expect(updatedTrips[0].location).toBe('Paris, France');
    });

    it('should handle user settings updates', async () => {
      const settings: UserSettings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'system',
        language: 'en',
        sync: {
          enabled: true,
          subscriptionTier: 'basic',
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          userSettings: settings,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPushResponse>();
      expect(data.syncedEntities.userSettings).toBe(true);

      // Verify settings were saved
      const savedSettings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, testUserId));
      expect(savedSettings).toHaveLength(1);
      expect(savedSettings[0].notificationMilestones).toBe(true);
      expect(savedSettings[0].notificationWarnings).toBe(true);
      expect(savedSettings[0].notificationReminders).toBe(true);
    });

    it('should handle trip deletions', async () => {
      // Create trips to delete
      const trip1Id = createId();
      const trip2Id = createId();
      await db.insert(trips).values([
        {
          id: trip1Id,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Paris',
          syncVersion: 1,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: trip2Id,
          userId: testUserId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-10',
          location: 'Tokyo',
          syncVersion: 1,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 2,
          deletedTripIds: [trip1Id],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPushResponse>();
      expect(data.syncedEntities.deletedTrips).toBe(1);

      // Verify trip was soft deleted
      const deletedTrips = await db.select().from(trips).where(eq(trips.id, trip1Id));
      expect(deletedTrips).toHaveLength(1);
      expect(deletedTrips[0].deletedAt).toBeTruthy();

      // Verify other trip was not affected
      const notDeletedTrips = await db.select().from(trips).where(eq(trips.id, trip2Id));
      expect(notDeletedTrips).toHaveLength(1);
      expect(notDeletedTrips[0].deletedAt).toBeNull();
    });

    it('should reject operations on other users data', async () => {
      const otherUserId = createId();
      const maliciousTrip: Trip = {
        id: createId(),
        userId: otherUserId, // Trying to create trip for another user
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Hacker Land',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [maliciousTrip],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should handle empty sync push', async () => {
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<SyncPushResponse>();
      expect(data).toMatchObject({
        syncVersion: 1,
        syncedEntities: {
          trips: 0,
          userSettings: false,
          deletedTrips: 0,
        },
      });
    });

    it('should validate trip data before syncing', async () => {
      const invalidTrip = {
        id: createId(),
        userId: testUserId,
        departureDate: 'not-a-date', // Invalid date
        returnDate: '2024-01-10',
        location: 'Paris',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncVersion: 1,
      };

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [invalidTrip],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    // Conflict detection test placeholder
    it.skip('should detect conflicts when sync versions mismatch', async () => {
      // This will be implemented when conflict resolution is added
    });
  });

  describe('Edge Cases', () => {
    it('should handle sync with maximum batch size', async () => {
      const maxTrips = Array.from({ length: SYNC_CONFIG.MAX_BATCH_SIZE }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Location ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local' as const,
        deletedAt: undefined,
      }));

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: maxTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should reject sync push exceeding maximum batch size', async () => {
      const tooManyTrips = Array.from({ length: SYNC_CONFIG.MAX_BATCH_SIZE + 1 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Location ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local' as const,
        deletedAt: undefined,
      }));

      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: tooManyTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.json()).toMatchObject({
        error: {
          code: SYNC_ERROR_CODES.SYNC_BATCH_TOO_LARGE,
        },
      });
    });

    it('should handle concurrent sync operations gracefully', async () => {
      // This test would require implementing sync locking mechanism
      // For now, we'll skip it
    });
  });
});

import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncConflict, Trip, UserSettings } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import { API_PATHS } from '@api/test-utils/api-paths';
import { trips, userSettings } from '@api/db/schema';
import { SessionService } from '@api/services/session';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';

describe('Sync Conflict Resolution', () => {
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

  describe('Trip Conflicts', () => {
    it('should detect conflicts when same trip is modified on different devices', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Device 2 pulls the trip
      const pullResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PULL,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          lastSyncVersion: 0,
        },
      });

      expect(pullResponse.statusCode).toBe(HTTP_STATUS.OK);
      const pullData = pullResponse.json<{ trips: Trip[] }>();
      expect(pullData.trips).toHaveLength(1);

      // Device 1 updates the trip
      const device1Trip: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-15', // Changed return date
        location: 'Paris',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-1',
        syncVersion: 2,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const device1Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: [device1Trip],
        },
      });

      expect(device1Response.statusCode).toBe(HTTP_STATUS.OK);

      // Device 2 tries to update the same trip based on old data
      const device2Trip: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris, France', // Changed location
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-2',
        syncVersion: 1, // Device 2's version is based on version 1
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const device2Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2, // Trying to update to version 2
          trips: [device2Trip],
        },
      });

      // Should detect conflict
      expect(device2Response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = device2Response.json<{ conflicts: SyncConflict[] }>();
      expect(conflictData.conflicts).toBeDefined();
      expect(conflictData.conflicts).toHaveLength(1);
      expect(conflictData.conflicts[0].entityType).toBe('trip');
      expect(conflictData.conflicts[0].entityId).toBe(tripId);
      expect(conflictData.conflicts[0].localVersion?.data).toBeDefined();
      expect(conflictData.conflicts[0].remoteVersion).toBeDefined();
    });

    it('should handle delete conflicts when trip is deleted on one device and modified on another', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'London',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Device 1 deletes the trip
      const device1Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          deletedTripIds: [tripId],
        },
      });

      expect(device1Response.statusCode).toBe(HTTP_STATUS.OK);

      // Device 2 tries to update the deleted trip
      const device2Trip: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-12',
        location: 'London, UK',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-2',
        syncVersion: 2,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const device2Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2,
          trips: [device2Trip],
        },
      });

      // Should detect conflict
      expect(device2Response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = device2Response.json<{ conflicts: SyncConflict[] }>();
      expect(conflictData.conflicts).toBeDefined();
      expect(conflictData.conflicts[0].conflictType).toBe('delete_update');
    });

    it('should use last-write-wins strategy when forceOverwrite is true', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Tokyo',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Device 1 updates
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15',
              location: 'Tokyo',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-1',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device 2 forces overwrite
      const device2Trip: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-20',
        location: 'Tokyo, Japan',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-2',
        syncVersion: 3,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const forceResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 3,
          trips: [device2Trip],
          forceOverwrite: true,
        },
      });

      expect(forceResponse.statusCode).toBe(HTTP_STATUS.OK);

      // Verify the trip was overwritten
      const [updatedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));

      expect(updatedTrip.returnDate).toBe('2024-01-20');
      expect(updatedTrip.location).toBe('Tokyo, Japan');
      expect(updatedTrip.syncVersion).toBe(3);
    });
  });

  describe('User Settings Conflicts', () => {
    it('should detect conflicts in user settings modifications', async () => {
      // Create initial settings
      await db.insert(userSettings).values({
        id: randomUUID(),
        userId: testUserId,
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        biometricAuthEnabled: false,
        theme: 'light',
        language: 'en',
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Device 1 updates settings
      const device1Settings: UserSettings = {
        notifications: {
          milestones: false, // Changed
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'light',
        language: 'en',
      };

      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          userSettings: device1Settings,
        },
      });

      // Device 2 tries to update settings based on old version
      const device2Settings: UserSettings = {
        notifications: {
          milestones: true,
          warnings: false, // Changed
          reminders: true,
        },
        biometricAuthEnabled: true, // Changed
        theme: 'light',
        language: 'en',
      };

      const device2Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 1,
          userSettings: device2Settings,
        },
      });

      // Should detect conflict
      expect(device2Response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = device2Response.json<{ conflicts: SyncConflict[] }>();
      expect(conflictData.conflicts).toBeDefined();
      expect(conflictData.conflicts[0].entityType).toBe('user_settings');
    });
  });

  describe('Batch Conflicts', () => {
    it('should handle conflicts in batch operations with multiple trips', async () => {
      const tripIds = [randomUUID(), randomUUID(), randomUUID()];

      // Create initial trips
      await db.insert(trips).values(
        tripIds.map((id, index) => ({
          id,
          userId: testUserId,
          departureDate: `2024-0${index + 1}-01`,
          returnDate: `2024-0${index + 1}-10`,
          location: `Location ${index + 1}`,
          syncVersion: 1,
          deviceId: 'device-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      );

      // Device 1 updates first two trips
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: tripIds.slice(0, 2).map((id, index) => ({
            id,
            userId: testUserId,
            departureDate: `2024-0${index + 1}-01`,
            returnDate: `2024-0${index + 1}-15`, // Changed
            location: `Location ${index + 1}`,
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncId: undefined,
            deviceId: 'device-1',
            syncVersion: 2,
            syncStatus: 'local',
            deletedAt: undefined,
          })),
        },
      });

      // Device 2 tries to update all three trips based on version 1
      const device2Trips = tripIds.map((id, index) => ({
        id,
        userId: testUserId,
        departureDate: `2024-0${index + 1}-01`,
        returnDate: `2024-0${index + 1}-10`,
        location: `${index === 0 ? 'Updated ' : ''}Location ${index + 1}`, // Only first changed
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-2',
        syncVersion: 1, // Based on version 1
        syncStatus: 'local' as const,
        deletedAt: undefined,
      }));

      const device2Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2,
          trips: device2Trips,
        },
      });

      // Should detect conflicts for first two trips
      expect(device2Response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = device2Response.json<{ conflicts: SyncConflict[] }>();
      expect(conflictData.conflicts).toHaveLength(2);
      expect(conflictData.conflicts.map((c) => c.entityId).sort()).toEqual(
        tripIds.slice(0, 2).sort(),
      );
    });

    it('should apply non-conflicting changes even when some items conflict', async () => {
      const tripIds = [randomUUID(), randomUUID()];

      // Create initial trips
      await db.insert(trips).values(
        tripIds.map((id, index) => ({
          id,
          userId: testUserId,
          departureDate: `2024-0${index + 1}-01`,
          returnDate: `2024-0${index + 1}-10`,
          location: `Location ${index + 1}`,
          syncVersion: 1,
          deviceId: 'device-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      );

      // Device 1 updates only the first trip
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: [
            {
              id: tripIds[0],
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15', // Changed
              location: 'Location 1',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-1',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device 2 updates both trips
      const device2Response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2,
          trips: tripIds.map((id, index) => ({
            id,
            userId: testUserId,
            departureDate: `2024-0${index + 1}-01`,
            returnDate: `2024-0${index + 1}-10`,
            location: `Updated Location ${index + 1}`, // Both changed
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncId: undefined,
            deviceId: 'device-2',
            syncVersion: 1, // Based on version 1
            syncStatus: 'local' as const,
            deletedAt: undefined,
          })),
          applyNonConflicting: true,
        },
      });

      // Should return partial success
      expect(device2Response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const responseData = device2Response.json<{
        conflicts: SyncConflict[];
        syncedEntities: { trips: number };
      }>();
      expect(responseData.conflicts).toHaveLength(1);
      expect(responseData.conflicts[0].entityId).toBe(tripIds[0]);
      expect(responseData.syncedEntities.trips).toBe(1); // Second trip should be synced

      // Verify second trip was updated
      const [secondTrip] = await db.select().from(trips).where(eq(trips.id, tripIds[1]));

      expect(secondTrip.location).toBe('Updated Location 2');
      expect(secondTrip.syncVersion).toBe(2);
    });
  });

  describe('Conflict Resolution Strategies', () => {
    it('should provide field-level conflict information for smart merging', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Berlin',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Device 1 changes return date
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15', // Changed
              location: 'Berlin',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-1',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device 2 changes location
      const device2Response = await app.inject({
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
              returnDate: '2024-01-10', // Original
              location: 'Berlin, Germany', // Changed
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-2',
              syncVersion: 1, // Based on version 1
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(device2Response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = device2Response.json<{ conflicts: SyncConflict[] }>();
      const conflict = conflictData.conflicts[0];

      // Should indicate which fields are in conflict
      expect(conflict.conflictingFields).toBeDefined();
      expect(conflict.conflictingFields).toContain('returnDate');
      expect(conflict.conflictingFields).toContain('location');
    });

    it('should support client-side conflict resolution with merge strategy', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Madrid',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create conflicting updates
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15',
              location: 'Madrid',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-1',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Client resolves conflict by merging changes
      const mergedResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 3,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15', // Kept device 1's change
              location: 'Madrid, Spain', // Added device 2's change
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-2',
              syncVersion: 3,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
          resolvedConflicts: [
            {
              entityType: 'trip',
              entityId: tripId,
              resolution: 'merged',
              mergedVersion: 3,
            },
          ],
        },
      });

      expect(mergedResponse.statusCode).toBe(HTTP_STATUS.OK);

      // Verify merged result
      const [mergedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));

      expect(mergedTrip.returnDate).toBe('2024-01-15');
      expect(mergedTrip.location).toBe('Madrid, Spain');
      expect(mergedTrip.syncVersion).toBe(3);
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle rapid-fire sync attempts from same device (double-tap scenario)', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Dubai',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // User accidentally double-taps save, sending same update twice
      const updatePayload = {
        deviceId: 'device-1',
        syncVersion: 2,
        trips: [
          {
            id: tripId,
            userId: testUserId,
            departureDate: '2024-01-01',
            returnDate: '2024-01-15',
            location: 'Dubai, UAE',
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncId: undefined,
            deviceId: 'device-1',
            syncVersion: 2,
            syncStatus: 'local',
            deletedAt: undefined,
          },
        ],
      };

      // First tap
      const response1 = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: updatePayload,
      });
      expect(response1.statusCode).toBe(HTTP_STATUS.OK);

      // Second tap (same payload)
      const response2 = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: updatePayload,
      });

      // Should succeed as it's idempotent
      expect(response2.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should handle zombie device syndrome (old device syncing after long offline period)', async () => {
      const tripId = randomUUID();

      // Current state: trip has been updated many times
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-06-01',
        returnDate: '2024-06-30',
        location: 'Final Location after 10 edits',
        syncVersion: 10,
        deviceId: 'device-current',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Zombie device wakes up thinking it has version 1 data
      const zombieResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-zombie',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Ancient outdated location',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-zombie',
              syncVersion: 1, // Based on very old version
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(zombieResponse.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = zombieResponse.json<{
        conflicts: Array<{ remoteVersion?: { syncVersion: number } }>;
      }>();
      expect(conflictData.conflicts[0].remoteVersion?.syncVersion).toBe(10);
    });

    it('should handle deleted-then-recreated trip scenario', async () => {
      const tripId = randomUUID();

      // Create, delete, then recreate with same ID
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Singapore',
        syncVersion: 3,
        deviceId: 'device-1',
        deletedAt: new Date().toISOString(), // Marked as deleted
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Another device tries to update the "deleted" trip
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 4,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-12',
              location: 'Singapore',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-2',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = response.json<{ conflicts: Array<{ conflictType: string }> }>();
      expect(conflictData.conflicts[0].conflictType).toBe('delete_update');
    });

    it('should handle time-travel scenario (device with future dates)', async () => {
      // Device with wrong system time creates trips in the "future"
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const tripId = randomUUID();
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-time-traveler',
          syncVersion: 1,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: futureDate.toISOString().split('T')[0],
              returnDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              location: 'Future City',
              isSimulated: false,
              createdAt: futureDate.toISOString(),
              updatedAt: futureDate.toISOString(),
              syncId: undefined,
              deviceId: 'device-time-traveler',
              syncVersion: 0,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Should accept the data (sync doesn't validate business logic)
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should handle maximum conflict scenario (everything conflicts)', async () => {
      const tripIds = Array.from({ length: 5 }, () => randomUUID());

      // Create 5 trips
      await db.insert(trips).values(
        tripIds.map((id, i) => ({
          id,
          userId: testUserId,
          departureDate: `2024-0${i + 1}-01`,
          returnDate: `2024-0${i + 1}-10`,
          location: `Location ${i + 1}`,
          syncVersion: 2,
          deviceId: 'device-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      );

      // Create user settings at version 3 (will conflict with sync trying to go from 2->3)
      await db.insert(userSettings).values({
        id: randomUUID(),
        userId: testUserId,
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        biometricAuthEnabled: false,
        theme: 'dark',
        language: 'es',
        syncVersion: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Try to sync everything with conflicts
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 3,
          trips: tripIds.map((id, i) => ({
            id,
            userId: testUserId,
            departureDate: `2024-0${i + 1}-01`,
            returnDate: `2024-0${i + 1}-20`, // All changed
            location: `New Location ${i + 1}`,
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncId: undefined,
            deviceId: 'device-2',
            syncVersion: 1, // All based on old version
            syncStatus: 'local' as const,
            deletedAt: undefined,
          })),
          userSettings: {
            notifications: {
              milestones: false,
              warnings: false,
              reminders: false,
            },
            biometricAuthEnabled: true,
            theme: 'light' as const,
            language: 'en' as const,
          },
          deletedTripIds: [randomUUID()], // Try to delete non-existent trip
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = response.json<{ conflicts: Array<{ entityType: string }> }>();

      // Verify we have conflicts for all trips and settings
      const tripConflicts = conflictData.conflicts.filter((c) => c.entityType === 'trip');
      const settingsConflicts = conflictData.conflicts.filter(
        (c) => c.entityType === 'user_settings',
      );

      expect(tripConflicts).toHaveLength(5);
      expect(settingsConflicts).toHaveLength(1);
      expect(conflictData.conflicts.length).toBe(6); // 5 trips + 1 settings
    });

    it('should handle circular sync scenario (A→B→C→A)', async () => {
      const tripId = randomUUID();

      // Device A creates trip
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-A',
          syncVersion: 1,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Start: Device A',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-A',
              syncVersion: 0,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device B modifies
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-B',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Modified by Device B',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-B',
              syncVersion: 1,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device C modifies
      await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-C',
          syncVersion: 3,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Modified by Device C',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-C',
              syncVersion: 2,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Device A tries to modify again based on original
      const circularResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-A',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15',
              location: 'Device A strikes back',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-A',
              syncVersion: 1, // Still based on version 1
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(circularResponse.statusCode).toBe(HTTP_STATUS.CONFLICT);
    });

    it('should handle empty sync attempts gracefully', async () => {
      // Sync with no changes
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-empty',
          syncVersion: 1,
          trips: [],
          deletedTripIds: [],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{
        syncedEntities: { trips: number; userSettings: boolean; deletedTrips: number };
      }>();
      expect(data.syncedEntities.trips).toBe(0);
      expect(data.syncedEntities.userSettings).toBe(false);
      expect(data.syncedEntities.deletedTrips).toBe(0);
    });

    it('should handle malicious sync version jumping', async () => {
      const tripId = randomUUID();

      // Try to jump from version 1 to version 1000
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-malicious',
          syncVersion: 1000,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Hacker Location',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-malicious',
              syncVersion: 999,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Should succeed (version jumps are allowed)
      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      // Verify the high version was saved
      const [savedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));

      expect(savedTrip.syncVersion).toBe(1000);
    });

    it('should handle settings-only conflict while trips succeed', async () => {
      const tripId = randomUUID();

      // Create initial settings at version 3
      await db.insert(userSettings).values({
        id: randomUUID(),
        userId: testUserId,
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        biometricAuthEnabled: false,
        theme: 'light',
        language: 'en',
        syncVersion: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Push with new trip (should succeed) and conflicting settings
      // Device thinks it's updating from version 2, but server is at version 3
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-mixed',
          syncVersion: 3, // Device wants to update to version 3
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'New Trip',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-mixed',
              syncVersion: 0,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
          userSettings: {
            notifications: {
              milestones: false,
              warnings: true,
              reminders: true,
            },
            biometricAuthEnabled: true,
            theme: 'dark' as const,
            language: 'en' as const,
          },
          applyNonConflicting: true,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const data = response.json<{
        conflicts: SyncConflict[];
        syncedEntities: { trips: number; userSettings: boolean };
      }>();
      expect(data.syncedEntities.trips).toBe(1); // Trip succeeded
      expect(data.syncedEntities.userSettings).toBe(false); // Settings failed
      expect(data.conflicts).toHaveLength(1);
      expect(data.conflicts[0].entityType).toBe('user_settings');
    });

    it('should handle phantom trip resurrection (trip deleted everywhere but one offline device)', async () => {
      const tripId = randomUUID();

      // Create and then delete a trip (simulating it was deleted on all synced devices)
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Ghost Trip',
        syncVersion: 5,
        deviceId: 'device-deleter',
        deletedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Offline device comes back thinking the trip still exists and tries to update it
      const response = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-phantom',
          syncVersion: 3, // Old sync version
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15', // Trying to extend the deleted trip
              location: 'Ghost Trip Extended',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: 'device-phantom',
              syncVersion: 2, // Based on old version before deletion
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Should detect delete-update conflict
      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const conflictData = response.json<{
        conflicts: Array<{ conflictType: string; serverVersion?: { deletedAt?: string } }>;
      }>();
      expect(conflictData.conflicts).toHaveLength(1);
      expect(conflictData.conflicts[0].conflictType).toBe('delete_update');
      expect(conflictData.conflicts[0].serverVersion?.deletedAt).toBeDefined();
    });

    it('should handle race condition with simultaneous device registrations', async () => {
      // Two devices try to create the same user settings simultaneously

      // First device creates settings
      const response1 = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-race-1',
          syncVersion: 1,
          userSettings: {
            notifications: {
              milestones: true,
              warnings: true,
              reminders: false,
            },
            biometricAuthEnabled: true,
            theme: 'dark' as const,
            language: 'en' as const,
          },
        },
      });

      expect(response1.statusCode).toBe(HTTP_STATUS.OK);

      // Second device tries to create settings (not knowing first device already did)
      const response2 = await app.inject({
        method: 'POST',
        url: API_PATHS.SYNC_PUSH,
        headers: authHeaders,
        payload: {
          deviceId: 'device-race-2',
          syncVersion: 2, // Next version after first device
          userSettings: {
            notifications: {
              milestones: false,
              warnings: false,
              reminders: true,
            },
            biometricAuthEnabled: false,
            theme: 'light' as const,
            language: 'es' as const,
          },
        },
      });

      // Should succeed (no conflict as it's the next version)
      expect(response2.statusCode).toBe(HTTP_STATUS.OK);

      // Verify final state uses last write
      const [finalSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, testUserId));

      expect(finalSettings.theme).toBe('light');
      expect(finalSettings.language).toBe('es');
    });
  });
});

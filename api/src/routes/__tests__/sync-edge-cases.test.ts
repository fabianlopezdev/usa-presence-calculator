import { randomUUID } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

import { Trip } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import * as schema from '@api/db/schema';
import { trips, userSettings, users } from '@api/db/schema';
import { SessionService } from '@api/services/session';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';

describe('Sync Edge Cases - Extreme Scenarios', () => {
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

  describe('Data Corruption & Recovery Scenarios', () => {
    it('should handle trips with null/undefined critical fields gracefully', async () => {
      // Insert trip with empty string dates (simulating corruption)
      await db.insert(trips).values({
        id: randomUUID(),
        userId: testUserId,
        departureDate: '',
        returnDate: '2024-01-10',
        location: 'Paris',
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      // Should handle gracefully, either filtering out bad data or returning error
      expect([HTTP_STATUS.OK, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.statusCode);
    });

    it('should handle database connection loss during sync operation', async () => {
      const originalSelect = db.select.bind(db);
      let callCount = 0;

      // Mock database to fail after first successful call
      vi.spyOn(db, 'select').mockImplementation(function () {
        callCount++;
        if (callCount > 1) {
          throw new Error('Database connection lost');
        }
        return originalSelect();
      } as typeof db.select);

      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('should handle circular references in sync data', async () => {
      const trip1Id = randomUUID();
      const trip2Id = randomUUID();

      // Create trips that might have circular reference patterns
      await db.insert(trips).values([
        {
          id: trip1Id,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'Paris',
          syncId: trip2Id, // References trip2
          syncVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: trip2Id,
          userId: testUserId,
          departureDate: '2024-02-01',
          returnDate: '2024-02-10',
          location: 'Tokyo',
          syncId: trip1Id, // References trip1
          syncVersion: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Malicious Input & Security Scenarios', () => {
    it('should reject SQL injection attempts in device ID', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE trips; --",
        "1' OR '1'='1",
        "admin'--",
        "1; UPDATE users SET email='hacked@evil.com' WHERE 1=1; --",
      ];

      for (const payload of maliciousPayloads) {
        const response = await app.inject({
          method: 'POST',
          url: '/sync/pull',
          headers: authHeaders,
          payload: {
            deviceId: payload,
          },
        });

        // Should not crash or expose SQL errors
        expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST]).toContain(response.statusCode);

        // Verify database wasn't corrupted
        const userCount = await db.select().from(users);
        expect(userCount.length).toBeGreaterThan(0);
      }
    });

    it('should handle XSS attempts in trip location fields', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
      ];

      for (const payload of xssPayloads) {
        const tripId = randomUUID();
        const trip: Trip = {
          id: tripId,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: payload,
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
          url: '/sync/push',
          headers: authHeaders,
          payload: {
            deviceId: 'test-device',
            syncVersion: 1,
            trips: [trip],
          },
        });

        expect(response.statusCode).toBe(HTTP_STATUS.OK);

        // Verify the data was stored safely
        const [storedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));

        expect(storedTrip?.location).toBe(payload); // Should store as-is, sanitization happens on display
      }
    });

    it('should prevent billion laughs attack with deeply nested objects', async () => {
      const createDeeplyNestedTrip = (depth: number): unknown => {
        if (depth === 0) {
          return {
            id: randomUUID(),
            userId: testUserId,
            departureDate: '2024-01-01',
            returnDate: '2024-01-10',
            location: 'Test',
          };
        }

        return {
          nested: createDeeplyNestedTrip(depth - 1),
        };
      };

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [createDeeplyNestedTrip(1000)], // Very deep nesting
        },
      });

      if (response.statusCode !== HTTP_STATUS.BAD_REQUEST) {
        console.error('Response:', response.json());
      }
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should handle prototype pollution attempts', async () => {
      const maliciousPayload = {
        deviceId: 'test-device',
        syncVersion: 1,
        __proto__: {
          isAdmin: true,
        },
        constructor: {
          prototype: {
            isAdmin: true,
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: maliciousPayload,
      });

      // Should not crash and should not pollute prototype
      expect([
        HTTP_STATUS.OK,
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ]).toContain(response.statusCode);
      interface PollutedPrototype {
        isAdmin?: boolean;
      }
      expect((Object.prototype as PollutedPrototype).isAdmin).toBeUndefined();
    });
  });

  describe('Race Conditions & Concurrency', () => {
    it('should handle simultaneous sync operations from same user', async () => {
      // Create initial data
      const tripIds = Array.from({ length: 10 }, () => randomUUID());
      await db.insert(trips).values(
        tripIds.map((id, i) => ({
          id,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: `Location ${i}`,
          syncVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      );

      // Launch multiple concurrent sync operations
      const promises = Array.from({ length: 5 }, () =>
        app.inject({
          method: 'POST',
          url: '/sync/pull',
          headers: authHeaders,
          payload: {
            deviceId: `device-${Math.random()}`,
            lastSyncVersion: 0,
          },
        }),
      );

      const responses = await Promise.all(promises);

      // All should succeed without data corruption
      responses.forEach((response) => {
        expect(response.statusCode).toBe(HTTP_STATUS.OK);
        const data = response.json<{ trips: unknown[] }>();
        expect(data.trips).toHaveLength(10);
      });
    });

    it('should handle conflicting updates to same trip from different devices', async () => {
      const tripId = randomUUID();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris',
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Simulate updates from two different devices simultaneously
      const trip1: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-15', // Device 1 changes return date
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

      const trip2: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris, France', // Device 2 changes location
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-2',
        syncVersion: 2,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const promises = [
        app.inject({
          method: 'POST',
          url: '/sync/push',
          headers: authHeaders,
          payload: {
            deviceId: 'device-1',
            syncVersion: 2,
            trips: [trip1],
          },
        }),
        app.inject({
          method: 'POST',
          url: '/sync/push',
          headers: authHeaders,
          payload: {
            deviceId: 'device-2',
            syncVersion: 2,
            trips: [trip2],
          },
        }),
      ];

      const responses = await Promise.all(promises);

      // At least one should succeed
      const successCount = responses.filter((r) => r.statusCode === HTTP_STATUS.OK).length;
      expect(successCount).toBeGreaterThan(0);

      // Check final state
      const [finalTrip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(finalTrip).toBeDefined();
      expect(finalTrip?.syncVersion).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Extreme Data Volumes', () => {
    it('should handle sync with exactly MAX_BATCH_SIZE trips across multiple entity types', async () => {
      // Create MAX_BATCH_SIZE trips
      const tripData = Array.from({ length: SYNC_CONFIG.MAX_BATCH_SIZE }, (_, i) => ({
        id: randomUUID(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Location ${i}`,
        syncVersion: i + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await db.insert(trips).values(tripData);

      // Also add user settings
      await db.insert(userSettings).values({
        id: randomUUID(),
        userId: testUserId,
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        syncVersion: SYNC_CONFIG.MAX_BATCH_SIZE + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ trips: unknown[]; hasMore: boolean; userSettings: unknown }>();

      // Should return MAX_BATCH_SIZE items and indicate more available
      expect(data.trips).toHaveLength(SYNC_CONFIG.MAX_BATCH_SIZE);

      // hasMore should be false because we only have exactly MAX_BATCH_SIZE trips
      expect(data.hasMore).toBe(false);

      // UserSettings should be included since we're not over the limit
      expect(data.userSettings).not.toBeNull();
    });

    it('should handle extremely long strings in trip locations', async () => {
      const veryLongLocation = 'A'.repeat(10000); // 10KB string
      const tripId = randomUUID();

      const trip: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: veryLongLocation,
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
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [trip],
        },
      });

      // Should either accept or reject based on field limits
      expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST]).toContain(response.statusCode);
    });
  });

  describe('Time-based Edge Cases', () => {
    it('should handle trips with dates in far future', async () => {
      const futureTripId = randomUUID();
      const trip: Trip = {
        id: futureTripId,
        userId: testUserId,
        departureDate: '2099-12-31',
        returnDate: '2100-01-01',
        location: 'Future City',
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
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [trip],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should handle sync during daylight saving time transitions', async () => {
      // Test with DST transition dates
      const dstTripId = randomUUID();
      const trip: Trip = {
        id: dstTripId,
        userId: testUserId,
        departureDate: '2024-03-10', // Spring DST transition in US
        returnDate: '2024-03-11',
        location: 'DST Test',
        isSimulated: false,
        createdAt: '2024-03-10T02:30:00Z', // During the "lost hour"
        updatedAt: '2024-03-10T02:30:00Z',
        syncId: undefined,
        deviceId: undefined,
        syncVersion: 1,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [trip],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should handle rapid successive syncs (potential DDoS)', async () => {
      const startTime = Date.now();
      const requests = [];

      // Send 100 requests as fast as possible
      for (let i = 0; i < 100; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/sync/pull',
            headers: authHeaders,
            payload: {
              deviceId: 'test-device',
              lastSyncVersion: i,
            },
          }),
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Should complete within reasonable time (not hanging)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      // Most should succeed (rate limiting might kick in for some)
      const successCount = responses.filter((r) => r.statusCode === HTTP_STATUS.OK).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('State Corruption & Recovery', () => {
    it('should handle orphaned trips (user deleted)', async () => {
      // Create a temporary user and trip
      const orphanUser = await createTestUser({
        email: 'orphan@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
      });

      await db.insert(trips).values({
        id: randomUUID(),
        userId: orphanUser.id,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Orphan Trip',
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Delete the user (creating orphaned trip)
      await db.delete(schema.users).where(eq(schema.users.id, orphanUser.id));

      // Should not return orphaned trips for current user
      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ trips: unknown[] }>();
      expect(data.trips).toHaveLength(0);
    });

    it('should handle sync version integer overflow', async () => {
      const maxInt = 2147483647; // Max 32-bit integer

      // Test pushing with overflow version directly
      const overflowResponse = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: maxInt + 1,
          trips: [],
        },
      });

      // Should handle gracefully - our validation should catch the overflow
      expect(overflowResponse.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorData = overflowResponse.json<{ error: { code: string } }>();
      expect(errorData.error.code).toBe('INVALID_SYNC_VERSION');
    });

    it('should handle partial write failures', async () => {
      const tripIds = Array.from({ length: 5 }, () => randomUUID());
      const testTrips = tripIds.map((id, i) => ({
        id,
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

      // Make the third trip invalid
      testTrips[2].departureDate = 'invalid-date';

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: testTrips,
        },
      });

      // Should fail the entire batch (transactional integrity)
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      // Verify no trips were saved
      const savedTrips = await db.select().from(trips).where(eq(trips.userId, testUserId));

      expect(savedTrips.length).toBe(0);
    });
  });

  describe('Encoding & Character Set Edge Cases', () => {
    it('should handle unicode and emoji in trip locations', async () => {
      const unicodeLocations = [
        '東京 🗼', // Japanese with emoji
        'Москва ❄️', // Cyrillic with emoji
        '🏖️ Café São Paulo ☕', // Mixed with accents
        '👨‍👩‍👧‍👦 Family Trip', // Complex emoji
        'NULL\x00Character', // Null character
        'Tab\tand\nNewline', // Control characters
      ];

      const testTrips = unicodeLocations.map((location) => ({
        id: randomUUID(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location,
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
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: testTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      // Verify data integrity
      const pullResponse = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
        },
      });

      expect(pullResponse.statusCode).toBe(HTTP_STATUS.OK);
      const data = pullResponse.json<{ trips: Array<{ location: string }> }>();

      // Should preserve unicode characters
      const locations = data.trips.map((t) => t.location);
      expect(locations).toContain('東京 🗼');
      expect(locations).toContain('Москва ❄️');
    });

    it('should handle various date formats and edge cases', async () => {
      const edgeDateTrips = [
        { departure: '2024-02-29', return: '2024-03-01' }, // Leap year
        { departure: '2024-12-31', return: '2025-01-01' }, // Year boundary
        { departure: '2024-01-01', return: '2024-01-01' }, // Same day trip
      ];

      const testTrips = edgeDateTrips.map((dates) => ({
        id: randomUUID(),
        userId: testUserId,
        departureDate: dates.departure,
        returnDate: dates.return,
        location: 'Date Test',
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
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: testTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Network & Transport Layer Issues', () => {
    it('should handle extremely large payloads', async () => {
      // Create a payload just under typical limits
      const largeTrips = Array.from({ length: 1000 }, (_, i) => ({
        id: randomUUID(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-12-31',
        location: 'A'.repeat(100), // 100 chars each
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: randomUUID(),
        deviceId: randomUUID(),
        syncVersion: i,
        syncStatus: 'local' as const,
        deletedAt: i % 10 === 0 ? new Date().toISOString() : undefined,
      }));

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1000,
          trips: largeTrips,
        },
      });

      // Should reject as exceeding batch size
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: {
          ...authHeaders,
          'content-type': 'application/json',
        },
        payload: '{"deviceId": "test", "syncVersion": 1, trips: [}', // Invalid JSON
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should handle missing content-type header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: {
          authorization: authHeaders.authorization,
          // Missing content-type
        },
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [],
        },
      });

      // Fastify should handle this gracefully
      expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST]).toContain(response.statusCode);
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should handle sync with only deleted items', async () => {
      // Create trips and mark them for deletion
      const tripIds = Array.from({ length: 5 }, () => randomUUID());

      await db.insert(trips).values(
        tripIds.map((id) => ({
          id,
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: 'To Delete',
          syncVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 2,
          deletedTripIds: tripIds,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const data = response.json<{ syncedEntities: { deletedTrips: number } }>();
      expect(data.syncedEntities.deletedTrips).toBe(5);

      // Verify soft deletion
      const deletedTrips = await db
        .select()
        .from(trips)
        .where(and(eq(trips.userId, testUserId), isNull(trips.deletedAt)));

      expect(deletedTrips.length).toBe(0);
    });

    it('should handle user with no write permissions attempting sync', async () => {
      // Create a read-only session (simulated)
      const readOnlyUser = await createTestUser({
        email: 'readonly@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
      });

      // Update user settings to simulate read-only mode
      await db.insert(userSettings).values({
        id: randomUUID(),
        userId: readOnlyUser.id,
        syncEnabled: false, // Sync disabled
        syncSubscriptionTier: 'none',
        notificationMilestones: true,
        notificationWarnings: true,
        notificationReminders: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const sessionService = new SessionService();
      const readOnlySession = await sessionService.createSession(
        readOnlyUser.id,
        '127.0.0.1',
        'test-agent',
      );

      const readOnlyHeaders = { authorization: `Bearer ${readOnlySession.accessToken}` };

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: readOnlyHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [],
        },
      });

      // Should still work as sync is controlled by feature flag, not user settings
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should handle sync version conflicts with concurrent device updates', async () => {
      const tripId = randomUUID();

      // Initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Original',
        syncVersion: 1,
        deviceId: 'device-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Device 2 pulls data
      const pullResponse = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          lastSyncVersion: 0,
        },
      });

      expect(pullResponse.statusCode).toBe(HTTP_STATUS.OK);
      const pullData = pullResponse.json<{ syncVersion: number }>();
      expect(pullData.syncVersion).toBe(1);

      // Device 1 updates while device 2 is offline
      const device1Update: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-15',
        location: 'Updated by Device 1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-1',
        syncVersion: 2,
        syncStatus: 'local',
        deletedAt: undefined,
      };

      await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          trips: [device1Update],
        },
      });

      // Device 2 tries to push with old sync version
      const device2Update: Trip = {
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Updated by Device 2',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: undefined,
        deviceId: 'device-2',
        syncVersion: 2, // Same version, but based on old data
        syncStatus: 'local',
        deletedAt: undefined,
      };

      const conflictResponse = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2,
          trips: [device2Update],
        },
      });

      // Current implementation uses "last write wins", so it should succeed
      expect(conflictResponse.statusCode).toBe(HTTP_STATUS.OK);
    });
  });
});

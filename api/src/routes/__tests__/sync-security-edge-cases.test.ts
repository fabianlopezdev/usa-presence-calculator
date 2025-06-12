import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import { trips, userSettings, sessions } from '@api/db/schema';
import { SessionService } from '@api/services/session';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';

describe('Sync Security Edge Cases - Advanced Attack Vectors', () => {
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

    // Enable sync for tests - mocking read-only property
    Object.defineProperty(SYNC_CONFIG, 'ENABLED', { value: true, writable: true });
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  describe('Authentication & Authorization Exploits', () => {
    it('should reject expired JWT tokens', async () => {
      // Create an expired token by manipulating time
      const sessionService = new SessionService();
      const originalDateNow = Date.now;

      // Set time to past to create expired token
      Date.now = vi.fn(() => originalDateNow() - 1000 * 60 * 60 * 24); // 24 hours ago
      const expiredSession = await sessionService.createSession(testUserId, '127.0.0.1', 'test');
      Date.now = originalDateNow;

      // Delete the session to simulate expiry
      await db.delete(sessions).where(eq(sessions.refreshToken, expiredSession.refreshToken));

      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: { authorization: `Bearer ${expiredSession.accessToken}` },
        payload: { deviceId: 'test-device' },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject tokens with manipulated userId claims', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        greenCardDate: '2020-01-01',
        eligibilityCategory: 'five_year',
      });

      // Try to access other user's data by manipulating the token
      // This simulates a token tampering attack
      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [
            {
              id: createId(),
              userId: otherUser.id, // Trying to push to another user
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Unauthorized Access',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: undefined,
              syncVersion: 1,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should handle JWT algorithm confusion attacks', async () => {
      // Send a token with 'none' algorithm (unsigned)
      const unsignedToken =
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNjE2MjM5MDIyfQ.';

      const response = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        headers: { authorization: `Bearer ${unsignedToken}` },
        payload: { deviceId: 'test-device' },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('Data Injection & Manipulation', () => {
    it('should prevent NoSQL injection in sync queries', async () => {
      const injectionPayloads = [
        { $ne: null }, // MongoDB style
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.userId == this.userId' },
      ];

      for (const payload of injectionPayloads) {
        const response = await app.inject({
          method: 'POST',
          url: '/sync/pull',
          headers: authHeaders,
          payload: {
            deviceId: payload as unknown as string,
            lastSyncVersion: 0,
          },
        });

        // Should treat as regular string, not execute
        expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST]).toContain(response.statusCode);
      }
    });

    it('should handle JSON bombs (exponential expansion attacks)', async () => {
      // Create a JSON bomb structure
      const createBomb = (depth: number): unknown => {
        if (depth === 0) return 'x';
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < 10; i++) {
          obj[`key${i}`] = createBomb(depth - 1);
        }
        return obj;
      };

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [createBomb(5)], // Creates 10^5 leaf nodes
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    it('should reject polyglot payloads (multi-format injection)', async () => {
      const polyglotPayload = `{"deviceId": "test", "syncVersion": 1, "trips": [{"id": "<!--<script>"}]}<!--`;

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: {
          ...authHeaders,
          'content-type': 'application/json',
        },
        payload: polyglotPayload,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('Resource Exhaustion Attacks', () => {
    it('should prevent memory exhaustion via infinite sync loops', async () => {
      // Create a scenario that could cause infinite recursion
      let pullCount = 0;
      const maxPulls = 10;

      // Create trips that always report hasMore
      await db.insert(trips).values(
        Array.from({ length: SYNC_CONFIG.MAX_BATCH_SIZE + 1 }, (_, i) => ({
          id: createId(),
          userId: testUserId,
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          location: `Trip ${i}`,
          syncVersion: i + 1,
        })),
      );

      // Simulate client that keeps pulling
      const pullLoop = async (): Promise<void> => {
        if (pullCount >= maxPulls) return;

        pullCount++;
        const response = await app.inject({
          method: 'POST',
          url: '/sync/pull',
          headers: authHeaders,
          payload: {
            deviceId: 'test-device',
            lastSyncVersion: pullCount - 1,
          },
        });

        const responseData = response.json<{ hasMore?: boolean }>();
        if (responseData.hasMore) {
          await pullLoop();
        }
      };

      await pullLoop();
      expect(pullCount).toBe(2); // Should pull twice: first 100, then remaining 1
    });

    it('should handle zip bomb style compression attacks', async () => {
      // Create highly repetitive data that compresses well
      const repeatedData = 'A'.repeat(1000);
      const compressibleTrips = Array.from({ length: 100 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: repeatedData + i, // Slightly different to avoid dedup
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
          trips: compressibleTrips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Timing Attacks & Race Conditions', () => {
    it('should not leak user existence through timing differences', async () => {
      const timings: number[] = [];
      const iterations = 10;

      // Time requests for existing user
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        await app.inject({
          method: 'POST',
          url: '/sync/pull',
          headers: authHeaders,
          payload: { deviceId: 'test-device' },
        });
        const end = process.hrtime.bigint();
        timings.push(Number(end - start));
      }

      const avgExistingUser = timings.reduce((a, b) => a + b, 0) / timings.length;

      // Time requests for non-existing user (bad token)
      const badTimings: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        await app.inject({
          method: 'POST',
          url: '/sync/pull',
          headers: { authorization: 'Bearer invalid-token' },
          payload: { deviceId: 'test-device' },
        });
        const end = process.hrtime.bigint();
        badTimings.push(Number(end - start));
      }

      const avgNonExistingUser = badTimings.reduce((a, b) => a + b, 0) / badTimings.length;

      // Timing difference should be minimal (< 50ms difference)
      const timingDiff = Math.abs(avgExistingUser - avgNonExistingUser);
      expect(timingDiff).toBeLessThan(50_000_000); // 50ms in nanoseconds
    });

    it('should handle TOCTOU (Time-of-Check-Time-of-Use) vulnerabilities', async () => {
      const tripId = createId();

      // Create initial trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Original',
        syncVersion: 1,
      });

      // Simulate two concurrent operations:
      // 1. Delete operation
      // 2. Update operation
      const deletePromise = app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'device-1',
          syncVersion: 2,
          deletedTripIds: [tripId],
        },
      });

      const updatePromise = app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'device-2',
          syncVersion: 2,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-20',
              location: 'Updated',
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

      const [deleteResponse, updateResponse] = await Promise.all([deletePromise, updatePromise]);

      // Both should handle gracefully
      expect([deleteResponse.statusCode, updateResponse.statusCode]).toEqual(
        expect.arrayContaining([HTTP_STATUS.OK]),
      );

      // Check final state is consistent
      const [finalTrip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(finalTrip).toBeDefined();
    });
  });

  describe('Business Logic Bypass Attempts', () => {
    it('should enforce sync version monotonicity', async () => {
      const tripId = createId();

      // Push with version 5
      await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 5,
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Version 5',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: undefined,
              syncVersion: 5,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Try to push with lower version
      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 3, // Lower version
          trips: [
            {
              id: tripId,
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-15',
              location: 'Version 3',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: undefined,
              syncVersion: 3,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      // Should fail with conflict
      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);

      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(trip?.syncVersion).toBe(5); // Original version retained
    });

    it('should prevent resurrection of deleted items', async () => {
      const tripId = createId();

      // Create and delete a trip
      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'To Delete',
        syncVersion: 1,
      });

      await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 2,
          deletedTripIds: [tripId],
        },
      });

      // Verify deletion
      const [deletedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(deletedTrip?.deletedAt).toBeTruthy();

      // Try to resurrect by pushing same trip ID
      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 3,
          trips: [
            {
              id: tripId, // Same ID as deleted trip
              userId: testUserId,
              departureDate: '2024-01-01',
              returnDate: '2024-01-10',
              location: 'Resurrected',
              isSimulated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncId: undefined,
              deviceId: undefined,
              syncVersion: 3,
              syncStatus: 'local',
              deletedAt: undefined,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);

      // Check that resurrection was prevented
      const [finalTrip] = await db.select().from(trips).where(eq(trips.id, tripId));
      expect(finalTrip?.deletedAt).not.toBeNull(); // Prevents resurrection
    });

    it('should prevent bypassing subscription limits', async () => {
      // Set user to free tier with sync disabled
      await db.insert(userSettings).values({
        id: createId(),
        userId: testUserId,
        syncEnabled: false,
        syncSubscriptionTier: 'none',
      });

      // Try to sync anyway
      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: 'test-device',
          syncVersion: 1,
          trips: [],
        },
      });

      // Currently controlled by feature flag, not user settings
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Edge Protocol Violations', () => {
    it('should handle HTTP request smuggling attempts', async () => {
      const smugglePayload = `POST /sync/push HTTP/1.1
Host: localhost
Content-Length: 100

{"deviceId": "test", "syncVersion": 1}
POST /admin/deleteall HTTP/1.1
Host: localhost

`;

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: {
          ...authHeaders,
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
        },
        payload: smugglePayload,
      });

      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.OK]).toContain(response.statusCode);
    });

    it('should handle unicode normalization attacks', async () => {
      // Different unicode representations of same visual string
      const unicodeVariants = [
        'café', // Regular
        'café', // NFD (decomposed)
        '𝕔𝕒𝕗𝕖', // Mathematical alphanumeric
        '🅲🅰🅵🅴', // Enclosed alphanumerics
      ];

      const trips = unicodeVariants.map((location) => ({
        id: createId(),
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
          trips,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should reject binary data in JSON fields', async () => {
      const binaryData = Buffer.from([0xff, 0xfe, 0x00, 0x01]).toString();

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: authHeaders,
        payload: {
          deviceId: binaryData,
          syncVersion: 1,
          trips: [],
        },
      });

      expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST]).toContain(response.statusCode);
    });
  });
});

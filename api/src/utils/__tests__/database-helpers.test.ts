import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDatabase } from '@api/db/connection';
import { Trip, trips } from '@api/db/schema';
import { cleanupTestDatabase, createTestUser, resetTestDatabase } from '@api/test-utils/db';
import {
  batchInsert,
  count,
  exists,
  findOrCreate,
  paginate,
  softDelete,
  withOptimisticLocking,
} from '@api/utils/database-helpers';
import { ConflictError } from '@api/utils/errors';

describe('Database Helpers', () => {
  let testUserId: string;

  beforeEach(async () => {
    resetTestDatabase();
    const user = await createTestUser();
    testUserId = user.id;
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('paginate', () => {
    it('should paginate results with default options', async () => {
      // Create test trips
      const tripData = Array.from({ length: 25 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        returnDate: `2024-01-${String(i + 2).padStart(2, '0')}`,
        location: `Location ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await batchInsert(trips, tripData);

      const result = await paginate(trips, {}, eq(trips.userId, testUserId));

      expect(result.data).toHaveLength(20); // Default limit
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should handle custom pagination options', async () => {
      const tripData = Array.from({ length: 15 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        returnDate: `2024-01-${String(i + 2).padStart(2, '0')}`,
        location: `Location ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await batchInsert(trips, tripData);

      const result = await paginate(
        trips,
        {
          page: 2,
          limit: 5,
          orderBy: trips.departureDate,
          orderDirection: 'desc',
        },
        eq(trips.userId, testUserId),
      );

      expect(result.data).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle empty results', async () => {
      const result = await paginate(trips, {}, eq(trips.userId, 'non-existent'));

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('findOrCreate', () => {
    it('should find existing record', async () => {
      const db = getDatabase();
      const existingTrip = {
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert(trips).values(existingTrip);

      const { record, created } = await findOrCreate({
        table: trips,
        where: eq(trips.id, existingTrip.id),
        create: existingTrip,
      });

      expect(created).toBe(false);
      expect(record.id).toBe(existingTrip.id);
    });

    it('should create new record if not found', async () => {
      const newTripId = createId();
      const newTrip = {
        id: newTripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Tokyo',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { record, created } = await findOrCreate({
        table: trips,
        where: eq(trips.id, newTripId),
        create: newTrip,
      });

      expect(created).toBe(true);
      expect(record.id).toBe(newTripId);
      expect(record.location).toBe('Tokyo');
    });
  });

  describe('batchInsert', () => {
    it('should insert records in batches', async () => {
      const records = Array.from({ length: 250 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Location ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const onChunkComplete = vi.fn();

      const result = await batchInsert(trips, records, {
        chunkSize: 50,
        onChunkComplete,
      });

      expect(result.inserted).toBe(250);
      expect(onChunkComplete).toHaveBeenCalledTimes(5);
      expect(onChunkComplete).toHaveBeenLastCalledWith(250, 250);

      const count = await getDatabase().select().from(trips).where(eq(trips.userId, testUserId));
      expect(count).toHaveLength(250);
    });

    it('should handle empty array', async () => {
      const result = await batchInsert(trips, []);
      expect(result.inserted).toBe(0);
    });
  });

  describe('softDelete', () => {
    it('should soft delete records', async () => {
      const db = getDatabase();
      const tripId = createId();

      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'London',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await softDelete(trips, eq(trips.id, tripId), trips.deletedAt);

      expect(result.deleted).toBe(1);

      const [deletedTrip] = await db.select().from(trips).where(eq(trips.id, tripId));

      expect(deletedTrip.deletedAt).toBeTruthy();
    });
  });

  describe('withOptimisticLocking', () => {
    it('should update with version check', async () => {
      const db = getDatabase();
      const tripId = createId();

      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Berlin',
        isSimulated: false,
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const updated = await withOptimisticLocking<Trip>(
        trips,
        tripId,
        trips.id,
        1,
        { location: 'Berlin, Germany' },
        { versionColumn: trips.syncVersion },
      );

      expect(updated.location).toBe('Berlin, Germany');
      expect(updated.syncVersion).toBe(2);
    });

    it('should throw ConflictError on version mismatch', async () => {
      const db = getDatabase();
      const tripId = createId();

      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Rome',
        isSimulated: false,
        syncVersion: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await expect(
        withOptimisticLocking(
          trips,
          tripId,
          trips.id,
          1, // Wrong version
          { location: 'Rome, Italy' },
          { versionColumn: trips.syncVersion },
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('utility functions', () => {
    it('should check if record exists', async () => {
      const db = getDatabase();
      const tripId = createId();

      await db.insert(trips).values({
        id: tripId,
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Madrid',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const doesExist = await exists(trips, eq(trips.id, tripId));
      const doesNotExist = await exists(trips, eq(trips.id, 'non-existent'));

      expect(doesExist).toBe(true);
      expect(doesNotExist).toBe(false);
    });

    it('should count records', async () => {
      const records = Array.from({ length: 10 }, (_, i) => ({
        id: createId(),
        userId: testUserId,
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: `Location ${i}`,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await batchInsert(trips, records);

      const totalCount = await count(trips, eq(trips.userId, testUserId));
      const simulatedCount = await count(trips, eq(trips.isSimulated, true));

      expect(totalCount).toBe(10);
      expect(simulatedCount).toBe(0);
    });
  });
});

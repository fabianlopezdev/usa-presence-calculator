import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { getDatabase } from '@api/db/connection';
import * as schema from '@api/db/schema';

import {
  cleanupTestDatabase,
  createTestTrip,
  createTestUser,
  createTestUserWithTrips,
  resetTestDatabase,
} from '../db';

describe('Test Database Utilities', () => {
  beforeAll(() => {
    resetTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('resetTestDatabase', () => {
    it('should create all required tables', async () => {
      resetTestDatabase();
      const db = getDatabase();

      // Check if users table exists by trying to query it
      const users = await db.select().from(schema.users).limit(1);
      expect(users).toEqual([]);
    });
  });

  describe('cleanupTestDatabase', () => {
    it('should remove all data from tables', async () => {
      const db = getDatabase();

      // Create test data
      const user = await createTestUser();
      await createTestTrip(user.id);

      // Verify data exists
      const usersBefore = await db.select().from(schema.users);
      const tripsBefore = await db.select().from(schema.trips);
      expect(usersBefore).toHaveLength(1);
      expect(tripsBefore).toHaveLength(1);

      // Clean up
      await cleanupTestDatabase();

      // Verify data is gone
      const usersAfter = await db.select().from(schema.users);
      const tripsAfter = await db.select().from(schema.trips);
      expect(usersAfter).toHaveLength(0);
      expect(tripsAfter).toHaveLength(0);
    });
  });

  describe('createTestUser', () => {
    it('should create a user with default values', async () => {
      const user = await createTestUser();

      expect(user.id).toContain('user-');
      expect(user.email).toContain('@example.com');
      expect(user.greenCardDate).toBe('2020-01-01');
      expect(user.eligibilityCategory).toBe('five_year');
      expect(typeof user.createdAt).toBe('string');
      expect(typeof user.updatedAt).toBe('string');
    });

    it('should create a user with custom values', async () => {
      const customData = {
        email: 'custom@test.com',
        greenCardDate: '2019-06-15',
        eligibilityCategory: 'three_year' as const,
      };

      const user = await createTestUser(customData);

      expect(user).toMatchObject(customData);
    });
  });

  describe('createTestTrip', () => {
    it('should create a trip for a user', async () => {
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);

      expect(trip.id).toContain('trip-');
      expect(trip.userId).toBe(user.id);
      expect(trip.departureDate).toBe('2024-01-01');
      expect(trip.returnDate).toBe('2024-01-10');
      expect(trip.location).toBe('Test Location');
      expect(trip.isSimulated).toBe(false);
      expect(typeof trip.createdAt).toBe('string');
      expect(typeof trip.updatedAt).toBe('string');
    });

    it('should create a trip with custom values', async () => {
      const user = await createTestUser();
      const customData = {
        departureDate: '2024-03-15',
        returnDate: '2024-03-25',
        location: 'Paris, France',
        isSimulated: true,
      };

      const trip = await createTestTrip(user.id, customData);

      expect(trip).toMatchObject({
        ...customData,
        userId: user.id,
      });
    });
  });

  describe('createTestUserWithTrips', () => {
    it('should create a user with multiple trips', async () => {
      const { user, trips } = await createTestUserWithTrips(undefined, 3);

      expect(user).toBeDefined();
      expect(trips).toHaveLength(3);

      // Check trips are properly linked to user
      trips.forEach((trip, index) => {
        expect(trip.userId).toBe(user.id);
        expect(trip.departureDate).toBe(`2024-0${index + 1}-01`);
        expect(trip.returnDate).toBe(`2024-0${index + 1}-10`);
        expect(trip.location).toBe(`Location ${index + 1}`);
      });
    });

    it('should create a user with custom data and trips', async () => {
      const customUserData = {
        email: 'traveler@test.com',
        eligibilityCategory: 'three_year' as const,
      };

      const { user, trips } = await createTestUserWithTrips(customUserData, 2);

      expect(user.email).toBe('traveler@test.com');
      expect(user.eligibilityCategory).toBe('three_year');
      expect(trips).toHaveLength(2);
    });
  });

  describe('database constraints', () => {
    it('should enforce unique email constraint', async () => {
      const email = 'unique@test.com';
      await createTestUser({ email });

      await expect(createTestUser({ email })).rejects.toThrow();
    });

    it('should cascade delete trips when user is deleted', async () => {
      const db = getDatabase();
      const { user } = await createTestUserWithTrips();

      // Delete the user
      await db.delete(schema.users).where(eq(schema.users.id, user.id));

      // Check that trips were also deleted
      const remainingTrips = await db
        .select()
        .from(schema.trips)
        .where(eq(schema.trips.userId, user.id));

      expect(remainingTrips).toHaveLength(0);
    });
  });
});

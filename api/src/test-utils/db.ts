import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { createId } from '@paralleldrive/cuid2';

import { DATABASE } from '@api/constants/database';
import {
  closeDatabase,
  getDatabase,
  getSQLiteDatabase,
  initializeDatabase,
} from '@api/db/connection';
import * as schema from '@api/db/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resetTestDatabase(): void {
  closeDatabase();
  initializeDatabase();

  const db = getDatabase();
  const sqliteDb = getSQLiteDatabase();

  // Drop all tables in reverse order of dependencies
  const tableNames = [
    'sync_devices',
    'sync_metadata',
    'audit_logs',
    'encryption_keys',
    'trips',
    'user_settings',
    'auth_providers',
    'auth_attempts',
    'sessions',
    'magic_links',
    'passkeys',
    'auth_users',
    'users',
  ];

  for (const tableName of tableNames) {
    sqliteDb.exec(`DROP TABLE IF EXISTS ${tableName}`);
  }

  // Run migrations to recreate tables
  const migrationsFolder = path.join(__dirname, '..', '..', DATABASE.MIGRATION.FOLDER);
  migrate(db, { migrationsFolder });

  // Verify tables were created
  const tablesResult = sqliteDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string }>;

  if (tablesResult.length === 0) {
    throw new Error('No tables were created after migration');
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  const db = getDatabase();

  // Delete all data from tables in reverse order of dependencies
  await db.delete(schema.syncDevices);
  await db.delete(schema.syncMetadata);
  await db.delete(schema.auditLogs);
  await db.delete(schema.encryptionKeys);
  await db.delete(schema.trips);
  await db.delete(schema.userSettings);
  await db.delete(schema.authProviders);
  await db.delete(schema.authAttempts);
  await db.delete(schema.sessions);
  await db.delete(schema.magicLinks);
  await db.delete(schema.passkeys);
  await db.delete(schema.authUsers);
  await db.delete(schema.users);
}

export function setupTestDatabase(): void {
  beforeAll(() => {
    resetTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });
}

function generateTestUserId(): string {
  return createId();
}

function generateTestEmail(): string {
  return `test-${Date.now()}@example.com`;
}

function getDefaultTestUser(timestamp: string): schema.NewUser {
  return {
    id: generateTestUserId(),
    email: generateTestEmail(),
    greenCardDate: '2020-01-01',
    eligibilityCategory: 'five_year',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createTestUser(data?: Partial<schema.NewUser>): Promise<schema.User> {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  const defaults = getDefaultTestUser(timestamp);

  const userData: schema.NewUser = {
    ...defaults,
    ...data,
  };

  const [user] = await db.insert(schema.users).values(userData).returning();
  return user;
}

function generateTestTripId(): string {
  return createId();
}

function getDefaultTestTrip(userId: string, timestamp: string): schema.NewTrip {
  return {
    id: generateTestTripId(),
    userId,
    departureDate: '2024-01-01',
    returnDate: '2024-01-10',
    location: 'Test Location',
    isSimulated: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createTestTrip(
  userId: string,
  data?: Partial<schema.NewTrip>,
): Promise<schema.Trip> {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  const defaults = getDefaultTestTrip(userId, timestamp);

  const tripData: schema.NewTrip = {
    ...defaults,
    ...data,
  };

  const [trip] = await db.insert(schema.trips).values(tripData).returning();
  return trip;
}

export async function createTestUserWithTrips(
  userData?: Partial<schema.NewUser>,
  tripCount = 3,
): Promise<{ user: schema.User; trips: schema.Trip[] }> {
  const user = await createTestUser(userData);
  const trips: schema.Trip[] = [];

  for (let i = 0; i < tripCount; i++) {
    const trip = await createTestTrip(user.id, {
      departureDate: `2024-0${i + 1}-01`,
      returnDate: `2024-0${i + 1}-10`,
      location: `Location ${i + 1}`,
    });
    trips.push(trip);
  }

  return { user, trips };
}

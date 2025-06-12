import { createId } from '@paralleldrive/cuid2';
import { eq, and, inArray } from 'drizzle-orm';

import { Trip, UserSettings } from '@usa-presence/shared';

import { getDatabase } from '@api/db/connection';
import { trips, userSettings } from '@api/db/schema';
import { sanitizeTripDates } from '@api/utils/sync-validation';

interface ProcessTripResult {
  processed: number;
  error?: Error;
}

interface ProcessSettingsResult {
  processed: boolean;
  error?: Error;
}

interface ProcessDeletionsResult {
  deletedCount: number;
  error?: Error;
}

export async function processTripsInBatch(
  userId: string,
  pushTrips: Trip[],
  syncVersion: number,
): Promise<ProcessTripResult> {
  const db = getDatabase();
  let tripsProcessed = 0;

  for (const trip of pushTrips) {
    if (trip.userId !== userId) {
      return {
        processed: tripsProcessed,
        error: new Error('FORBIDDEN: Cannot modify other users data'),
      };
    }

    let sanitizedTrip;
    try {
      sanitizedTrip = sanitizeTripDates(trip);
    } catch (error) {
      return {
        processed: tripsProcessed,
        error: new Error(
          `INVALID_TRIP_DATA: ${error instanceof Error ? error.message : 'Invalid trip data'}`,
        ),
      };
    }

    if (!sanitizedTrip.id || !sanitizedTrip.departureDate || !sanitizedTrip.returnDate) {
      return {
        processed: tripsProcessed,
        error: new Error('MISSING_REQUIRED_FIELDS: Missing required trip fields'),
      };
    }

    const [existingTrip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, sanitizedTrip.id as string), eq(trips.userId, userId)));

    if (existingTrip) {
      await updateExistingTrip(db, sanitizedTrip, userId, syncVersion);
    } else {
      await createNewTrip(db, sanitizedTrip, userId, syncVersion);
    }
    tripsProcessed++;
  }

  return { processed: tripsProcessed };
}

async function updateExistingTrip(
  db: ReturnType<typeof getDatabase>,
  sanitizedTrip: Record<string, unknown>,
  userId: string,
  syncVersion: number,
): Promise<void> {
  await db
    .update(trips)
    .set({
      departureDate: sanitizedTrip.departureDate as string,
      returnDate: sanitizedTrip.returnDate as string,
      location: sanitizedTrip.location as string | undefined,
      isSimulated: sanitizedTrip.isSimulated as boolean | undefined,
      syncId: sanitizedTrip.syncId as string | undefined,
      deviceId: sanitizedTrip.deviceId as string | undefined,
      syncVersion,
      syncStatus:
        (sanitizedTrip.syncStatus as 'local' | 'pending' | 'synced' | null | undefined) || 'local',
      deletedAt: sanitizedTrip.deletedAt as string | undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(trips.id, sanitizedTrip.id as string), eq(trips.userId, userId)));
}

async function createNewTrip(
  db: ReturnType<typeof getDatabase>,
  sanitizedTrip: Record<string, unknown>,
  userId: string,
  syncVersion: number,
): Promise<void> {
  await db.insert(trips).values({
    id: sanitizedTrip.id as string,
    userId,
    departureDate: sanitizedTrip.departureDate as string,
    returnDate: sanitizedTrip.returnDate as string,
    location: sanitizedTrip.location as string | undefined,
    isSimulated: (sanitizedTrip.isSimulated as boolean) || false,
    syncId: sanitizedTrip.syncId as string | undefined,
    deviceId: sanitizedTrip.deviceId as string | undefined,
    syncVersion,
    syncStatus:
      (sanitizedTrip.syncStatus as 'local' | 'pending' | 'synced' | null | undefined) || 'local',
    deletedAt: sanitizedTrip.deletedAt as string | undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function processUserSettings(
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
): Promise<ProcessSettingsResult> {
  const db = getDatabase();
  const [existingSettings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (existingSettings) {
    await updateExistingSettings(db, userId, pushSettings, syncVersion);
  } else {
    await createNewSettings(db, userId, pushSettings, syncVersion);
  }

  return { processed: true };
}

async function updateExistingSettings(
  db: ReturnType<typeof getDatabase>,
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
): Promise<void> {
  await db
    .update(userSettings)
    .set({
      notificationMilestones: pushSettings.notifications?.milestones,
      notificationWarnings: pushSettings.notifications?.warnings,
      notificationReminders: pushSettings.notifications?.reminders,
      biometricAuthEnabled: pushSettings.biometricAuthEnabled,
      theme: pushSettings.theme,
      language: pushSettings.language,
      syncEnabled: pushSettings.sync?.enabled,
      syncSubscriptionTier: pushSettings.sync?.subscriptionTier,
      syncLastSyncAt: pushSettings.sync?.lastSyncAt,
      syncDeviceId: pushSettings.sync?.deviceId,
      syncVersion,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSettings.userId, userId));
}

async function createNewSettings(
  db: ReturnType<typeof getDatabase>,
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
): Promise<void> {
  const settingsData = buildNewSettingsData(userId, pushSettings, syncVersion);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  await db.insert(userSettings).values(settingsData as any);
}

function buildNewSettingsData(
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
): Record<string, unknown> {
  const timestamp = new Date().toISOString();
  const defaultSettings = getDefaultSettings();

  const notificationSettings = buildNotificationSettings(pushSettings, defaultSettings);
  const syncSettings = buildSyncSettings(pushSettings, defaultSettings);
  const uiSettings = buildUISettings(pushSettings, defaultSettings);

  return {
    id: createId(),
    userId,
    ...notificationSettings,
    ...uiSettings,
    ...syncSettings,
    syncVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildNotificationSettings(
  pushSettings: UserSettings,
  defaultSettings: ReturnType<typeof getDefaultSettings>,
): Record<string, unknown> {
  return {
    notificationMilestones:
      pushSettings.notifications?.milestones ?? defaultSettings.notificationMilestones,
    notificationWarnings:
      pushSettings.notifications?.warnings ?? defaultSettings.notificationWarnings,
    notificationReminders:
      pushSettings.notifications?.reminders ?? defaultSettings.notificationReminders,
  };
}

function buildSyncSettings(
  pushSettings: UserSettings,
  defaultSettings: ReturnType<typeof getDefaultSettings>,
): Record<string, unknown> {
  return {
    syncEnabled: pushSettings.sync?.enabled ?? defaultSettings.syncEnabled,
    syncSubscriptionTier:
      pushSettings.sync?.subscriptionTier ?? defaultSettings.syncSubscriptionTier,
    syncLastSyncAt: pushSettings.sync?.lastSyncAt,
    syncDeviceId: pushSettings.sync?.deviceId,
  };
}

function buildUISettings(
  pushSettings: UserSettings,
  defaultSettings: ReturnType<typeof getDefaultSettings>,
): Record<string, unknown> {
  return {
    biometricAuthEnabled: pushSettings.biometricAuthEnabled ?? defaultSettings.biometricAuthEnabled,
    theme: pushSettings.theme ?? defaultSettings.theme,
    language: pushSettings.language ?? defaultSettings.language,
  };
}

function getDefaultSettings(): {
  notificationMilestones: boolean;
  notificationWarnings: boolean;
  notificationReminders: boolean;
  biometricAuthEnabled: boolean;
  theme: string;
  language: string;
  syncEnabled: boolean;
  syncSubscriptionTier: string;
} {
  return {
    notificationMilestones: true,
    notificationWarnings: true,
    notificationReminders: true,
    biometricAuthEnabled: false,
    theme: 'system',
    language: 'en',
    syncEnabled: false,
    syncSubscriptionTier: 'none',
  };
}

export async function processDeletions(
  userId: string,
  deletedTripIds: string[],
  syncVersion: number,
): Promise<ProcessDeletionsResult> {
  const db = getDatabase();
  await db
    .update(trips)
    .set({
      deletedAt: new Date().toISOString(),
      syncVersion,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(trips.userId, userId), inArray(trips.id, deletedTripIds)));

  return { deletedCount: deletedTripIds.length };
}

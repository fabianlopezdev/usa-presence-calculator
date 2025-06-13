import { createId } from '@paralleldrive/cuid2';
import { and, eq, inArray } from 'drizzle-orm';

import { UserSettings } from '@usa-presence/shared';

import { getDatabase } from '@api/db/connection';
import { trips, userSettings } from '@api/db/schema';
import {
  buildNotificationSettings,
  buildSyncSettings,
  buildUISettings,
  getDefaultSettings,
} from '@api/services/sync-service-helpers';

export async function updateExistingTrip(
  sanitizedTrip: Record<string, unknown>,
  userId: string,
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
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

export async function createNewTrip(
  sanitizedTrip: Record<string, unknown>,
  userId: string,
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
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

export async function updateExistingSettings(
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
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

export async function createNewSettings(
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
  const settingsData = buildNewSettingsData(userId, pushSettings, syncVersion);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  await db.insert(userSettings).values(settingsData as any);
}

export async function processDeletions(
  userId: string,
  deletedTripIds: string[],
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
  await db
    .update(trips)
    .set({
      deletedAt: new Date().toISOString(),
      syncVersion,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(trips.userId, userId), inArray(trips.id, deletedTripIds)));
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

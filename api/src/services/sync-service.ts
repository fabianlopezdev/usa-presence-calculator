import { createId } from '@paralleldrive/cuid2';
import { and, eq, gt, inArray } from 'drizzle-orm';

import { Trip, UserSettings } from '@usa-presence/shared';

import { SYNC_CONFIG } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import { trips, userSettings } from '@api/db/schema';
import {
  ConflictDetectionResult,
  SyncConflictDetection,
} from '@api/services/sync-conflict-detection';
import {
  buildSettingsData,
  transformSettingsToUserSettings,
} from '@api/services/sync-settings-helpers';
import { processSingleTrip } from '@api/services/sync-trip-helpers';

// ===== TYPES =====
export interface ProcessTripResult {
  processed: number;
  error?: Error;
}
export interface ProcessSettingsResult {
  processed: boolean;
  error?: Error;
}
export interface ProcessDeletionsResult {
  deletedCount: number;
  error?: Error;
}

// ===== MAIN SERVICE CLASS =====
export class SyncService {
  private conflictDetection = new SyncConflictDetection();

  private get db(): ReturnType<typeof getDatabase> {
    return getDatabase();
  }

  // ===== PULL OPERATIONS =====

  async fetchTripsForPull(userId: string, lastSyncVersion?: number): Promise<Trip[]> {
    const conditions = [eq(trips.userId, userId)];

    if (lastSyncVersion !== undefined) {
      conditions.push(gt(trips.syncVersion, lastSyncVersion));
    }

    const userTrips = await this.db
      .select()
      .from(trips)
      .where(and(...conditions))
      .orderBy(trips.syncVersion)
      .limit(Number(SYNC_CONFIG.MAX_TRIPS_PER_SYNC));

    return userTrips.map((trip) => ({
      id: trip.id,
      userId: trip.userId,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      location: trip.location || undefined,
      isSimulated: trip.isSimulated,
      syncId: trip.syncId || undefined,
      deviceId: trip.deviceId || undefined,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt || trip.createdAt,
      deletedAt: trip.deletedAt || undefined,
      syncVersion: trip.syncVersion || 0,
      syncStatus: trip.syncStatus || 'local',
    }));
  }

  async fetchUserSettingsForPull(
    userId: string,
  ): Promise<(UserSettings & { userId: string }) | null> {
    const [settings] = await this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (!settings) {
      return null;
    }

    return transformSettingsToUserSettings(settings);
  }

  // ===== PUSH OPERATIONS =====

  async processTripsInBatch(
    userId: string,
    pushTrips: Trip[],
    syncVersion: number,
  ): Promise<ProcessTripResult> {
    let tripsProcessed = 0;

    for (const trip of pushTrips) {
      const result = await processSingleTrip(trip, userId, syncVersion);
      if (!result.success && result.error) {
        return { processed: tripsProcessed, error: result.error };
      }
      tripsProcessed++;
    }

    return { processed: tripsProcessed };
  }

  async processUserSettings(
    userId: string,
    pushSettings: UserSettings,
    syncVersion: number,
  ): Promise<ProcessSettingsResult> {
    const [existingSettings] = await this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (existingSettings) {
      await this.updateExistingSettings(userId, pushSettings, syncVersion);
    } else {
      await this.createNewSettings(userId, pushSettings, syncVersion);
    }

    return { processed: true };
  }

  async processDeletions(
    userId: string,
    deletedTripIds: string[],
    syncVersion: number,
  ): Promise<ProcessDeletionsResult> {
    await this.db
      .update(trips)
      .set({
        deletedAt: new Date().toISOString(),
        syncVersion,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(trips.userId, userId), inArray(trips.id, deletedTripIds)));

    return { deletedCount: deletedTripIds.length };
  }

  // ===== CONFLICT DETECTION (DELEGATED) =====
  async detectTripConflicts(
    userId: string,
    incomingTrips: Trip[],
    baseVersion: number,
  ): Promise<ConflictDetectionResult> {
    return this.conflictDetection.detectTripConflicts(userId, incomingTrips, baseVersion);
  }

  async detectUserSettingsConflict(
    userId: string,
    incomingSettings: UserSettings,
    baseVersion: number,
  ): Promise<unknown> {
    return this.conflictDetection.detectUserSettingsConflict(userId, incomingSettings, baseVersion);
  }

  async detectDeleteConflicts(
    userId: string,
    deletedTripIds: string[],
    baseVersion: number,
  ): Promise<unknown[]> {
    return this.conflictDetection.detectDeleteConflicts(userId, deletedTripIds, baseVersion);
  }

  // ===== HELPER METHODS =====
  async getCurrentSyncVersion(userId: string): Promise<number> {
    const tripMaxVersion = await this.db
      .select({ maxVersion: trips.syncVersion })
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(trips.syncVersion)
      .limit(1);

    const settingsVersion = await this.db
      .select({ version: userSettings.syncVersion })
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    const maxTripVersion = tripMaxVersion[0]?.maxVersion || 0;
    const maxSettingsVersion = settingsVersion[0]?.version || 0;

    return Math.max(maxTripVersion, maxSettingsVersion);
  }

  private async updateExistingSettings(
    userId: string,
    pushSettings: UserSettings,
    syncVersion: number,
  ): Promise<void> {
    await this.db
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

  private async createNewSettings(
    userId: string,
    pushSettings: UserSettings,
    syncVersion: number,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const settingsData = {
      ...buildSettingsData(userId, pushSettings, syncVersion, timestamp),
      id: createId(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    await this.db.insert(userSettings).values(settingsData as any);
  }
}
export const syncService = new SyncService();

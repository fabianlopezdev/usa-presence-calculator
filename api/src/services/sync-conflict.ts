import { eq, and } from 'drizzle-orm';

import { SyncConflict, Trip, UserSettings } from '@usa-presence/shared';

import { getDatabase } from '@api/db/connection';
import { trips, userSettings } from '@api/db/schema';
import {
  detectNotificationConflicts,
  detectUIConflicts,
  transformSettingsToUserSettings,
} from '@api/services/sync-conflict-helpers';

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: SyncConflict[];
  nonConflictingTrips: Trip[];
}

export class SyncConflictService {
  private db = getDatabase();

  async detectTripConflicts(
    userId: string,
    incomingTrips: Trip[],
    baseVersion: number,
  ): Promise<ConflictDetectionResult> {
    const conflicts: SyncConflict[] = [];
    const nonConflictingTrips: Trip[] = [];

    for (const incomingTrip of incomingTrips) {
      const result = await this.checkSingleTripConflict(userId, incomingTrip, baseVersion);

      if (result.conflict) {
        conflicts.push(result.conflict);
      } else {
        nonConflictingTrips.push(incomingTrip);
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      nonConflictingTrips,
    };
  }

  private async checkSingleTripConflict(
    userId: string,
    incomingTrip: Trip,
    baseVersion: number,
  ): Promise<{ conflict?: SyncConflict }> {
    const [currentTrip] = await this.db
      .select()
      .from(trips)
      .where(and(eq(trips.id, incomingTrip.id), eq(trips.userId, userId)));

    if (!currentTrip) {
      return {}; // New trip, no conflict
    }

    if (currentTrip.deletedAt) {
      return {
        conflict: this.createDeleteUpdateConflict(incomingTrip, currentTrip, baseVersion),
      };
    }

    const versionConflict = this.checkVersionConflict(incomingTrip, currentTrip, baseVersion);
    return versionConflict ? { conflict: versionConflict } : {};
  }

  private createDeleteUpdateConflict(
    incomingTrip: Trip,
    currentTrip: typeof trips.$inferSelect,
    baseVersion: number,
  ): SyncConflict {
    return {
      entityType: 'trip',
      entityId: incomingTrip.id,
      conflictType: 'delete_update',
      serverVersion: currentTrip,
      localVersion: {
        data: incomingTrip as Record<string, unknown>,
        syncVersion: incomingTrip.syncVersion || baseVersion,
        modifiedAt: incomingTrip.updatedAt,
        deviceId: incomingTrip.deviceId || '',
      },
    };
  }

  private checkVersionConflict(
    incomingTrip: Trip,
    currentTrip: typeof trips.$inferSelect,
    baseVersion: number,
  ): SyncConflict | null {
    const incomingBaseVersion = incomingTrip.syncVersion || 0;
    const currentVersion = currentTrip.syncVersion || 0;

    if (currentVersion <= incomingBaseVersion) {
      return null; // No conflict
    }

    const conflictingFields = this.detectConflictingFields(incomingTrip, currentTrip);

    return {
      entityType: 'trip',
      entityId: incomingTrip.id,
      conflictType: 'update_update',
      conflictingFields,
      serverVersion: currentTrip,
      localVersion: {
        data: incomingTrip as Record<string, unknown>,
        syncVersion: incomingTrip.syncVersion || baseVersion,
        modifiedAt: incomingTrip.updatedAt,
        deviceId: incomingTrip.deviceId || '',
      },
      remoteVersion: {
        data: currentTrip as Record<string, unknown>,
        syncVersion: currentTrip.syncVersion || 0,
        modifiedAt: currentTrip.updatedAt || new Date().toISOString(),
        deviceId: currentTrip.deviceId || '',
      },
    };
  }

  async detectUserSettingsConflict(
    userId: string,
    incomingSettings: UserSettings,
    baseVersion: number,
  ): Promise<SyncConflict | null> {
    const [currentSettings] = await this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (!currentSettings) {
      // No existing settings, no conflict
      return null;
    }

    const currentVersion = currentSettings.syncVersion || 0;

    // Check if versions conflict - settings were updated since the base version
    if (currentVersion > baseVersion) {
      // Another device has updated settings
      const conflictingFields = this.detectSettingsConflictingFields(
        incomingSettings,
        currentSettings,
      );

      return {
        entityType: 'user_settings',
        entityId: userId,
        conflictType: 'update_update',
        conflictingFields,
        localVersion: {
          data: incomingSettings as Record<string, unknown>,
          syncVersion: baseVersion,
          modifiedAt: new Date().toISOString(),
          deviceId: incomingSettings.sync?.deviceId || '',
        },
        remoteVersion: {
          data: transformSettingsToUserSettings(currentSettings),
          syncVersion: currentSettings.syncVersion || 0,
          modifiedAt: currentSettings.updatedAt || new Date().toISOString(),
          deviceId: currentSettings.syncDeviceId || '',
        },
      };
    }

    return null;
  }

  async detectDeleteConflicts(
    userId: string,
    deletedTripIds: string[],
    baseVersion: number,
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    for (const tripId of deletedTripIds) {
      const [currentTrip] = await this.db
        .select()
        .from(trips)
        .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));

      if (!currentTrip) {
        // Trip doesn't exist, no conflict
        continue;
      }

      // Check if trip was modified after base version
      if (
        currentTrip.syncVersion &&
        currentTrip.syncVersion > baseVersion &&
        !currentTrip.deletedAt
      ) {
        conflicts.push({
          entityType: 'trip',
          entityId: tripId,
          conflictType: 'delete_update',
          serverVersion: currentTrip,
          remoteVersion: {
            data: currentTrip as Record<string, unknown>,
            syncVersion: currentTrip.syncVersion || 0,
            modifiedAt: currentTrip.updatedAt || new Date().toISOString(),
            deviceId: currentTrip.deviceId || '',
          },
        });
      }
    }

    return conflicts;
  }

  private detectConflictingFields(
    incoming: Trip,
    current: {
      departureDate?: string | null;
      returnDate?: string | null;
      location?: string | null;
      isSimulated?: boolean | null;
    },
  ): string[] {
    const fields: string[] = [];

    if (incoming.departureDate !== current.departureDate) fields.push('departureDate');
    if (incoming.returnDate !== current.returnDate) fields.push('returnDate');
    if (incoming.location !== current.location) fields.push('location');
    if (incoming.isSimulated !== current.isSimulated) fields.push('isSimulated');

    return fields;
  }

  private detectSettingsConflictingFields(
    incoming: UserSettings,
    current: {
      notificationMilestones?: boolean | null;
      notificationWarnings?: boolean | null;
      notificationReminders?: boolean | null;
      biometricAuthEnabled?: boolean | null;
      theme?: string | null;
      language?: string | null;
    },
  ): string[] {
    const fields: string[] = [];

    const notificationFields = detectNotificationConflicts(incoming, current);
    const uiFields = detectUIConflicts(incoming, current);

    return [...fields, ...notificationFields, ...uiFields];
  }
}

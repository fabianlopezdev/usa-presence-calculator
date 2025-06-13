import { and, eq } from 'drizzle-orm';

import { SyncConflict, Trip, UserSettings } from '@usa-presence/shared';

import { getDatabase } from '@api/db/connection';
import { trips, userSettings } from '@api/db/schema';
import { transformSettingsToUserSettings } from '@api/services/sync-settings-helpers';

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: SyncConflict[];
  nonConflictingTrips: Trip[];
}

export class SyncConflictDetection {
  private get db(): ReturnType<typeof getDatabase> {
    return getDatabase();
  }

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
      return null;
    }

    const currentVersion = currentSettings.syncVersion || 0;

    if (currentVersion > baseVersion) {
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
        continue;
      }

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
      return {};
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
      return null;
    }

    const conflictingFields = this.detectTripConflictingFields(incomingTrip, currentTrip);

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

  private detectTripConflictingFields(
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
    current: typeof userSettings.$inferSelect,
  ): string[] {
    const fields: string[] = [];

    // Notification conflicts
    if (incoming.notifications?.milestones !== current.notificationMilestones) {
      fields.push('notifications.milestones');
    }
    if (incoming.notifications?.warnings !== current.notificationWarnings) {
      fields.push('notifications.warnings');
    }
    if (incoming.notifications?.reminders !== current.notificationReminders) {
      fields.push('notifications.reminders');
    }

    // UI conflicts
    if (incoming.biometricAuthEnabled !== current.biometricAuthEnabled) {
      fields.push('biometricAuthEnabled');
    }
    if (incoming.theme !== current.theme) {
      fields.push('theme');
    }
    if (incoming.language !== current.language) {
      fields.push('language');
    }

    return fields;
  }
}

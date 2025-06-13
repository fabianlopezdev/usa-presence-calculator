import { Trip, UserSettings } from '@usa-presence/shared';

import { syncService } from '@api/services/sync-service';

interface SyncPushData {
  syncVersion: number;
  trips?: Trip[];
  userSettings?: UserSettings;
  deletedTripIds?: string[];
  forceOverwrite?: boolean;
  applyNonConflicting?: boolean;
}

export async function detectAllConflicts(
  userId: string,
  pushData: SyncPushData,
): Promise<unknown[]> {
  const conflicts = [];

  // Check trip conflicts
  if (pushData.trips && pushData.trips.length > 0) {
    const tripConflicts = await syncService.detectTripConflicts(
      userId,
      pushData.trips,
      pushData.syncVersion,
    );
    if (tripConflicts.hasConflicts) {
      conflicts.push(...tripConflicts.conflicts);
    }
  }

  // Check settings conflicts
  if (pushData.userSettings) {
    const settingsConflict = await syncService.detectUserSettingsConflict(
      userId,
      pushData.userSettings,
      pushData.syncVersion,
    );
    if (settingsConflict) {
      conflicts.push(settingsConflict);
    }
  }

  // Check delete conflicts
  if (pushData.deletedTripIds && pushData.deletedTripIds.length > 0) {
    const deleteConflicts = await syncService.detectDeleteConflicts(
      userId,
      pushData.deletedTripIds,
      pushData.syncVersion,
    );
    conflicts.push(...deleteConflicts);
  }

  return conflicts;
}

export async function filterNonConflictingData(
  userId: string,
  pushData: SyncPushData,
  conflicts: unknown[],
): Promise<{
  trips?: Trip[];
  settings?: UserSettings;
  deletedIds?: string[];
  conflicts?: unknown[];
}> {
  let nonConflictingTrips = pushData.trips || [];
  let hasSettingsConflict = false;

  // Filter non-conflicting trips
  if (pushData.trips && pushData.trips.length > 0) {
    const tripConflicts = await syncService.detectTripConflicts(
      userId,
      pushData.trips,
      pushData.syncVersion,
    );
    nonConflictingTrips = tripConflicts.nonConflictingTrips;
  }

  // Check if settings have conflicts
  if (pushData.userSettings) {
    const settingsConflict = await syncService.detectUserSettingsConflict(
      userId,
      pushData.userSettings,
      pushData.syncVersion,
    );
    hasSettingsConflict = settingsConflict !== null;
  }

  return {
    trips: nonConflictingTrips,
    settings: hasSettingsConflict ? undefined : pushData.userSettings,
    deletedIds: pushData.deletedTripIds,
    conflicts,
  };
}

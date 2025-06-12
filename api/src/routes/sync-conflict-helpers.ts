import { SyncConflict, Trip, UserSettings } from '@usa-presence/shared';

import { SyncConflictService } from '@api/services/sync-conflict';

export async function detectSyncConflicts(
  userId: string,
  syncVersion: number,
  pushTrips?: Trip[],
  pushSettings?: UserSettings,
  deletedTripIds?: string[],
): Promise<{
  conflicts: SyncConflict[];
  nonConflictingTrips: Trip[];
  hasSettingsConflict: boolean;
  nonConflictingDeleteIds: string[];
}> {
  const conflictService = new SyncConflictService();
  const baseVersion = syncVersion - 1;

  const tripResult = await detectTripConflictsIfNeeded(
    conflictService,
    userId,
    pushTrips,
    baseVersion,
  );

  const settingsResult = await detectSettingsConflictIfNeeded(
    conflictService,
    userId,
    pushSettings,
    baseVersion,
  );

  const deleteResult = await detectDeleteConflictsIfNeeded(
    conflictService,
    userId,
    deletedTripIds,
    baseVersion,
  );

  return {
    conflicts: [...tripResult.conflicts, ...settingsResult.conflicts, ...deleteResult.conflicts],
    nonConflictingTrips: tripResult.nonConflictingTrips,
    hasSettingsConflict: settingsResult.hasConflict,
    nonConflictingDeleteIds: deleteResult.nonConflictingDeleteIds,
  };
}

async function detectTripConflictsIfNeeded(
  conflictService: SyncConflictService,
  userId: string,
  pushTrips: Trip[] | undefined,
  baseVersion: number,
): Promise<{ conflicts: SyncConflict[]; nonConflictingTrips: Trip[] }> {
  if (!pushTrips || pushTrips.length === 0) {
    return { conflicts: [], nonConflictingTrips: [] };
  }

  const result = await conflictService.detectTripConflicts(userId, pushTrips, baseVersion);

  return {
    conflicts: result.hasConflicts ? result.conflicts : [],
    nonConflictingTrips: result.hasConflicts ? result.nonConflictingTrips : pushTrips,
  };
}

async function detectSettingsConflictIfNeeded(
  conflictService: SyncConflictService,
  userId: string,
  pushSettings: UserSettings | undefined,
  baseVersion: number,
): Promise<{ conflicts: SyncConflict[]; hasConflict: boolean }> {
  if (!pushSettings) {
    return { conflicts: [], hasConflict: false };
  }

  const conflict = await conflictService.detectUserSettingsConflict(
    userId,
    pushSettings,
    baseVersion,
  );

  return {
    conflicts: conflict ? [conflict] : [],
    hasConflict: !!conflict,
  };
}

async function detectDeleteConflictsIfNeeded(
  conflictService: SyncConflictService,
  userId: string,
  deletedTripIds: string[] | undefined,
  baseVersion: number,
): Promise<{ conflicts: SyncConflict[]; nonConflictingDeleteIds: string[] }> {
  if (!deletedTripIds || deletedTripIds.length === 0) {
    return { conflicts: [], nonConflictingDeleteIds: [] };
  }

  const conflicts = await conflictService.detectDeleteConflicts(
    userId,
    deletedTripIds,
    baseVersion,
  );

  if (conflicts.length === 0) {
    return { conflicts: [], nonConflictingDeleteIds: deletedTripIds };
  }

  const conflictingIds = conflicts.map((c) => c.entityId);
  const nonConflictingIds = deletedTripIds.filter((id) => !conflictingIds.includes(id));

  return { conflicts, nonConflictingDeleteIds: nonConflictingIds };
}

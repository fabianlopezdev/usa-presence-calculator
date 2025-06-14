import { Trip, UserSettings } from '@usa-presence/shared';

import {
  buildFinalResponse,
  createConflictResponse,
  SyncPushResult,
} from '@api/routes/sync-response-builders';
import { syncService } from '@api/services/sync-service';
import { withTransaction } from '@api/utils/database-transaction';

// ===== TYPES =====

interface SyncPushData {
  syncVersion: number;
  trips?: Trip[];
  userSettings?: UserSettings;
  deletedTripIds?: string[];
  forceOverwrite?: boolean;
  applyNonConflicting?: boolean;
}

// ===== SYNC PULL EXECUTION =====

export async function executeSyncPull(
  userId: string,
  lastSyncVersion?: number,
  entityTypes?: string[],
): Promise<{
  syncVersion: number;
  trips: Trip[];
  userSettings: UserSettings | null;
  hasMore: boolean;
}> {
  const shouldSyncTrips = !entityTypes || entityTypes.includes('trips');
  const shouldSyncSettings = !entityTypes || entityTypes.includes('user_settings');

  let trips: Trip[] = [];
  let userSettings: UserSettings | null = null;
  let hasMore = false;

  if (shouldSyncTrips) {
    const fetchedTrips = await syncService.fetchTripsForPull(userId, lastSyncVersion);
    trips = fetchedTrips;
    hasMore = syncService.getLastFetchHadMore();
  }

  if (shouldSyncSettings && !hasMore) {
    userSettings = await syncService.fetchUserSettingsForPull(userId);
  }

  // For sync version, if we have trips, use the highest version from returned trips
  // Otherwise use the global max version
  let syncVersion: number;
  if (trips.length > 0) {
    const maxTripVersion = Math.max(...trips.map((t) => t.syncVersion || 0));
    syncVersion = maxTripVersion;
  } else {
    syncVersion = await syncService.getCurrentSyncVersion(userId);
  }

  return { syncVersion, trips, userSettings, hasMore };
}

// ===== SYNC PUSH EXECUTION =====

export async function executeSyncPush(
  userId: string,
  pushData: SyncPushData,
): Promise<SyncPushResult> {
  const processedData = await prepareDataForSync(userId, pushData);

  if (processedData.earlyReturn) {
    return processedData.earlyReturn;
  }

  const transactionResult = await withTransaction(async () => {
    const results = await processSyncOperations(
      userId,
      pushData.syncVersion,
      processedData.trips,
      processedData.settings,
      processedData.deletedIds,
    );

    return {
      syncVersion: pushData.syncVersion,
      syncedEntities: results,
    };
  });

  return buildFinalResponse(pushData, transactionResult, processedData.conflicts);
}

// ===== DATA PREPARATION =====

async function prepareDataForSync(
  userId: string,
  pushData: SyncPushData,
): Promise<{
  trips?: Trip[];
  settings?: UserSettings;
  deletedIds?: string[];
  earlyReturn?: SyncPushResult;
  conflicts?: unknown[];
}> {
  if (pushData.forceOverwrite) {
    return {
      trips: pushData.trips,
      settings: pushData.userSettings,
      deletedIds: pushData.deletedTripIds,
    };
  }

  const conflicts = await detectAllConflicts(userId, pushData);

  if (conflicts.length === 0) {
    return {
      trips: pushData.trips,
      settings: pushData.userSettings,
      deletedIds: pushData.deletedTripIds,
    };
  }

  if (!pushData.applyNonConflicting) {
    return {
      earlyReturn: createConflictResponse(pushData, conflicts),
    };
  }

  return await filterNonConflictingData(userId, pushData, conflicts);
}

async function detectAllConflicts(userId: string, pushData: SyncPushData): Promise<unknown[]> {
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
      pushData.syncVersion - 1, // Use previous version as base
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

async function filterNonConflictingData(
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
      pushData.syncVersion - 1, // Use previous version as base
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

// ===== SYNC OPERATIONS =====

async function processSyncOperations(
  userId: string,
  syncVersion: number,
  pushTrips?: Trip[],
  pushSettings?: UserSettings,
  deletedTripIds?: string[],
): Promise<{
  trips: number;
  userSettings: boolean;
  deletedTrips: number;
}> {
  let tripsProcessed = 0;
  let settingsProcessed = false;
  let deletedCount = 0;

  if (pushTrips && pushTrips.length > 0) {
    const tripResult = await syncService.processTripsInBatch(userId, pushTrips, syncVersion);
    if (tripResult.error) {
      throw tripResult.error;
    }
    tripsProcessed = tripResult.processed;
  }

  if (pushSettings) {
    const settingsResult = await syncService.processUserSettings(userId, pushSettings, syncVersion);
    if (settingsResult.error) {
      throw settingsResult.error;
    }
    settingsProcessed = settingsResult.processed;
  }

  if (deletedTripIds && deletedTripIds.length > 0) {
    const deleteResult = await syncService.processDeletions(userId, deletedTripIds, syncVersion);
    if (deleteResult.error) {
      throw deleteResult.error;
    }
    deletedCount = deleteResult.deletedCount;
  }

  return {
    trips: tripsProcessed,
    userSettings: settingsProcessed,
    deletedTrips: deletedCount,
  };
}

import { Trip, UserSettings } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';
import { detectSyncConflicts } from '@api/routes/sync-conflict-helpers';
import {
  processDeletions,
  processTripsInBatch,
  processUserSettings,
} from '@api/routes/sync-push-helpers';
import { withTransaction } from '@api/utils/database-transaction';

interface SyncPushData {
  syncVersion: number;
  trips?: Trip[];
  userSettings?: UserSettings;
  deletedTripIds?: string[];
  forceOverwrite?: boolean;
  applyNonConflicting?: boolean;
}

interface SyncPushResult {
  response: {
    syncVersion: number;
    syncedEntities: {
      trips: number;
      userSettings: boolean;
      deletedTrips: number;
    };
  };
  hasConflicts: boolean;
  conflicts?: unknown[];
  statusCode: number;
  errorMessage?: string;
  errorCode?: string;
  syncedEntities?: unknown;
}

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
    } as {
      syncVersion: number;
      syncedEntities: { trips: number; userSettings: boolean; deletedTrips: number };
    };
  });

  return handlePostTransactionConflicts(
    userId,
    pushData,
    transactionResult,
    processedData.conflicts,
  );
}

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
    return getOriginalData(pushData);
  }

  const conflictResult = await detectSyncConflicts(
    userId,
    pushData.syncVersion,
    pushData.trips,
    pushData.userSettings,
    pushData.deletedTripIds,
  );

  if (conflictResult.conflicts.length === 0) {
    return getOriginalData(pushData);
  }

  if (!pushData.applyNonConflicting) {
    return createConflictEarlyReturn(pushData, conflictResult);
  }

  return {
    trips: conflictResult.nonConflictingTrips,
    settings: conflictResult.hasSettingsConflict ? undefined : pushData.userSettings,
    deletedIds: conflictResult.nonConflictingDeleteIds,
    conflicts: conflictResult.conflicts,
  };
}

function getOriginalData(pushData: SyncPushData): {
  trips?: Trip[];
  settings?: UserSettings;
  deletedIds?: string[];
} {
  return {
    trips: pushData.trips,
    settings: pushData.userSettings,
    deletedIds: pushData.deletedTripIds,
  };
}

function createConflictEarlyReturn(
  pushData: SyncPushData,
  conflictResult: { conflicts: unknown[] },
): { earlyReturn: SyncPushResult } {
  return {
    earlyReturn: {
      response: {
        syncVersion: pushData.syncVersion,
        syncedEntities: { trips: 0, userSettings: false, deletedTrips: 0 },
      },
      hasConflicts: true,
      conflicts: conflictResult.conflicts,
      statusCode: HTTP_STATUS.CONFLICT,
      errorMessage: 'Sync conflicts detected',
      errorCode: 'SYNC_CONFLICT',
    },
  };
}

function handlePostTransactionConflicts(
  _userId: string,
  pushData: SyncPushData,
  transactionResult: {
    syncVersion: number;
    syncedEntities: { trips: number; userSettings: boolean; deletedTrips: number };
  },
  existingConflicts?: unknown[],
): SyncPushResult {
  if (!pushData.applyNonConflicting || pushData.forceOverwrite) {
    return {
      response: transactionResult,
      hasConflicts: false,
      statusCode: HTTP_STATUS.OK,
    };
  }

  // If we have conflicts from the initial check and applyNonConflicting was true,
  // return them with the partial success status
  if (existingConflicts && existingConflicts.length > 0) {
    return {
      response: transactionResult,
      hasConflicts: true,
      conflicts: existingConflicts,
      statusCode: HTTP_STATUS.CONFLICT,
      errorMessage: 'Partial sync completed with conflicts',
      errorCode: 'SYNC_PARTIAL_CONFLICT',
      syncedEntities: transactionResult.syncedEntities,
    };
  }

  return {
    response: transactionResult,
    hasConflicts: false,
    statusCode: HTTP_STATUS.OK,
  };
}

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
    const tripResult = await processTripsInBatch(userId, pushTrips, syncVersion);
    if (tripResult.error) {
      throw tripResult.error;
    }
    tripsProcessed = tripResult.processed;
  }

  if (pushSettings) {
    const settingsResult = await processUserSettings(userId, pushSettings, syncVersion);
    if (settingsResult.error) {
      throw settingsResult.error;
    }
    settingsProcessed = settingsResult.processed;
  }

  if (deletedTripIds && deletedTripIds.length > 0) {
    const deleteResult = await processDeletions(userId, deletedTripIds, syncVersion);
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

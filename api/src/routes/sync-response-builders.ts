import { HTTP_STATUS } from '@api/constants/http';

export interface SyncPushResult {
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

interface SyncPushData {
  syncVersion: number;
  forceOverwrite?: boolean;
  applyNonConflicting?: boolean;
}

export function createConflictResponse(
  pushData: SyncPushData,
  conflicts: unknown[],
): SyncPushResult {
  return {
    response: {
      syncVersion: pushData.syncVersion,
      syncedEntities: { trips: 0, userSettings: false, deletedTrips: 0 },
    },
    hasConflicts: true,
    conflicts,
    statusCode: HTTP_STATUS.CONFLICT,
    errorMessage: 'Sync conflicts detected',
    errorCode: 'SYNC_CONFLICT',
  };
}

export function buildFinalResponse(
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

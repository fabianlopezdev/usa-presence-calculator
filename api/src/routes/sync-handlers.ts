import { FastifyReply, FastifyRequest } from 'fastify';

import { Trip, UserSettings } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';
import { handleSyncPushError } from '@api/routes/sync-error-handler';
import { executeSyncPush } from '@api/routes/sync-execution';
import {
  checkSyncEnabled,
  fetchTripsForPull,
  fetchUserSettingsForPull,
  validateBatchSizeLimit,
  validatePullRequest,
  validatePushRequest,
  validateSecurityPayload,
  validateSyncVersionNumber,
  validateUserAuthentication,
} from '@api/routes/sync-handler-helpers';
import { syncPullResponseSchema, syncPushResponseSchema } from '@api/routes/sync-schemas';

export async function handleSyncPull(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const syncCheck = checkSyncEnabled(reply);
  if (!syncCheck.isEnabled) return;

  const securityCheck = validateSecurityPayload(request, reply);
  if (!securityCheck.isValid) return;

  const requestCheck = validatePullRequest(request, reply);
  if (!requestCheck.isValid || !requestCheck.data) return;

  const authCheck = validateUserAuthentication(request, reply);
  if (!authCheck.isAuthenticated || !authCheck.userId) return;

  const { lastSyncVersion, entityTypes } = requestCheck.data;
  const userId = authCheck.userId;

  try {
    const pullResult = await executeSyncPull(userId, lastSyncVersion, entityTypes);

    const responseValidation = syncPullResponseSchema.safeParse(pullResult);
    if (!responseValidation.success) {
      request.log.error({ error: responseValidation.error }, 'Invalid sync pull response');
      reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
      return;
    }

    reply.code(HTTP_STATUS.OK).send(pullResult);
  } catch (error) {
    request.log.error({ error }, 'Sync pull error');
    reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: {
        message: 'Failed to sync data',
        code: 'SYNC_ERROR',
      },
    });
  }
}

async function executeSyncPull(
  userId: string,
  lastSyncVersion?: number,
  entityTypes?: string[],
): Promise<{
  syncVersion: number;
  trips: unknown[];
  userSettings: unknown;
  hasMore: boolean;
}> {
  const shouldSyncTrips = !entityTypes || entityTypes.includes('trips');
  const shouldSyncSettings = !entityTypes || entityTypes.includes('user_settings');

  let latestSyncVersion = lastSyncVersion || 0;
  const responseData: {
    syncVersion: number;
    trips: unknown[];
    userSettings: unknown;
    hasMore: boolean;
  } = {
    syncVersion: latestSyncVersion,
    trips: [],
    userSettings: null,
    hasMore: false,
  };

  if (shouldSyncTrips) {
    const tripData = await fetchTripsForPull(userId, lastSyncVersion);
    responseData.trips = tripData.trips;
    responseData.hasMore = tripData.hasMore;
    latestSyncVersion = Math.max(latestSyncVersion, tripData.maxVersion);
  }

  if (shouldSyncSettings && !responseData.hasMore) {
    const settingsData = await fetchUserSettingsForPull(userId, lastSyncVersion);
    responseData.userSettings = settingsData.userSettings;
    latestSyncVersion = Math.max(latestSyncVersion, settingsData.version);
  }

  responseData.syncVersion = latestSyncVersion;
  return responseData;
}

export async function handleSyncPush(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const validationResult = validateSyncPushRequest(request, reply);
  if (!validationResult.isValid || !validationResult.data) return;

  const { userId, pushData } = validationResult.data;

  try {
    const result = await executeSyncPush(userId, pushData);

    const responseValidation = syncPushResponseSchema.safeParse(result.response);
    if (!responseValidation.success) {
      request.log.error({ error: responseValidation.error }, 'Invalid sync push response');
      reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
      return;
    }

    sendSyncPushResponse(reply, result);
  } catch (error) {
    handleSyncPushError(error, reply);
  }
}

interface ValidationResult {
  isValid: boolean;
  data?: {
    userId: string;
    pushData: {
      syncVersion: number;
      trips?: Trip[];
      userSettings?: UserSettings;
      deletedTripIds?: string[];
      forceOverwrite?: boolean;
      applyNonConflicting?: boolean;
    };
  };
}

function validateSyncPushRequest(request: FastifyRequest, reply: FastifyReply): ValidationResult {
  const basicValidation = performBasicValidations(request, reply);
  if (!basicValidation.isValid) return { isValid: false };

  const { requestData, userId } = basicValidation;

  if (!requestData || !userId) {
    return { isValid: false };
  }

  const advancedValidation = performAdvancedValidations(requestData, reply);
  if (!advancedValidation.isValid) return { isValid: false };

  return {
    isValid: true,
    data: {
      userId,
      pushData: requestData,
    },
  };
}

function performBasicValidations(
  request: FastifyRequest,
  reply: FastifyReply,
): {
  isValid: boolean;
  requestData?: {
    syncVersion: number;
    trips?: Trip[];
    userSettings?: UserSettings;
    deletedTripIds?: string[];
    forceOverwrite?: boolean;
    applyNonConflicting?: boolean;
  };
  userId?: string;
} {
  const syncCheck = checkSyncEnabled(reply);
  if (!syncCheck.isEnabled) return { isValid: false };

  const securityCheck = validateSecurityPayload(request, reply);
  if (!securityCheck.isValid) return { isValid: false };

  const requestCheck = validatePushRequest(request, reply);
  if (!requestCheck.isValid || !requestCheck.data) return { isValid: false };

  const authCheck = validateUserAuthentication(request, reply);
  if (!authCheck.isAuthenticated || !authCheck.userId) return { isValid: false };

  return { isValid: true, requestData: requestCheck.data, userId: authCheck.userId };
}

function performAdvancedValidations(
  requestData: {
    syncVersion: number;
    trips?: Trip[];
    deletedTripIds?: string[];
  },
  reply: FastifyReply,
): { isValid: boolean } {
  const versionCheck = validateSyncVersionNumber(requestData.syncVersion, reply);
  if (!versionCheck.isValid) return { isValid: false };

  const totalItems = (requestData.trips?.length || 0) + (requestData.deletedTripIds?.length || 0);
  const batchCheck = validateBatchSizeLimit(totalItems, reply);
  if (!batchCheck.isValid) return { isValid: false };

  return { isValid: true };
}

function sendSyncPushResponse(
  reply: FastifyReply,
  result: {
    response: unknown;
    hasConflicts: boolean;
    conflicts?: unknown[];
    statusCode: number;
    errorMessage?: string;
    errorCode?: string;
    syncedEntities?: unknown;
  },
): void {
  if (result.hasConflicts && result.conflicts) {
    reply.code(result.statusCode).send({
      error: {
        message: result.errorMessage,
        code: result.errorCode,
      },
      conflicts: result.conflicts,
      ...(result.syncedEntities ? { syncedEntities: result.syncedEntities } : {}),
    });
    return;
  }

  reply.code(HTTP_STATUS.OK).send(result.response);
}

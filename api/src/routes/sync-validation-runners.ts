import { FastifyRequest } from 'fastify';

import { Trip, UserSettings } from '@usa-presence/shared';

import { syncPullBodySchema, syncPushBodySchema } from '@api/routes/sync';
import {
  validateBatchSize,
  validateSyncEnabled,
  validateSyncSecurity,
  validateSyncVersionNumber,
  validateUserId,
} from '@api/routes/sync-validation-helpers';

export interface PullValidationResult {
  isValid: boolean;
  data?: {
    userId: string;
    lastSyncVersion?: number;
    entityTypes?: string[];
  };
  error?: { message: string; code: string; details?: unknown };
  logWarning?: boolean;
  logMessage?: string;
  parseError?: unknown;
}

export interface PushValidationResult {
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
  error?: { message: string; code: string; details?: unknown };
  logWarning?: boolean;
  logMessage?: string;
}

export function runPullValidations(request: FastifyRequest): PullValidationResult {
  const commonCheck = runCommonValidations(request);
  if (!commonCheck.isValid) {
    return {
      isValid: false,
      error: commonCheck.error,
      logWarning: commonCheck.logWarning,
      logMessage: commonCheck.logMessage,
    };
  }

  const parseResult = syncPullBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    return {
      isValid: false,
      parseError: parseResult.error.errors,
    };
  }

  const { lastSyncVersion, entityTypes } = parseResult.data;

  return {
    isValid: true,
    data: { userId: commonCheck.userId || '', lastSyncVersion, entityTypes },
  };
}

function runCommonValidations(request: FastifyRequest): {
  isValid: boolean;
  userId?: string;
  error?: { message: string; code: string; details?: unknown };
  logWarning?: boolean;
  logMessage?: string;
} {
  const enabledCheck = validateSyncEnabled();
  if (!enabledCheck.isValid) {
    return { isValid: false, error: enabledCheck.error };
  }

  const securityCheck = validateSyncSecurity(request);
  if (!securityCheck.isValid) {
    return {
      isValid: false,
      error: securityCheck.error,
      logWarning: true,
      logMessage: 'Security validation failed',
    };
  }

  const userCheck = validateUserId(request);
  if (!userCheck.isValid || !userCheck.data) {
    return { isValid: false, error: userCheck.error };
  }

  return { isValid: true, userId: userCheck.data.userId };
}

export function runPushValidations(request: FastifyRequest): PushValidationResult {
  const commonCheck = runCommonValidations(request);
  if (!commonCheck.isValid) {
    return {
      isValid: false,
      error: commonCheck.error,
      logWarning: commonCheck.logWarning,
      logMessage: commonCheck.logMessage,
    };
  }

  const parseResult = syncPushBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: {
        message: 'Invalid request body',
        code: 'INVALID_REQUEST_BODY',
        details: parseResult.error.errors,
      },
    };
  }

  const pushData = parseResult.data;
  const versionCheck = validateSyncVersionNumber(pushData.syncVersion);
  if (!versionCheck.isValid) {
    return { isValid: false, error: versionCheck.error };
  }

  const batchCheck = validateBatchSize(pushData.trips, pushData.deletedTripIds);
  if (!batchCheck.isValid) {
    return { isValid: false, error: batchCheck.error };
  }

  return {
    isValid: true,
    data: { userId: commonCheck.userId || '', pushData },
  };
}

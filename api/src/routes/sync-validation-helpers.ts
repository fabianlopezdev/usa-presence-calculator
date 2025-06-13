import { FastifyReply, FastifyRequest } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG, SYNC_ERROR_CODES, SYNC_MESSAGES } from '@api/constants/sync';
import { validateSyncPayload, validateSyncVersion } from '@api/utils/sync-validation';

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export function validateSyncEnabled(): ValidationResult {
  if (!SYNC_CONFIG.ENABLED) {
    return {
      isValid: false,
      error: {
        message: SYNC_MESSAGES.SYNC_DISABLED,
        code: SYNC_ERROR_CODES.SYNC_DISABLED,
      },
    };
  }
  return { isValid: true };
}

export function validateSyncSecurity(request: FastifyRequest): ValidationResult {
  const securityCheck = validateSyncPayload(request.body);
  if (!securityCheck.isValid) {
    return {
      isValid: false,
      error: {
        message: securityCheck.error || 'Invalid request',
        code: 'INVALID_PAYLOAD',
      },
    };
  }
  return { isValid: true };
}

export function validateSyncVersionNumber(syncVersion: number): ValidationResult {
  try {
    validateSyncVersion(syncVersion);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: {
        message: error instanceof Error ? error.message : 'Invalid sync version',
        code: 'INVALID_SYNC_VERSION',
      },
    };
  }
}

export function validateBatchSize(trips?: unknown[], deletedTripIds?: string[]): ValidationResult {
  const totalItems = (trips?.length || 0) + (deletedTripIds?.length || 0);
  if (totalItems > SYNC_CONFIG.MAX_BATCH_SIZE) {
    return {
      isValid: false,
      error: {
        message: SYNC_MESSAGES.BATCH_TOO_LARGE,
        code: SYNC_ERROR_CODES.BATCH_TOO_LARGE,
        details: { maxBatchSize: SYNC_CONFIG.MAX_BATCH_SIZE, providedSize: totalItems },
      },
    };
  }
  return { isValid: true };
}

export function validateUserId(request: FastifyRequest): ValidationResult<{ userId: string }> {
  const userId = request.user?.userId;
  if (!userId) {
    return {
      isValid: false,
      error: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      },
    };
  }
  return { isValid: true, data: { userId } };
}

export function sendValidationError(reply: FastifyReply, error: ValidationResult['error']): void {
  if (!error) return;

  const statusCode =
    error.code === 'UNAUTHORIZED'
      ? HTTP_STATUS.UNAUTHORIZED
      : error.code === SYNC_ERROR_CODES.SYNC_DISABLED
        ? HTTP_STATUS.SERVICE_UNAVAILABLE
        : HTTP_STATUS.BAD_REQUEST;

  reply.code(statusCode).send({ error });
}

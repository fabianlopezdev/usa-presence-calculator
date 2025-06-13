import { FastifyReply, FastifyRequest } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { handleSyncPushError } from '@api/routes/sync-error-handler';
import { executeSyncPull, executeSyncPush } from '@api/routes/sync-execution-helpers';
import { SyncPushResult } from '@api/routes/sync-response-builders';
import { sendValidationError } from '@api/routes/sync-validation-helpers';
import { runPullValidations, runPushValidations } from '@api/routes/sync-validation-runners';

// ===== PULL HANDLER =====

export async function handleSyncPull(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const validationResult = runPullValidations(request);
  if (!validationResult.isValid || !validationResult.data) {
    if (validationResult.logWarning) {
      request.log.warn({ error: validationResult.error }, validationResult.logMessage);
    }
    if (validationResult.parseError) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: 'Invalid request body',
          code: 'INVALID_REQUEST_BODY',
          details: validationResult.parseError,
        },
      });
      return;
    }
    sendValidationError(
      reply,
      validationResult.error || {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      },
    );
    return;
  }

  const { userId, lastSyncVersion, entityTypes } = validationResult.data;

  try {
    const pullResult = await executeSyncPull(userId, lastSyncVersion, entityTypes);
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

// ===== PUSH HANDLER =====

export async function handleSyncPush(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Run all validations
  const validationResult = runPushValidations(request);
  if (!validationResult.isValid || !validationResult.data) {
    if (validationResult.logWarning) {
      request.log.warn({ error: validationResult.error }, validationResult.logMessage);
    }
    sendValidationError(
      reply,
      validationResult.error || {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      },
    );
    return;
  }

  const { userId, pushData } = validationResult.data;

  try {
    const result = await executeSyncPush(userId, pushData);
    sendSyncPushResponse(reply, result);
  } catch (error) {
    handleSyncPushError(error, reply);
  }
}

// ===== RESPONSE HELPER =====

function sendSyncPushResponse(reply: FastifyReply, result: SyncPushResult): void {
  if (result.hasConflicts && result.conflicts) {
    reply.code(result.statusCode).send({
      error: {
        message: result.errorMessage || 'Sync conflicts detected',
        code: result.errorCode || 'SYNC_CONFLICT',
      },
      conflicts: result.conflicts,
      ...(result.syncedEntities ? { syncedEntities: result.syncedEntities } : {}),
    });
    return;
  }

  reply.code(HTTP_STATUS.OK).send(result.response);
}

import { FastifySchema } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { SyncConflictSchema, TripSchema, UserSettingsSchema } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';

// Sync pull request schema
const syncPullBodySchema = z
  .object({
    deviceId: z.string(),
    lastSyncVersion: z.number().int().min(0).optional(),
    entityTypes: z.array(z.enum(['trips', 'user_settings'])).optional(),
  })
  .strict();

// Sync pull response schema
const syncPullResponseSchema = z
  .object({
    syncVersion: z.number().int().min(0),
    trips: z.array(TripSchema),
    userSettings: UserSettingsSchema.nullable(),
    hasMore: z.boolean(),
    conflicts: z.array(SyncConflictSchema).optional(),
  })
  .strict();

// Conflict resolution schema
const conflictResolutionSchema = z
  .object({
    entityType: z.enum(['trip', 'user_settings']),
    entityId: z.string(),
    resolution: z.enum(['merged', 'overwrite', 'keep_local', 'keep_server']),
    mergedVersion: z.number().int().min(0).optional(),
  })
  .strict();

// Sync push request schema
const syncPushBodySchema = z
  .object({
    deviceId: z.string(),
    syncVersion: z.number().int().min(0),
    trips: z.array(TripSchema).optional(),
    userSettings: UserSettingsSchema.optional(),
    deletedTripIds: z.array(z.string()).optional(),
    forceOverwrite: z.boolean().optional(),
    applyNonConflicting: z.boolean().optional(),
    resolvedConflicts: z.array(conflictResolutionSchema).optional(),
  })
  .strict();

// Sync push response schema
const syncPushResponseSchema = z
  .object({
    syncVersion: z.number().int().min(0),
    syncedEntities: z.object({
      trips: z.number().int().min(0),
      userSettings: z.boolean(),
      deletedTrips: z.number().int().min(0),
    }),
    conflicts: z.array(SyncConflictSchema).optional(),
  })
  .strict();

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.object({
      message: z.string(),
      code: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .strict();

// Conflict response schema
const conflictResponseSchema = z
  .object({
    error: z.object({
      message: z.string(),
      code: z.string(),
    }),
    conflicts: z.array(SyncConflictSchema),
    syncedEntities: z
      .object({
        trips: z.number().int().min(0),
        userSettings: z.boolean(),
        deletedTrips: z.number().int().min(0),
      })
      .optional(),
  })
  .strict();

// Fastify route schemas
export const syncPullSchema: FastifySchema = {
  description: 'Pull sync data from server',
  tags: ['sync'],
  security: [{ bearerAuth: [] }],
  body: zodToJsonSchema(syncPullBodySchema),
  response: {
    [HTTP_STATUS.OK]: zodToJsonSchema(syncPullResponseSchema),
    [HTTP_STATUS.UNAUTHORIZED]: zodToJsonSchema(errorResponseSchema),
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: zodToJsonSchema(errorResponseSchema),
  },
};

export const syncPushSchema: FastifySchema = {
  description: 'Push sync data to server',
  tags: ['sync'],
  security: [{ bearerAuth: [] }],
  body: zodToJsonSchema(syncPushBodySchema),
  response: {
    [HTTP_STATUS.OK]: zodToJsonSchema(syncPushResponseSchema),
    [HTTP_STATUS.UNAUTHORIZED]: zodToJsonSchema(errorResponseSchema),
    [HTTP_STATUS.BAD_REQUEST]: zodToJsonSchema(errorResponseSchema),
    [HTTP_STATUS.CONFLICT]: zodToJsonSchema(conflictResponseSchema),
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: zodToJsonSchema(errorResponseSchema),
  },
};

// Export schemas for use in handlers
export { syncPullBodySchema, syncPullResponseSchema, syncPushBodySchema, syncPushResponseSchema };

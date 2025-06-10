import { z } from 'zod';

/**
 * Sync metadata schema - Tracks sync state for a user across devices
 */
export const SyncMetadataSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    deviceId: z.string(),
    deviceName: z.string().optional(),
    lastModified: z.string().datetime(),
    syncVersion: z.number().int().min(0),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

/**
 * Sync device schema - Represents a device registered for sync
 */
export const SyncDeviceSchema = z
  .object({
    id: z.string().uuid(),
    deviceId: z.string(),
    deviceName: z.string(),
    deviceType: z.enum(['phone', 'tablet']),
    lastActiveAt: z.string().datetime(),
    createdAt: z.string().datetime(),
  })
  .strict();

/**
 * Sync conflict schema - Represents a conflict between local and remote data
 */
export const SyncConflictSchema = z
  .object({
    entityType: z.enum(['trip', 'user_settings']),
    entityId: z.string(),
    localVersion: z
      .object({
        data: z.record(z.unknown()),
        syncVersion: z.number().int().min(0),
        modifiedAt: z.string().datetime(),
        deviceId: z.string(),
      })
      .strict(),
    remoteVersion: z
      .object({
        data: z.record(z.unknown()),
        syncVersion: z.number().int().min(0),
        modifiedAt: z.string().datetime(),
        deviceId: z.string(),
      })
      .strict(),
  })
  .strict();

// Type exports
export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;
export type SyncDevice = z.infer<typeof SyncDeviceSchema>;
export type SyncConflict = z.infer<typeof SyncConflictSchema>;

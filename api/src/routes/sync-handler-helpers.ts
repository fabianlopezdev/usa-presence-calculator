import { eq, and, gt } from 'drizzle-orm';
import { FastifyReply, FastifyRequest } from 'fastify';

import { Trip, UserSettings } from '@usa-presence/shared';

import { HTTP_STATUS } from '@api/constants/http';
import { SYNC_CONFIG, SYNC_ERROR_CODES, SYNC_MESSAGES } from '@api/constants/sync';
import { getDatabase } from '@api/db/connection';
import { trips, userSettings } from '@api/db/schema';
import { syncPullBodySchema, syncPushBodySchema } from '@api/routes/sync-schemas';
import { validateSyncPayload, validateSyncVersion } from '@api/utils/sync-validation';

interface SyncEnabledCheckResult {
  isEnabled: boolean;
  reply?: FastifyReply;
}

interface SecurityValidationResult {
  isValid: boolean;
  reply?: FastifyReply;
}

interface RequestValidationResult<T> {
  isValid: boolean;
  data?: T;
  reply?: FastifyReply;
}

interface AuthenticationResult {
  isAuthenticated: boolean;
  userId?: string;
  reply?: FastifyReply;
}

export function checkSyncEnabled(reply: FastifyReply): SyncEnabledCheckResult {
  if (!SYNC_CONFIG.ENABLED) {
    reply.code(HTTP_STATUS.SERVICE_UNAVAILABLE).send({
      error: {
        message: SYNC_MESSAGES.SYNC_DISABLED,
        code: SYNC_ERROR_CODES.SYNC_DISABLED,
      },
    });
    return { isEnabled: false, reply };
  }
  return { isEnabled: true };
}

export function validateSecurityPayload(
  request: FastifyRequest,
  reply: FastifyReply,
): SecurityValidationResult {
  const securityCheck = validateSyncPayload(request.body);
  if (!securityCheck.isValid) {
    request.log.warn({ error: securityCheck.error }, 'Security validation failed');
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: securityCheck.error || 'Invalid request',
        code: 'INVALID_PAYLOAD',
      },
    });
    return { isValid: false, reply };
  }
  return { isValid: true };
}

export function validatePullRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): RequestValidationResult<{
  lastSyncVersion?: number;
  entityTypes?: string[];
}> {
  const parseResult = syncPullBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'Invalid request body',
        code: 'INVALID_REQUEST_BODY',
        details: parseResult.error.errors,
      },
    });
    return { isValid: false, reply };
  }
  return { isValid: true, data: parseResult.data };
}

export function validatePushRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): RequestValidationResult<{
  syncVersion: number;
  trips?: Trip[];
  userSettings?: UserSettings;
  deletedTripIds?: string[];
  forceOverwrite?: boolean;
  applyNonConflicting?: boolean;
}> {
  const parseResult = syncPushBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'Invalid request body',
        code: 'INVALID_REQUEST_BODY',
        details: parseResult.error.errors,
      },
    });
    return { isValid: false, reply };
  }
  return { isValid: true, data: parseResult.data };
}

export function validateUserAuthentication(
  request: FastifyRequest,
  reply: FastifyReply,
): AuthenticationResult {
  const userId = request.user?.userId;
  if (!userId) {
    reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: {
        message: 'User not authenticated',
        code: 'UNAUTHORIZED',
      },
    });
    return { isAuthenticated: false, reply };
  }
  return { isAuthenticated: true, userId };
}

export function validateSyncVersionNumber(
  syncVersion: number,
  reply: FastifyReply,
): { isValid: boolean } {
  try {
    validateSyncVersion(syncVersion);
    return { isValid: true };
  } catch {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'Invalid sync version',
        code: 'INVALID_SYNC_VERSION',
      },
    });
    return { isValid: false };
  }
}

export function validateBatchSizeLimit(
  itemCount: number,
  reply: FastifyReply,
): { isValid: boolean } {
  if (itemCount > SYNC_CONFIG.MAX_BATCH_SIZE) {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'Batch size exceeds maximum allowed',
        code: SYNC_ERROR_CODES.SYNC_BATCH_TOO_LARGE,
      },
    });
    return { isValid: false };
  }
  return { isValid: true };
}

export async function fetchTripsForPull(
  userId: string,
  lastSyncVersion?: number,
): Promise<{
  trips: unknown[];
  hasMore: boolean;
  maxVersion: number;
}> {
  const db = getDatabase();
  const tripsQuery = db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.userId, userId),
        lastSyncVersion ? gt(trips.syncVersion, lastSyncVersion) : undefined,
      ),
    )
    .limit(SYNC_CONFIG.MAX_BATCH_SIZE + 1);

  const fetchedTrips = await tripsQuery;
  const transformedTrips = fetchedTrips.map(transformTrip);
  const hasMore = transformedTrips.length > SYNC_CONFIG.MAX_BATCH_SIZE;
  const returnTrips = hasMore
    ? transformedTrips.slice(0, SYNC_CONFIG.MAX_BATCH_SIZE)
    : transformedTrips;
  const maxVersion = calculateMaxVersion(fetchedTrips);

  return { trips: returnTrips, hasMore, maxVersion };
}

function transformTrip(trip: typeof trips.$inferSelect): unknown {
  return {
    id: trip.id,
    userId: trip.userId,
    departureDate: trip.departureDate,
    returnDate: trip.returnDate,
    location: trip.location || undefined,
    isSimulated: trip.isSimulated || false,
    createdAt: trip.createdAt || new Date().toISOString(),
    updatedAt: trip.updatedAt || new Date().toISOString(),
    syncId: trip.syncId || undefined,
    deviceId: trip.deviceId || undefined,
    syncVersion: trip.syncVersion || undefined,
    syncStatus: trip.syncStatus || undefined,
    deletedAt: trip.deletedAt || undefined,
  };
}

function calculateMaxVersion(fetchedTrips: Array<typeof trips.$inferSelect>): number {
  if (fetchedTrips.length === 0) return 0;

  const versions = fetchedTrips.slice(0, SYNC_CONFIG.MAX_BATCH_SIZE).map((t) => t.syncVersion || 0);

  return Math.max(...versions);
}

export async function fetchUserSettingsForPull(
  userId: string,
  lastSyncVersion?: number,
): Promise<{
  userSettings: unknown;
  version: number;
}> {
  const db = getDatabase();
  const settingsQuery = db
    .select()
    .from(userSettings)
    .where(
      and(
        eq(userSettings.userId, userId),
        lastSyncVersion ? gt(userSettings.syncVersion, lastSyncVersion) : undefined,
      ),
    );

  const [settings] = await settingsQuery;
  if (!settings) {
    return { userSettings: null, version: 0 };
  }

  const transformedSettings = {
    notifications: {
      milestones: settings.notificationMilestones,
      warnings: settings.notificationWarnings,
      reminders: settings.notificationReminders,
    },
    biometricAuthEnabled: settings.biometricAuthEnabled,
    theme: settings.theme,
    language: settings.language,
    sync: settings.syncEnabled
      ? {
          enabled: settings.syncEnabled,
          subscriptionTier: settings.syncSubscriptionTier,
          lastSyncAt: settings.syncLastSyncAt || undefined,
          deviceId: settings.syncDeviceId || undefined,
        }
      : undefined,
  };

  return { userSettings: transformedSettings, version: settings.syncVersion || 0 };
}

// Re-export for backwards compatibility
export { detectSyncConflicts } from '@api/routes/sync-conflict-helpers';

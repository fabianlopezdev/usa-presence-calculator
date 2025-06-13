import { eq } from 'drizzle-orm';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

import { BODY_LIMITS } from '@api/constants/body-limits';
import { HTTP_STATUS } from '@api/constants/http';
import { SETTINGS_API_MESSAGES } from '@api/constants/settings';
import { getDatabase } from '@api/db/connection';
import { userSettings, type UserSetting } from '@api/db/schema';
import { settingsRouteDefinitions } from '@api/routes/settings-schemas';
import {
  createDefaultUserSettings,
  formatSettingsResponseFromDatabase,
  mergeNotificationPreferences,
  prepareSyncUpdates,
  validateSettingsUpdateRequest,
  type PartialUserSettings,
} from '@api/routes/settings-helpers';

// Helper functions
function getOrCreateUserSettings(userId: string): UserSetting {
  const db = getDatabase();

  // Try to get existing settings
  const existingSettings = db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .get();

  if (existingSettings) {
    return existingSettings;
  }

  // Create default settings
  const defaultSettings = createDefaultUserSettings(userId);
  const newSettings = db.insert(userSettings).values(defaultSettings).returning().get();

  return newSettings;
}

async function getUserSettingsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // User is guaranteed to exist with requireAuth, but TypeScript doesn't know that
  const userId = request.user?.userId;
  if (!userId) {
    // This should never happen with requireAuth, but satisfies TypeScript
    return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: 'Authentication state error',
    });
  }

  const settings = getOrCreateUserSettings(userId);
  const formattedResponse = formatSettingsResponseFromDatabase(settings);

  return reply.code(HTTP_STATUS.OK).send(formattedResponse);
}

function prepareDatabaseUpdateFromValidatedData(
  validatedData: PartialUserSettings,
  existingSettings: UserSetting,
): Partial<UserSetting> {
  const updates: Partial<UserSetting> = {
    updatedAt: new Date().toISOString(),
  };

  // Handle simple fields
  if (validatedData.theme !== undefined) {
    updates.theme = validatedData.theme;
  }
  if (validatedData.language !== undefined) {
    updates.language = validatedData.language;
  }
  if (validatedData.biometricAuthEnabled !== undefined) {
    updates.biometricAuthEnabled = validatedData.biometricAuthEnabled;
  }

  // Handle notification preferences
  if (validatedData.notifications !== undefined) {
    const mergedNotifications = mergeNotificationPreferences(
      {
        milestones: existingSettings.notificationMilestones,
        warnings: existingSettings.notificationWarnings,
        reminders: existingSettings.notificationReminders,
      },
      validatedData.notifications,
    );
    Object.assign(updates, mergedNotifications);
  }

  // Handle sync preferences
  if (validatedData.sync !== undefined) {
    Object.assign(updates, prepareSyncUpdates(validatedData.sync));
  }

  return updates;
}

function performSettingsUpdate(
  settingsId: string,
  updates: Partial<UserSetting>,
): UserSetting | undefined {
  const db = getDatabase();
  return db
    .update(userSettings)
    .set(updates)
    .where(eq(userSettings.id, settingsId))
    .returning()
    .get();
}

function validateAndParseSettingsUpdate(body: unknown): {
  success: boolean;
  data?: PartialUserSettings;
  error?: { statusCode: number; error: unknown };
} {
  const parseResult = validateSettingsUpdateRequest(body);

  if (!parseResult.success) {
    return {
      success: false,
      error: {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: {
          error: {
            message: SETTINGS_API_MESSAGES.INVALID_REQUEST_BODY,
            details: parseResult.error.errors,
          },
        },
      },
    };
  }

  const validatedData = parseResult.data;

  if (Object.keys(validatedData).length === 0) {
    return {
      success: false,
      error: {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: {
          error: {
            message: SETTINGS_API_MESSAGES.NO_CHANGES_PROVIDED,
          },
        },
      },
    };
  }

  return { success: true, data: validatedData };
}

function handleSettingsUpdate(
  userId: string,
  body: unknown,
): {
  success: boolean;
  statusCode?: number;
  error?: unknown;
  data?: UserSetting;
} {
  const validation = validateAndParseSettingsUpdate(body);
  if (!validation.success) {
    return {
      success: false,
      statusCode: validation.error?.statusCode,
      error: validation.error?.error,
    };
  }

  const existingSettings = getOrCreateUserSettings(userId);
  const updates = prepareDatabaseUpdateFromValidatedData(
    validation.data as PartialUserSettings,
    existingSettings,
  );
  const updatedSettings = performSettingsUpdate(existingSettings.id, updates);

  if (!updatedSettings) {
    return {
      success: false,
      statusCode: HTTP_STATUS.NOT_FOUND,
      error: {
        error: SETTINGS_API_MESSAGES.SETTINGS_NOT_FOUND,
      },
    };
  }

  return {
    success: true,
    data: updatedSettings,
  };
}

async function updateUserSettingsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // User is guaranteed to exist with requireAuth, but TypeScript doesn't know that
  const userId = request.user?.userId;
  if (!userId) {
    // This should never happen with requireAuth, but satisfies TypeScript
    return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: 'Authentication state error',
    });
  }

  // Validate and process the request
  const result = handleSettingsUpdate(userId, request.body);

  if (!result.success) {
    return reply.code(result.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR).send(result.error);
  }

  if (!result.data) {
    return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: 'Unexpected error: No data returned',
    });
  }

  const formattedResponse = formatSettingsResponseFromDatabase(result.data);
  return reply.code(HTTP_STATUS.OK).send(formattedResponse);
}

const settingsRoutes: FastifyPluginAsync = (fastify): Promise<void> => {
  // GET /users/settings
  fastify.get('/settings', {
    ...settingsRouteDefinitions.getSettings,
    preHandler: fastify.requireAuth,
    handler: getUserSettingsHandler,
  });

  // PATCH /users/settings
  fastify.patch('/settings', {
    ...settingsRouteDefinitions.updateSettings,
    preHandler: fastify.requireAuth,
    handler: updateUserSettingsHandler,
    bodyLimit: BODY_LIMITS.SETTINGS_UPDATE,
  });

  return Promise.resolve();
};

export default settingsRoutes;

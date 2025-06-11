import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

import { DEFAULT_USER_SETTINGS } from '@usa-presence/shared/constants';
import { type UserSetting } from '@api/db/schema';

export type PartialUserSettings = {
  notifications?: {
    milestones?: boolean;
    warnings?: boolean;
    reminders?: boolean;
  };
  biometricAuthEnabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'es';
  sync?: {
    enabled?: boolean;
    subscriptionTier?: 'none' | 'basic' | 'premium';
    lastSyncAt?: string;
    deviceId?: string;
  };
};

export function createDefaultUserSettings(
  userId: string,
): Omit<UserSetting, 'createdAt' | 'updatedAt'> {
  const settings = DEFAULT_USER_SETTINGS as {
    NOTIFICATIONS: {
      MILESTONES: boolean;
      WARNINGS: boolean;
      REMINDERS: boolean;
    };
    BIOMETRIC_AUTH_ENABLED: boolean;
    THEME: 'system' | 'light' | 'dark';
    LANGUAGE: 'en' | 'es';
    SYNC: {
      ENABLED: boolean;
      SUBSCRIPTION_TIER: 'none' | 'basic' | 'premium';
      LAST_SYNC_AT: string | undefined;
      DEVICE_ID: string | undefined;
    };
  };

  return {
    id: createId(),
    userId,
    notificationMilestones: settings.NOTIFICATIONS.MILESTONES,
    notificationWarnings: settings.NOTIFICATIONS.WARNINGS,
    notificationReminders: settings.NOTIFICATIONS.REMINDERS,
    biometricAuthEnabled: settings.BIOMETRIC_AUTH_ENABLED,
    theme: settings.THEME,
    language: settings.LANGUAGE,
    syncEnabled: settings.SYNC.ENABLED,
    syncSubscriptionTier: settings.SYNC.SUBSCRIPTION_TIER,
    syncLastSyncAt: settings.SYNC.LAST_SYNC_AT ?? null,
    syncDeviceId: settings.SYNC.DEVICE_ID ?? null,
  };
}

export function formatSettingsResponseFromDatabase(settings: UserSetting): unknown {
  const response = {
    notifications: {
      milestones: settings.notificationMilestones,
      warnings: settings.notificationWarnings,
      reminders: settings.notificationReminders,
    },
    biometricAuthEnabled: settings.biometricAuthEnabled,
    theme: settings.theme,
    language: settings.language,
  };

  // Only include sync if enabled
  if (settings.syncEnabled) {
    return {
      ...response,
      sync: {
        enabled: settings.syncEnabled,
        subscriptionTier: settings.syncSubscriptionTier,
        lastSyncAt: settings.syncLastSyncAt ?? undefined,
        deviceId: settings.syncDeviceId ?? undefined,
      },
    };
  }

  return response;
}

export function mergeNotificationPreferences(
  existing: {
    milestones: boolean;
    warnings: boolean;
    reminders: boolean;
  },
  updates: {
    milestones?: boolean;
    warnings?: boolean;
    reminders?: boolean;
  },
): {
  notificationMilestones: boolean;
  notificationWarnings: boolean;
  notificationReminders: boolean;
} {
  return {
    notificationMilestones: updates.milestones ?? existing.milestones,
    notificationWarnings: updates.warnings ?? existing.warnings,
    notificationReminders: updates.reminders ?? existing.reminders,
  };
}

export function prepareSyncUpdates(syncData: {
  enabled?: boolean;
  subscriptionTier?: 'none' | 'basic' | 'premium';
  lastSyncAt?: string;
  deviceId?: string;
}): Partial<UserSetting> {
  const syncUpdates: Partial<UserSetting> = {};

  if (syncData.enabled !== undefined) {
    syncUpdates.syncEnabled = syncData.enabled;
  }
  if (syncData.subscriptionTier !== undefined) {
    syncUpdates.syncSubscriptionTier = syncData.subscriptionTier;
  }
  if (syncData.lastSyncAt !== undefined) {
    syncUpdates.syncLastSyncAt = syncData.lastSyncAt;
  }
  if (syncData.deviceId !== undefined) {
    syncUpdates.syncDeviceId = syncData.deviceId;
  }

  return syncUpdates;
}

export function validateSettingsUpdateRequest(
  body: unknown,
): z.SafeParseReturnType<unknown, PartialUserSettings> {
  // Create a deeply partial schema for updates
  const UpdateSettingsSchema = z
    .object({
      notifications: z
        .object({
          milestones: z.boolean().optional(),
          warnings: z.boolean().optional(),
          reminders: z.boolean().optional(),
        })
        .strict()
        .optional(),
      biometricAuthEnabled: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.enum(['en', 'es']).optional(),
      sync: z
        .object({
          enabled: z.boolean().optional(),
          subscriptionTier: z.enum(['none', 'basic', 'premium']).optional(),
          lastSyncAt: z.string().datetime().optional(),
          deviceId: z.string().optional(),
        })
        .strict()
        .optional(),
    })
    .strict();

  return UpdateSettingsSchema.safeParse(body);
}

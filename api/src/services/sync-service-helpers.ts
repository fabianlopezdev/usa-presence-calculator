import { UserSettings } from '@usa-presence/shared';

import { trips } from '@api/db/schema';

export function transformTrip(trip: typeof trips.$inferSelect): unknown {
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

export function transformSettingsToUserSettings(dbSettings: {
  notificationMilestones?: boolean | null;
  notificationWarnings?: boolean | null;
  notificationReminders?: boolean | null;
  biometricAuthEnabled?: boolean | null;
  theme?: string | null;
  language?: string | null;
  syncEnabled?: boolean | null;
  syncSubscriptionTier?: string | null;
  syncLastSyncAt?: string | null;
  syncDeviceId?: string | null;
}): Record<string, unknown> {
  if (!dbSettings) return {};

  return {
    notifications: {
      milestones: dbSettings.notificationMilestones ?? true,
      warnings: dbSettings.notificationWarnings ?? true,
      reminders: dbSettings.notificationReminders ?? true,
    },
    biometricAuthEnabled: dbSettings.biometricAuthEnabled ?? false,
    theme: dbSettings.theme ?? 'system',
    language: dbSettings.language ?? 'en',
    sync: dbSettings.syncEnabled
      ? {
          enabled: dbSettings.syncEnabled,
          subscriptionTier: dbSettings.syncSubscriptionTier,
          lastSyncAt: dbSettings.syncLastSyncAt,
          deviceId: dbSettings.syncDeviceId,
        }
      : undefined,
  };
}

export function getDefaultSettings(): {
  notificationMilestones: boolean;
  notificationWarnings: boolean;
  notificationReminders: boolean;
  biometricAuthEnabled: boolean;
  theme: string;
  language: string;
  syncEnabled: boolean;
  syncSubscriptionTier: string;
} {
  return {
    notificationMilestones: true,
    notificationWarnings: true,
    notificationReminders: true,
    biometricAuthEnabled: false,
    theme: 'system',
    language: 'en',
    syncEnabled: false,
    syncSubscriptionTier: 'none',
  };
}

export function buildNotificationSettings(
  pushSettings: UserSettings,
  defaultSettings: ReturnType<typeof getDefaultSettings>,
): Record<string, unknown> {
  return {
    notificationMilestones:
      pushSettings.notifications?.milestones ?? defaultSettings.notificationMilestones,
    notificationWarnings:
      pushSettings.notifications?.warnings ?? defaultSettings.notificationWarnings,
    notificationReminders:
      pushSettings.notifications?.reminders ?? defaultSettings.notificationReminders,
  };
}

export function buildSyncSettings(
  pushSettings: UserSettings,
  defaultSettings: ReturnType<typeof getDefaultSettings>,
): Record<string, unknown> {
  return {
    syncEnabled: pushSettings.sync?.enabled ?? defaultSettings.syncEnabled,
    syncSubscriptionTier:
      pushSettings.sync?.subscriptionTier ?? defaultSettings.syncSubscriptionTier,
    syncLastSyncAt: pushSettings.sync?.lastSyncAt,
    syncDeviceId: pushSettings.sync?.deviceId,
  };
}

export function buildUISettings(
  pushSettings: UserSettings,
  defaultSettings: ReturnType<typeof getDefaultSettings>,
): Record<string, unknown> {
  return {
    biometricAuthEnabled: pushSettings.biometricAuthEnabled ?? defaultSettings.biometricAuthEnabled,
    theme: pushSettings.theme ?? defaultSettings.theme,
    language: pushSettings.language ?? defaultSettings.language,
  };
}

export function detectNotificationConflicts(
  incoming: UserSettings,
  current: {
    notificationMilestones?: boolean | null;
    notificationWarnings?: boolean | null;
    notificationReminders?: boolean | null;
  },
): string[] {
  const fields: string[] = [];

  if (!incoming.notifications || !current) return fields;

  if (incoming.notifications.milestones !== current.notificationMilestones) {
    fields.push('notifications.milestones');
  }
  if (incoming.notifications.warnings !== current.notificationWarnings) {
    fields.push('notifications.warnings');
  }
  if (incoming.notifications.reminders !== current.notificationReminders) {
    fields.push('notifications.reminders');
  }

  return fields;
}

export function detectUIConflicts(
  incoming: UserSettings,
  current: {
    biometricAuthEnabled?: boolean | null;
    theme?: string | null;
    language?: string | null;
  },
): string[] {
  const fields: string[] = [];

  if (incoming.biometricAuthEnabled !== current?.biometricAuthEnabled) {
    fields.push('biometricAuthEnabled');
  }
  if (incoming.theme !== current?.theme) {
    fields.push('theme');
  }
  if (incoming.language !== current?.language) {
    fields.push('language');
  }

  return fields;
}

import { UserSettings } from '@usa-presence/shared';

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

import { UserSettings } from '@usa-presence/shared';

import { userSettings } from '@api/db/schema';
import {
  extractNotificationData,
  extractNotificationSettings,
  extractSyncData,
  extractSyncSettings,
} from '@api/services/sync-notification-helpers';

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

export function transformSettingsToUserSettings(
  settings: typeof userSettings.$inferSelect,
): UserSettings & { userId: string } {
  return {
    userId: settings.userId,
    notifications: extractNotificationSettings(settings),
    biometricAuthEnabled: settings.biometricAuthEnabled ?? false,
    theme: settings.theme || 'system',
    language: settings.language || 'en',
    sync: extractSyncSettings(settings),
  };
}

export function buildSettingsData(
  userId: string,
  pushSettings: UserSettings,
  syncVersion: number,
  timestamp: string,
): Record<string, unknown> {
  const defaults = getDefaultSettings();

  return {
    id: userId,
    userId,
    syncVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...extractNotificationData(pushSettings, defaults),
    biometricAuthEnabled: pushSettings.biometricAuthEnabled ?? defaults.biometricAuthEnabled,
    theme: pushSettings.theme ?? defaults.theme,
    language: pushSettings.language ?? defaults.language,
    ...extractSyncData(pushSettings, defaults),
  };
}

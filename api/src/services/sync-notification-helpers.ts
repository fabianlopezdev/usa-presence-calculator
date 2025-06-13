import { UserSettings } from '@usa-presence/shared';

import { userSettings } from '@api/db/schema';

export function extractNotificationSettings(settings: typeof userSettings.$inferSelect): {
  milestones: boolean;
  warnings: boolean;
  reminders: boolean;
} {
  return {
    milestones: settings.notificationMilestones ?? true,
    warnings: settings.notificationWarnings ?? true,
    reminders: settings.notificationReminders ?? true,
  };
}

export function extractSyncSettings(settings: typeof userSettings.$inferSelect): {
  enabled: boolean;
  subscriptionTier: 'none' | 'basic' | 'premium';
  lastSyncAt: string | undefined;
  deviceId: string | undefined;
} {
  return {
    enabled: settings.syncEnabled ?? false,
    subscriptionTier: settings.syncSubscriptionTier || 'none',
    lastSyncAt: settings.syncLastSyncAt || undefined,
    deviceId: settings.syncDeviceId || undefined,
  };
}

export function extractNotificationData(
  pushSettings: UserSettings,
  defaults: {
    notificationMilestones: boolean;
    notificationWarnings: boolean;
    notificationReminders: boolean;
  },
): Record<string, boolean> {
  const notif = pushSettings.notifications;
  return {
    notificationMilestones: notif?.milestones ?? defaults.notificationMilestones,
    notificationWarnings: notif?.warnings ?? defaults.notificationWarnings,
    notificationReminders: notif?.reminders ?? defaults.notificationReminders,
  };
}

export function extractSyncData(
  pushSettings: UserSettings,
  defaults: { syncEnabled: boolean; syncSubscriptionTier: string },
): Record<string, unknown> {
  const sync = pushSettings.sync;
  return {
    syncEnabled: sync?.enabled ?? defaults.syncEnabled,
    syncSubscriptionTier: sync?.subscriptionTier ?? defaults.syncSubscriptionTier,
    syncLastSyncAt: sync?.lastSyncAt,
    syncDeviceId: sync?.deviceId,
  };
}

import { z } from 'zod';

/**
 * Notification schema - Individual notification data
 */
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['milestone', 'warning', 'reminder', 'celebration']),
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(), // Flexible data object for different notification types
  read: z.boolean(),
  createdAt: z.string().datetime(),
});

/**
 * Notification preferences schema - User notification settings
 */
export const NotificationPreferencesSchema = z.object({
  milestones: z.boolean(),
  warnings: z.boolean(),
  reminders: z.boolean(),
  celebrations: z.boolean(),
});

// Type exports
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

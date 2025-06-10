import { z } from 'zod';

// Define allowed types for notification data values
const NotificationDataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number()])),
]);

/**
 * Notification schema - Individual notification data
 */
export const NotificationSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    type: z.enum(['milestone', 'warning', 'reminder', 'celebration']),
    title: z.string(),
    body: z.string(),
    data: z.record(NotificationDataValueSchema).optional(),
    read: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict();

/**
 * Notification preferences schema - User notification settings
 */
export const NotificationPreferencesSchema = z
  .object({
    milestones: z.boolean(),
    warnings: z.boolean(),
    reminders: z.boolean(),
    celebrations: z.boolean(),
  })
  .strict();

// Type exports
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

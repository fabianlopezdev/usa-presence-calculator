import { z } from 'zod';

import { DATE_VALIDATION } from '../constants/validation-messages';

/**
 * User profile schema - Core user information
 */
export const UserProfileSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
    eligibilityCategory: z.enum(['three_year', 'five_year']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

/**
 * Authentication user schema - OAuth provider information
 */
export const AuthUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    providers: z
      .object({
        apple: z.string().optional(),
        google: z.string().optional(),
      })
      .strict(),
  })
  .strict();

/**
 * User settings schema - App preferences
 */
export const UserSettingsSchema = z
  .object({
    notifications: z
      .object({
        milestones: z.boolean(),
        warnings: z.boolean(),
        reminders: z.boolean(),
      })
      .strict(),
    biometricAuthEnabled: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
    language: z.enum(['en', 'es']),
    sync: z
      .object({
        enabled: z.boolean(),
        subscriptionTier: z.enum(['none', 'basic', 'premium']),
        lastSyncAt: z.string().datetime().optional(),
        deviceId: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;

import { z } from 'zod';

/**
 * User profile schema - Core user information
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Authentication user schema - OAuth provider information
 */
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  providers: z.object({
    apple: z.string().optional(),
    google: z.string().optional(),
  }),
});

/**
 * User settings schema - App preferences
 */
export const UserSettingsSchema = z.object({
  notifications: z.object({
    milestones: z.boolean(),
    warnings: z.boolean(),
    reminders: z.boolean(),
  }),
  biometricAuthEnabled: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'es']),
});

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
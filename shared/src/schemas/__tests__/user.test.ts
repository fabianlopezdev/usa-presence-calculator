// Internal dependencies - Schemas & Types
import { UserProfileSchema, AuthUserSchema, UserSettingsSchema } from '@schemas/user';

describe('User Schemas', () => {
  describe('UserProfileSchema', () => {
    it('should validate a complete user profile', () => {
      const validProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'maria@example.com',
        greenCardDate: '2022-01-15',
        eligibilityCategory: 'five_year' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = UserProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should validate three year eligibility category', () => {
      const validProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john@example.com',
        greenCardDate: '2021-06-20',
        eligibilityCategory: 'three_year' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = UserProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'not-an-email',
        greenCardDate: '2022-01-15',
        eligibilityCategory: 'five_year' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        greenCardDate: '15-01-2022', // Invalid format
        eligibilityCategory: 'five_year' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid eligibility category', () => {
      const invalidProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        greenCardDate: '2022-01-15',
        eligibilityCategory: 'invalid_category',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('AuthUserSchema', () => {
    it('should validate auth user with all providers', () => {
      const authUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        providers: {
          apple: 'apple_id_123',
          google: 'google_id_456',
        },
      };

      const result = AuthUserSchema.safeParse(authUser);
      expect(result.success).toBe(true);
    });

    it('should validate auth user with single provider', () => {
      const authUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        providers: {
          google: 'google_id_456',
        },
      };

      const result = AuthUserSchema.safeParse(authUser);
      expect(result.success).toBe(true);
    });
  });

  describe('UserSettingsSchema', () => {
    it('should validate complete user settings', () => {
      const settings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: false,
        },
        biometricAuthEnabled: true,
        theme: 'light' as const,
        language: 'en' as const,
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should validate dark theme', () => {
      const settings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'dark' as const,
        language: 'es' as const,
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should validate settings with sync disabled', () => {
      const settings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: false,
        },
        biometricAuthEnabled: true,
        theme: 'light' as const,
        language: 'en' as const,
        sync: {
          enabled: false,
          subscriptionTier: 'none' as const,
        },
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should validate settings with basic sync enabled', () => {
      const settings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'dark' as const,
        language: 'es' as const,
        sync: {
          enabled: true,
          subscriptionTier: 'basic' as const,
          lastSyncAt: new Date().toISOString(),
          deviceId: 'device_123e4567-e89b-12d3-a456-426614174000',
        },
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should validate settings with premium sync', () => {
      const settings = {
        notifications: {
          milestones: false,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: true,
        theme: 'system' as const,
        language: 'en' as const,
        sync: {
          enabled: true,
          subscriptionTier: 'premium' as const,
          lastSyncAt: '2024-01-15T10:30:00.000Z',
          deviceId: 'device_987e6543-e89b-12d3-a456-426614174000',
        },
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should reject invalid subscription tier', () => {
      const settings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'light' as const,
        language: 'en' as const,
        sync: {
          enabled: true,
          subscriptionTier: 'invalid_tier',
        },
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should allow sync settings to be optional', () => {
      const settings = {
        notifications: {
          milestones: true,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'light' as const,
        language: 'en' as const,
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });
});

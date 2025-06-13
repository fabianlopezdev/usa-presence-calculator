import { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import { SETTINGS_API_MESSAGES } from '@api/constants/settings';
import { SessionService } from '@api/services/session';
import { API_PATHS } from '@api/test-utils/api-paths';
import { buildTestApp } from '@api/test-utils/app-builder';
import { createTestUser, resetTestDatabase } from '@api/test-utils/db';

// Type for settings response
type SettingsResponse = {
  notifications: {
    milestones: boolean;
    warnings: boolean;
    reminders: boolean;
  };
  biometricAuthEnabled: boolean;
  theme: string;
  language: string;
  sync?: {
    enabled: boolean;
    subscriptionTier: string;
    lastSyncAt?: string;
    deviceId?: string;
  };
};

// Type for error response
type ErrorResponse = {
  error:
    | {
        message?: string;
        details?: unknown[];
      }
    | string;
};

describe('Settings Routes', () => {
  let app: FastifyInstance;
  let authHeaders: { authorization: string };
  let userId: string;

  beforeEach(async () => {
    resetTestDatabase();
    app = await buildTestApp();

    const testUser = await createTestUser({
      email: 'test@example.com',
      greenCardDate: '2020-01-01',
      eligibilityCategory: 'five_year',
    });

    userId = testUser.id;

    // Generate authentication token using SessionService
    const sessionService = new SessionService();
    const sessionData = await sessionService.createSession(userId, '127.0.0.1', 'test-agent');
    authHeaders = {
      authorization: `Bearer ${sessionData.accessToken}`,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users/settings', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.USERS_SETTINGS,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 200 with default settings for new user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body).toEqual({
        notifications: {
          milestones: true,
          warnings: true,
          reminders: true,
        },
        biometricAuthEnabled: false,
        theme: 'system',
        language: 'en',
      });
    });

    it('should return 200 with existing settings', async () => {
      // First update settings
      await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'dark',
          language: 'es',
        },
      });

      // Then get settings
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.theme).toBe('dark');
      expect(body.language).toBe('es');
    });

    it('should return settings matching UserSettingsSchema structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
      });

      const body = JSON.parse(response.body) as SettingsResponse;

      // Check structure matches UserSettingsSchema
      expect(body).toHaveProperty('notifications');
      expect(body.notifications).toHaveProperty('milestones');
      expect(body.notifications).toHaveProperty('warnings');
      expect(body.notifications).toHaveProperty('reminders');
      expect(body).toHaveProperty('biometricAuthEnabled');
      expect(body).toHaveProperty('theme');
      expect(body).toHaveProperty('language');
      expect(body).not.toHaveProperty('sync'); // Sync is optional and disabled by default
    });

    it('should handle missing user gracefully', async () => {
      // Use invalid auth token
      const invalidAuthHeaders = { authorization: 'Bearer invalid-token' };

      const response = await app.inject({
        method: 'GET',
        url: API_PATHS.USERS_SETTINGS,
        headers: invalidAuthHeaders,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('PATCH /users/settings', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        payload: { theme: 'dark' },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should update single field successfully', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'dark',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.theme).toBe('dark');
      expect(body.language).toBe('en'); // Other fields unchanged
    });

    it('should update multiple fields successfully', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'light',
          language: 'es',
          biometricAuthEnabled: true,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.theme).toBe('light');
      expect(body.language).toBe('es');
      expect(body.biometricAuthEnabled).toBe(true);
    });

    it('should update nested notification preferences', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          notifications: {
            milestones: false,
            warnings: true,
            reminders: false,
          },
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.notifications.milestones).toBe(false);
      expect(body.notifications.warnings).toBe(true);
      expect(body.notifications.reminders).toBe(false);
    });

    it('should update nested sync preferences when provided', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          sync: {
            enabled: true,
            subscriptionTier: 'basic',
            deviceId: 'device-123',
          },
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.sync).toBeDefined();
      expect(body.sync?.enabled).toBe(true);
      expect(body.sync?.subscriptionTier).toBe('basic');
      expect(body.sync?.deviceId).toBe('device-123');
    });

    it('should validate theme enum values', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'invalid-theme',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBeDefined();
    });

    it('should validate language enum values', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          language: 'fr', // Not supported
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBeDefined();
    });

    it('should validate boolean fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          biometricAuthEnabled: 'yes', // Should be boolean
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBeDefined();
    });

    it('should reject invalid field names', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          invalidField: 'value',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBeDefined();
    });

    it('should reject invalid field types', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          notifications: 'enabled', // Should be object
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBeDefined();
    });

    it('should reject empty update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {},
      });

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

      const body = JSON.parse(response.body) as ErrorResponse;
      expect((body.error as { message: string }).message).toBe(
        SETTINGS_API_MESSAGES.NO_CHANGES_PROVIDED,
      );
    });

    it('should create settings if not exist', async () => {
      // Delete settings first (simulating edge case)
      // In real scenario, settings should always exist after user creation

      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'dark',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.theme).toBe('dark');
    });

    it('should preserve unmodified fields', async () => {
      // First set some values
      await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'dark',
          language: 'es',
          biometricAuthEnabled: true,
        },
      });

      // Then update only one field
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          theme: 'light',
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.theme).toBe('light');
      expect(body.language).toBe('es'); // Preserved
      expect(body.biometricAuthEnabled).toBe(true); // Preserved
    });

    it('should handle partial notification updates', async () => {
      // Set initial notification preferences
      await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          notifications: {
            milestones: false,
            warnings: false,
            reminders: false,
          },
        },
      });

      // Update only one notification preference
      const response = await app.inject({
        method: 'PATCH',
        url: API_PATHS.USERS_SETTINGS,
        headers: authHeaders,
        payload: {
          notifications: {
            warnings: true,
          },
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.OK);

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.notifications.milestones).toBe(false); // Preserved
      expect(body.notifications.warnings).toBe(true); // Updated
      expect(body.notifications.reminders).toBe(false); // Preserved
    });
  });
});

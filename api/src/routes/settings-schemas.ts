import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

import { HTTP_STATUS } from '@api/constants/http';

const UpdateSettingsSchema = z
  .object({
    notifications: z
      .object({
        milestones: z.boolean().optional(),
        warnings: z.boolean().optional(),
        reminders: z.boolean().optional(),
      })
      .strict()
      .optional(),
    biometricAuthEnabled: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.enum(['en', 'es']).optional(),
    sync: z
      .object({
        enabled: z.boolean().optional(),
        subscriptionTier: z.enum(['none', 'basic', 'premium']).optional(),
        lastSyncAt: z.string().datetime().optional(),
        deviceId: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const settingsRouteDefinitions = {
  getSettings: {
    tags: ['users'],
    summary: 'Get user settings',
    description:
      'Retrieves current user settings including notification preferences, theme, and language',
    response: {
      [HTTP_STATUS.OK]: {
        description: 'User settings retrieved successfully',
        type: 'object',
        properties: {
          notifications: {
            type: 'object',
            properties: {
              milestones: { type: 'boolean' },
              warnings: { type: 'boolean' },
              reminders: { type: 'boolean' },
            },
          },
          biometricAuthEnabled: { type: 'boolean' },
          theme: { type: 'string', enum: ['system', 'light', 'dark'] },
          language: { type: 'string', enum: ['en', 'es'] },
          sync: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              subscriptionTier: { type: 'string', enum: ['none', 'basic', 'premium'] },
              lastSyncAt: { type: 'string' },
              deviceId: { type: 'string' },
            },
          },
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'User not authenticated',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  updateSettings: {
    tags: ['users'],
    summary: 'Update user settings',
    description: 'Updates user settings with partial data',
    body: zodToJsonSchema(UpdateSettingsSchema),
    response: {
      [HTTP_STATUS.OK]: {
        description: 'Settings updated successfully',
        type: 'object',
        properties: {
          notifications: {
            type: 'object',
            properties: {
              milestones: { type: 'boolean' },
              warnings: { type: 'boolean' },
              reminders: { type: 'boolean' },
            },
          },
          biometricAuthEnabled: { type: 'boolean' },
          theme: { type: 'string', enum: ['system', 'light', 'dark'] },
          language: { type: 'string', enum: ['en', 'es'] },
          sync: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              subscriptionTier: { type: 'string', enum: ['none', 'basic', 'premium'] },
              lastSyncAt: { type: 'string' },
              deviceId: { type: 'string' },
            },
          },
        },
      },
      [HTTP_STATUS.BAD_REQUEST]: {
        description: 'Invalid request body',
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'User not authenticated',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};

import { zodToJsonSchema } from 'zod-to-json-schema';

import { HTTP_STATUS } from '@api/constants/http';
import {
  PasskeyRegisterOptionsSchema,
  PasskeyRegisterVerifySchema,
  PasskeyAuthenticateOptionsSchema,
  PasskeyAuthenticateVerifySchema,
  MagicLinkSendSchema,
  MagicLinkVerifySchema,
  RefreshTokenSchema,
} from './auth-handlers';

export const passkeyRegisterOptionsSchema = {
  tags: ['Authentication'],
  summary: 'Generate passkey registration options',
  description: 'Generates WebAuthn registration options for passkey enrollment',
  body: zodToJsonSchema(PasskeyRegisterOptionsSchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Registration options generated successfully',
      type: 'object',
    },
    [HTTP_STATUS.BAD_REQUEST]: {
      description: 'Invalid request parameters',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    [HTTP_STATUS.NOT_FOUND]: {
      description: 'User not found',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const passkeyRegisterVerifySchema = {
  tags: ['Authentication'],
  summary: 'Verify passkey registration',
  description: 'Verifies WebAuthn registration response and saves the credential',
  body: zodToJsonSchema(PasskeyRegisterVerifySchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Passkey registered successfully',
      type: 'object',
      properties: { verified: { type: 'boolean' } },
    },
    [HTTP_STATUS.BAD_REQUEST]: {
      description: 'Invalid registration response',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const passkeyAuthenticateOptionsSchema = {
  tags: ['Authentication'],
  summary: 'Generate passkey authentication options',
  description: 'Generates WebAuthn authentication options for passkey login',
  body: zodToJsonSchema(PasskeyAuthenticateOptionsSchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Authentication options generated successfully',
      type: 'object',
    },
  },
};

export const passkeyAuthenticateVerifySchema = {
  tags: ['Authentication'],
  summary: 'Verify passkey authentication',
  description: 'Verifies WebAuthn authentication response and creates a session',
  body: zodToJsonSchema(PasskeyAuthenticateVerifySchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Authentication successful',
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: 'Authentication failed',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const magicLinkSendSchema = {
  tags: ['Authentication'],
  summary: 'Send magic link',
  description: 'Sends a magic link to the specified email address',
  body: zodToJsonSchema(MagicLinkSendSchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Magic link sent successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    [HTTP_STATUS.TOO_MANY_REQUESTS]: {
      description: 'Rate limit exceeded',
      type: 'object',
      properties: {
        error: { type: 'string' },
        attemptsRemaining: { type: 'number' },
        resetAt: { type: 'string', format: 'date-time' },
      },
    },
    [HTTP_STATUS.NOT_FOUND]: {
      description: 'User not found',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const magicLinkVerifySchema = {
  tags: ['Authentication'],
  summary: 'Verify magic link',
  description: 'Verifies a magic link token and creates a session',
  body: zodToJsonSchema(MagicLinkVerifySchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Magic link verified successfully',
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: 'Invalid or expired token',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const sessionInfoSchema = {
  tags: ['Authentication'],
  summary: 'Get current session info',
  description: 'Returns information about the current authenticated session',
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Session info retrieved successfully',
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
        emailVerified: { type: 'boolean' },
        greenCardDate: { type: 'string' },
        eligibilityCategory: { type: 'string' },
      },
    },
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: 'Invalid or missing token',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const refreshTokenRouteSchema = {
  tags: ['Authentication'],
  summary: 'Refresh access token',
  description: 'Exchanges a refresh token for a new access token',
  body: zodToJsonSchema(RefreshTokenSchema),
  response: {
    [HTTP_STATUS.OK]: {
      description: 'Token refreshed successfully',
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: 'Invalid or expired refresh token',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const logoutSchema = {
  tags: ['Authentication'],
  summary: 'Logout user',
  description: 'Invalidates the current session',
  body: zodToJsonSchema(RefreshTokenSchema),
  response: {
    [HTTP_STATUS.NO_CONTENT]: {
      description: 'Logout successful',
    },
  },
};

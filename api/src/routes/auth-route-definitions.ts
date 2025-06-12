import { FastifyInstance } from 'fastify';

import { authRateLimits } from '@api/middleware/rate-limit';
import { MagicLinkService } from '@api/services/magic-link';
import { PasskeyService } from '@api/services/passkey';
import { SessionService } from '@api/services/session';
import {
  handlePasskeyRegisterOptions,
  handlePasskeyRegisterVerify,
  handlePasskeyAuthenticateOptions,
  handlePasskeyAuthenticateVerify,
  handleMagicLinkSend,
  handleMagicLinkVerify,
  handleGetSession,
  handleRefreshToken,
  handleLogout,
} from './auth-handlers';
import {
  passkeyRegisterOptionsSchema,
  passkeyRegisterVerifySchema,
  passkeyAuthenticateOptionsSchema,
  passkeyAuthenticateVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema,
  sessionInfoSchema,
  refreshTokenRouteSchema,
  logoutSchema,
} from './auth-schemas';

export function registerPasskeyRoutes(
  fastify: FastifyInstance,
  passkeyService: PasskeyService,
  sessionService: SessionService,
): void {
  fastify.post(
    '/auth/passkey/register/options',
    {
      schema: passkeyRegisterOptionsSchema,
      config: {
        rateLimit: authRateLimits.passkeyRegister,
      },
    },
    async (request, reply) => handlePasskeyRegisterOptions(request, reply, passkeyService),
  );

  fastify.post(
    '/auth/passkey/register/verify',
    {
      schema: passkeyRegisterVerifySchema,
      config: {
        rateLimit: authRateLimits.passkeyRegister,
      },
    },
    async (request, reply) => handlePasskeyRegisterVerify(request, reply, passkeyService),
  );

  fastify.post(
    '/auth/passkey/authenticate/options',
    {
      schema: passkeyAuthenticateOptionsSchema,
      config: {
        rateLimit: authRateLimits.passkeyAuthenticate,
      },
    },
    async (request, reply) => handlePasskeyAuthenticateOptions(request, reply, passkeyService),
  );

  fastify.post(
    '/auth/passkey/authenticate/verify',
    {
      schema: passkeyAuthenticateVerifySchema,
      config: {
        rateLimit: authRateLimits.passkeyAuthenticate,
      },
    },
    async (request, reply) =>
      handlePasskeyAuthenticateVerify(request, reply, passkeyService, sessionService),
  );
}

export function registerMagicLinkRoutes(
  fastify: FastifyInstance,
  magicLinkService: MagicLinkService,
  sessionService: SessionService,
): void {
  fastify.post(
    '/auth/magic-link/send',
    {
      schema: magicLinkSendSchema,
      config: {
        rateLimit: authRateLimits.magicLinkSend,
      },
    },
    async (request, reply) => handleMagicLinkSend(request, reply, magicLinkService),
  );

  fastify.post(
    '/auth/magic-link/verify',
    {
      schema: magicLinkVerifySchema,
      config: {
        rateLimit: authRateLimits.magicLinkVerify,
      },
    },
    async (request, reply) =>
      handleMagicLinkVerify(request, reply, magicLinkService, sessionService),
  );
}

export function registerSessionRoutes(
  fastify: FastifyInstance,
  sessionService: SessionService,
): void {
  fastify.get(
    '/auth/session',
    {
      schema: sessionInfoSchema,
      config: {
        rateLimit: authRateLimits.sessionInfo,
      },
    },
    async (request, reply) => handleGetSession(request, reply, sessionService),
  );

  fastify.post(
    '/auth/refresh',
    {
      schema: refreshTokenRouteSchema,
      config: {
        rateLimit: authRateLimits.refreshToken,
      },
    },
    async (request, reply) => handleRefreshToken(request, reply, sessionService),
  );

  fastify.post(
    '/auth/logout',
    {
      schema: logoutSchema,
      config: {
        rateLimit: authRateLimits.logout,
      },
    },
    async (request, reply) => handleLogout(request, reply, sessionService),
  );
}

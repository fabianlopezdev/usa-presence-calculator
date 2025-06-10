import { FastifyPluginCallback } from 'fastify';

import { PasskeyService } from '@api/services/passkey';
import { MagicLinkService } from '@api/services/magic-link';
import { SessionService } from '@api/services/session';
import {
  registerPasskeyRoutes,
  registerMagicLinkRoutes,
  registerSessionRoutes,
} from './auth-route-definitions';

const authRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  const passkeyService = new PasskeyService();
  const magicLinkService = new MagicLinkService();
  const sessionService = new SessionService();

  // Register passkey routes
  registerPasskeyRoutes(fastify, passkeyService, sessionService);

  // Register magic link routes
  registerMagicLinkRoutes(fastify, magicLinkService, sessionService);

  // Register session routes
  registerSessionRoutes(fastify, sessionService);

  done();
};

export default authRoute;

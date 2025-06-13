import { FastifyInstance, preHandlerHookHandler } from 'fastify';
import fp from 'fastify-plugin';

import { authenticateUser } from '@api/middleware/auth';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: preHandlerHookHandler;
  }
}

function requireAuthPlugin(fastify: FastifyInstance): void {
  // Simply use the existing authenticateUser middleware as the requireAuth decorator
  fastify.decorate('requireAuth', authenticateUser);
}

export default fp(requireAuthPlugin, {
  name: 'require-auth',
  dependencies: [],
});

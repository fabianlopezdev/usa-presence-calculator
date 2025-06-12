import { createId } from '@paralleldrive/cuid2';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    id: string;
  }
}

export const requestIdPlugin = fp(
  (fastify: FastifyInstance) => {
    fastify.addHook('onRequest', (request, reply, done) => {
      // Check if request already has an ID (from load balancer or proxy)
      const existingId = request.headers['x-request-id'] || request.headers['x-correlation-id'];

      // Use existing ID or generate new one
      request.id = typeof existingId === 'string' ? existingId : createId();

      // Add request ID to response headers
      reply.header('x-request-id', request.id);
      done();
    });
  },
  {
    name: 'request-id',
  },
);

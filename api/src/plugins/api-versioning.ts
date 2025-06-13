import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    apiVersion: string;
  }
}

interface ApiVersioningOptions {
  prefix?: string;
}

function apiVersioningPlugin(
  fastify: FastifyInstance,
  options: ApiVersioningOptions,
  done: (err?: Error) => void,
): void {
  const prefix = options.prefix || '/api/v1';

  // Decorate instance with the API version for reference
  fastify.decorate('apiVersion', 'v1');

  // Log the API version being used
  fastify.log.info({ apiVersion: 'v1', prefix }, 'API versioning enabled');

  done();
}

export default fp(apiVersioningPlugin, {
  name: 'api-versioning',
  dependencies: [],
});

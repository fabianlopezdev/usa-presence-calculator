import helmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { config } from '@api/config/env';
import { HELMET_CONFIG } from '@api/constants/helmet';

async function helmetPlugin(fastify: FastifyInstance): Promise<void> {
  const isDevelopment = config.NODE_ENV === 'development';
  const isTest = config.NODE_ENV === 'test';

  // Skip helmet in test environment to avoid interfering with tests
  if (isTest) {
    fastify.log.debug('Skipping helmet in test environment');
    return;
  }

  const helmetConfig = isDevelopment ? HELMET_CONFIG.DEVELOPMENT : HELMET_CONFIG.PRODUCTION;

  await fastify.register(helmet, helmetConfig);

  // Log security headers in development for debugging
  if (isDevelopment) {
    fastify.addHook('onSend', async (_request, reply) => {
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
      ];

      const headers: Record<string, string | undefined> = {};
      securityHeaders.forEach((header) => {
        const value = reply.getHeader(header);
        if (value) {
          headers[header] = value as string;
        }
      });

      if (Object.keys(headers).length > 0) {
        fastify.log.debug({ securityHeaders: headers }, 'Security headers set');
      }
    });
  }
}

export default fp(helmetPlugin, {
  name: 'helmet',
});
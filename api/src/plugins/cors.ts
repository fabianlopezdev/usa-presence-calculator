import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { config } from '@api/config/env';
import { CORS_CONFIG } from '@api/constants/cors';

async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  const environment = config.NODE_ENV.toUpperCase() as 'PRODUCTION' | 'DEVELOPMENT' | 'TEST';
  const corsConfig = CORS_CONFIG[environment] || CORS_CONFIG.DEVELOPMENT;

  await fastify.register(cors, corsConfig);

  fastify.log.info(
    {
      environment: config.NODE_ENV,
      corsConfig: {
        ...corsConfig,
        origin:
          typeof corsConfig.origin === 'function'
            ? 'function'
            : corsConfig.origin,
      },
    },
    'CORS plugin registered',
  );
}

export default fp(corsPlugin, {
  name: 'cors',
});
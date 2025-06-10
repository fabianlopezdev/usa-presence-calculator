import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from '@api/config/env';
import { SWAGGER_CONFIG } from '@api/constants/documentation';

const swaggerPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  void fastify.register(swagger, {
    openapi: {
      openapi: SWAGGER_CONFIG.OPENAPI_VERSION,
      info: {
        title: SWAGGER_CONFIG.TITLE,
        description: SWAGGER_CONFIG.DESCRIPTION,
        version: SWAGGER_CONFIG.VERSION,
      },
      servers: [
        {
          url: config.NODE_ENV === 'production' 
            ? SWAGGER_CONFIG.PRODUCTION_URL 
            : SWAGGER_CONFIG.DEVELOPMENT_URL,
          description: config.NODE_ENV === 'production' 
            ? 'Production server' 
            : 'Development server',
        },
      ],
      tags: [...SWAGGER_CONFIG.TAGS],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  void fastify.register(swaggerUi, {
    routePrefix: SWAGGER_CONFIG.UI_ROUTE,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => swaggerObject,
  });
  
  done();
};

export default fp(swaggerPlugin, {
  name: 'swagger',
  fastify: '5.x',
});
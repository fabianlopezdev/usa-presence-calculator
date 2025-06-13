import basicAuth from '@fastify/basic-auth';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import crypto from 'node:crypto';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { config } from '@api/config/env';
import { SWAGGER_CONFIG } from '@api/constants/documentation';

function timingSafeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    crypto.timingSafeEqual(aBuffer, aBuffer);
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

async function registerSwaggerAuth(fastify: FastifyInstance): Promise<void> {
  await fastify.register(basicAuth, {
    validate(username, password, _req, _reply, done) {
      const validUsername = config.SWAGGER_USERNAME || '';
      const validPassword = config.SWAGGER_PASSWORD || '';

      let result = true;
      result = timingSafeCompare(username, validUsername) && result;
      result = timingSafeCompare(password, validPassword) && result;

      if (result) {
        done();
      } else {
        done(new Error('Unauthorized'));
      }
    },
    authenticate: true,
  });
}

function getSwaggerOptions(isProduction: boolean): Parameters<typeof swagger>[1] {
  return {
    openapi: {
      openapi: SWAGGER_CONFIG.OPENAPI_VERSION,
      info: {
        title: SWAGGER_CONFIG.TITLE,
        description: SWAGGER_CONFIG.DESCRIPTION,
        version: SWAGGER_CONFIG.VERSION,
      },
      servers: [
        {
          url: isProduction ? SWAGGER_CONFIG.PRODUCTION_URL : SWAGGER_CONFIG.DEVELOPMENT_URL,
          description: isProduction ? 'Production server' : 'Development server',
        },
      ],
      tags: [...SWAGGER_CONFIG.TAGS],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http' as const,
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  };
}

function getSwaggerUiOptions(
  swaggerAuthEnabled: boolean,
  fastify: FastifyInstance,
): Parameters<typeof swaggerUi>[1] {
  const baseOptions = {
    routePrefix: SWAGGER_CONFIG.UI_ROUTE,
    uiConfig: {
      docExpansion: 'list' as const,
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: Record<string, unknown>) => swaggerObject,
  };

  if (swaggerAuthEnabled) {
    return {
      ...baseOptions,
      uiHooks: {
        onRequest: fastify.basicAuth,
        preHandler: (
          request: { ip: string; headers: Record<string, unknown> },
          _reply: unknown,
          next: () => void,
        ) => {
          fastify.log.info(
            { ip: request.ip, userAgent: request.headers['user-agent'] },
            'Swagger UI accessed',
          );
          next();
        },
      },
    };
  }

  return baseOptions;
}

async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  const isProduction = config.NODE_ENV === 'production';
  const isTest = config.NODE_ENV === 'test';
  const swaggerAuthEnabled = isProduction && !!config.SWAGGER_USERNAME && !!config.SWAGGER_PASSWORD;

  if (!config.ENABLE_SWAGGER || isTest) {
    fastify.log.info('Swagger documentation disabled');
    return;
  }

  await fastify.register(swagger, getSwaggerOptions(isProduction));

  if (swaggerAuthEnabled) {
    await registerSwaggerAuth(fastify);
    fastify.log.info('Swagger UI authentication enabled');
  }

  await fastify.register(swaggerUi, getSwaggerUiOptions(swaggerAuthEnabled, fastify));

  fastify.log.info(
    {
      route: SWAGGER_CONFIG.UI_ROUTE,
      authEnabled: swaggerAuthEnabled,
      environment: config.NODE_ENV,
    },
    'Swagger UI registered',
  );
}

export default fp(swaggerPlugin, {
  name: 'swagger',
  fastify: '5.x',
});

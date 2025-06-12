import fastify, { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

import { config } from '@api/config/env';
import { HTTP_STATUS } from '@api/constants/http';
import rateLimitPlugin from '@api/plugins/rate-limit';
import swaggerPlugin from '@api/plugins/swagger';
import authRoute from '@api/routes/auth';
import healthRoute from '@api/routes/health';
import settingsRoutes from '@api/routes/settings';
import syncRoutes from '@api/routes/sync';
import { tripRoutes } from '@api/routes/trips';
import userRoutes from '@api/routes/users';

function createErrorHandler() {
  return (error: FastifyError, request: FastifyRequest, reply: FastifyReply): void => {
    request.log.error(error);

    // Handle validation errors
    if (error.validation) {
      reply.status(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.validation,
        },
      });
      return;
    }

    // Handle other errors
    reply.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: {
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
      },
    });
  };
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : config.NODE_ENV === 'production'
          ? true
          : {
              transport: {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              },
            },
    ajv: {
      customOptions: {
        removeAdditional: false, // We handle validation ourselves with Zod
        coerceTypes: false,
        useDefaults: false,
      },
    },
  });

  // Set error handler
  app.setErrorHandler(createErrorHandler());

  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);

  await app.register(authRoute);
  await app.register(healthRoute);
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(settingsRoutes, { prefix: '/users' });
  await app.register(tripRoutes, { prefix: '/trips' });
  await app.register(syncRoutes);

  return app;
}

export async function startApp(): Promise<FastifyInstance> {
  const app = await buildApp();

  try {
    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });
    return app;
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

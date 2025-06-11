import fastify, { FastifyInstance } from 'fastify';

import { config } from '@api/config/env';
import swaggerPlugin from '@api/plugins/swagger';
import authRoute from '@api/routes/auth';
import healthRoute from '@api/routes/health';
import settingsRoutes from '@api/routes/settings';
import userRoutes from '@api/routes/users';

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
  });

  await app.register(swaggerPlugin);

  await app.register(authRoute);
  await app.register(healthRoute);
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(settingsRoutes, { prefix: '/users' });

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

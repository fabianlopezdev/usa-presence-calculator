import fastify, { FastifyInstance } from 'fastify';

import { config } from '@api/config/env';
import { requestIdPlugin } from '@api/middleware/request-id';
import { shutdownMiddleware } from '@api/middleware/shutdown';
import { loggerPlugin } from '@api/plugins/logger';
import rateLimitPlugin from '@api/plugins/rate-limit';
import swaggerPlugin from '@api/plugins/swagger';
import authRoute from '@api/routes/auth';
import healthRoute from '@api/routes/health';
import healthEnhancedRoute from '@api/routes/health-enhanced';
import settingsRoutes from '@api/routes/settings';
import syncRoutes from '@api/routes/sync';
import { tripRoutes } from '@api/routes/trips';
import userRoutes from '@api/routes/users';
import { createGlobalErrorHandler } from '@api/utils/global-error-handler';
import { setupGracefulShutdown } from '@api/utils/graceful-shutdown';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    // Logger will be configured by the logger plugin
    logger: false,
    ajv: {
      customOptions: {
        removeAdditional: false, // We handle validation ourselves with Zod
        coerceTypes: false,
        useDefaults: false,
      },
    },
  });

  // Register core plugins first
  await app.register(requestIdPlugin);
  await app.register(loggerPlugin);

  // Add shutdown middleware before other routes
  app.addHook('preHandler', shutdownMiddleware);

  // Register rate limit before error handler so it can handle its own errors
  await app.register(rateLimitPlugin);

  // Set error handler after rate limit plugin
  app.setErrorHandler(createGlobalErrorHandler());
  await app.register(swaggerPlugin);

  await app.register(authRoute);
  await app.register(healthRoute);
  await app.register(healthEnhancedRoute);
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

    // Setup graceful shutdown after server starts
    setupGracefulShutdown(app);

    return app;
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

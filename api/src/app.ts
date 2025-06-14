import fastify, { FastifyInstance } from 'fastify';

import { config } from '@api/config/env';
import { API_VERSION } from '@api/constants/api-versioning';
import { BODY_LIMITS } from '@api/constants/body-limits';
import { SERVER_TIMEOUTS } from '@api/constants/timeout';
import { requestIdPlugin } from '@api/middleware/request-id';
import { shutdownMiddleware } from '@api/middleware/shutdown';
import apiVersioningPlugin from '@api/plugins/api-versioning';
import corsPlugin from '@api/plugins/cors';
import helmetPlugin from '@api/plugins/helmet';
import { loggerPlugin } from '@api/plugins/logger';
import rateLimitPlugin from '@api/plugins/rate-limit';
import requestContextPlugin from '@api/plugins/request-context';
import requireAuthPlugin from '@api/plugins/require-auth';
import swaggerPlugin from '@api/plugins/swagger';
import timeoutPlugin from '@api/plugins/timeout';
import authRoute from '@api/routes/auth';
import cspReportRoute from '@api/routes/csp-report';
import healthRoute from '@api/routes/health';
import healthEnhancedRoute from '@api/routes/health-enhanced';
import settingsRoutes from '@api/routes/settings';
import syncRoutes from '@api/routes/sync';
import { tripRoutes } from '@api/routes/trips';
import userRoutes from '@api/routes/users';
import { createGlobalErrorHandler } from '@api/utils/global-error-handler';
import { setupGracefulShutdown } from '@api/utils/graceful-shutdown';

async function registerPlugins(app: FastifyInstance): Promise<void> {
  // Register core plugins first
  await app.register(requestIdPlugin);
  await app.register(loggerPlugin);
  await app.register(requestContextPlugin);

  // Security plugins should be registered early
  await app.register(corsPlugin);
  await app.register(helmetPlugin);

  // Register authentication plugin before routes
  await app.register(requireAuthPlugin);

  // Register timeout plugin before routes
  await app.register(timeoutPlugin);

  // Add shutdown middleware before other routes
  app.addHook('preHandler', shutdownMiddleware);

  // Register rate limit before error handler so it can handle its own errors
  await app.register(rateLimitPlugin);

  // Set error handler after rate limit plugin
  app.setErrorHandler(createGlobalErrorHandler());
  await app.register(swaggerPlugin);
}

async function registerUnversionedRoutes(app: FastifyInstance): Promise<void> {
  // Health checks and monitoring endpoints should be available without versioning
  await app.register(healthRoute);
  await app.register(healthEnhancedRoute);
}

async function registerVersionedRoutes(app: FastifyInstance): Promise<void> {
  // Register all API routes under versioned prefix
  await app.register(
    async (versionedApp) => {
      // Auth routes
      await versionedApp.register(authRoute);

      // User and settings routes
      await versionedApp.register(userRoutes, { prefix: '/users' });
      await versionedApp.register(settingsRoutes, { prefix: '/users' });

      // Trip routes
      await versionedApp.register(tripRoutes, { prefix: '/trips' });

      // Sync routes
      await versionedApp.register(syncRoutes);

      // CSP report route (needed for security headers)
      await versionedApp.register(cspReportRoute);
    },
    { prefix: API_VERSION.PREFIX },
  );
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    // Logger will be configured by the logger plugin
    logger: false,
    bodyLimit: BODY_LIMITS.DEFAULT,
    // Protect against prototype poisoning
    onProtoPoisoning: 'remove',
    onConstructorPoisoning: 'remove',
    // Connection and request timeouts
    connectionTimeout: SERVER_TIMEOUTS.CONNECTION_TIMEOUT,
    keepAliveTimeout: SERVER_TIMEOUTS.KEEP_ALIVE_TIMEOUT,
    // Note: requestTimeout is handled by our custom timeout plugin for route-specific timeouts
    ajv: {
      customOptions: {
        removeAdditional: false, // We handle validation ourselves with Zod
        coerceTypes: false,
        useDefaults: false,
      },
    },
  });

  await registerPlugins(app);

  // Register API versioning
  await app.register(apiVersioningPlugin);

  // Register unversioned routes (health, monitoring)
  await registerUnversionedRoutes(app);

  // Register versioned API routes
  await registerVersionedRoutes(app);

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

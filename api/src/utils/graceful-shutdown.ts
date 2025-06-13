import { FastifyInstance } from 'fastify';

import { SHUTDOWN } from '@api/constants/shutdown';
import { closeDatabase } from '@api/db/connection';

let isShuttingDown = false;

export function resetShutdownState(): void {
  isShuttingDown = false;
}

async function performShutdown(app: FastifyInstance, signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  app.log.info(`${SHUTDOWN.MESSAGES.RECEIVED}: ${signal}`);

  // Set a timeout to force exit if shutdown takes too long
  const timeoutId = setTimeout(() => {
    app.log.error(SHUTDOWN.MESSAGES.TIMEOUT);
    process.exit(1);
  }, SHUTDOWN.TIMEOUT_MS);

  try {
    // Close the HTTP server
    app.log.info(SHUTDOWN.MESSAGES.CLOSING_SERVER);
    await app.close();
    app.log.info(SHUTDOWN.MESSAGES.SERVER_CLOSED);

    // Close database connections
    app.log.info(SHUTDOWN.MESSAGES.CLOSING_DATABASE);
    closeDatabase();
    app.log.info(SHUTDOWN.MESSAGES.DATABASE_CLOSED);

    // Clear the timeout since we're done
    clearTimeout(timeoutId);

    app.log.info(SHUTDOWN.MESSAGES.CLEANUP_COMPLETE);
    process.exit(0);
  } catch (error) {
    clearTimeout(timeoutId);
    app.log.error(`${SHUTDOWN.MESSAGES.ERROR}:`, error);
    process.exit(1);
  }
}

export function setupGracefulShutdown(app: FastifyInstance): void {
  // Register shutdown handlers for each signal
  SHUTDOWN.SIGNALS.forEach((signal) => {
    process.once(signal, () => {
      void performShutdown(app, signal);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    app.log.fatal('Uncaught Exception:', error);
    void performShutdown(app, 'uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    app.log.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
    void performShutdown(app, 'unhandledRejection');
  });
}

export function isAppShuttingDown(): boolean {
  return isShuttingDown;
}

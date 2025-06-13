import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { closeDatabase } from '@api/db/connection';
import {
  setupGracefulShutdown,
  isAppShuttingDown,
  resetShutdownState,
} from '@api/utils/graceful-shutdown';

vi.mock('@api/db/connection', () => ({
  closeDatabase: vi.fn(),
}));

type MockApp = Pick<FastifyInstance, 'log' | 'close'>;

describe('Graceful Shutdown Unit Tests', () => {
  let mockApp: MockApp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processExitSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setTimeoutSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clearTimeoutSpy: any;
  let originalListeners: Map<string, Array<(...args: unknown[]) => void>>;

  beforeEach(() => {
    resetShutdownState();

    mockApp = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        child: vi.fn().mockReturnThis(),
        level: 'info',
        silent: vi.fn(),
      } as unknown as FastifyBaseLogger,
      close: vi.fn().mockResolvedValue(undefined),
    } as MockApp;

    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    // Store original listeners
    originalListeners = new Map();
    ['SIGTERM', 'SIGINT', 'uncaughtException', 'unhandledRejection'].forEach((event) => {
      originalListeners.set(
        event,
        process.listeners(event as NodeJS.Signals) as Array<(...args: unknown[]) => void>,
      );
      process.removeAllListeners(event);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();

    // Restore original listeners
    originalListeners.forEach((listeners, event) => {
      process.removeAllListeners(event);
      listeners.forEach((listener) => {
        process.on(event, listener);
      });
    });
  });

  it('should setup signal handlers', () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    expect(process.listenerCount('SIGTERM')).toBe(1);
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('uncaughtException')).toBe(1);
    expect(process.listenerCount('unhandledRejection')).toBe(1);
  });

  it('should handle SIGTERM gracefully', async () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    process.emit('SIGTERM', 'SIGTERM');

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockApp.log.info).toHaveBeenCalledWith('Shutdown signal received: SIGTERM');
    expect(mockApp.close).toHaveBeenCalled();
    expect(closeDatabase).toHaveBeenCalled();
  });

  it('should handle SIGINT gracefully', async () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    process.emit('SIGINT', 'SIGINT');

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockApp.log.info).toHaveBeenCalledWith('Shutdown signal received: SIGINT');
    expect(mockApp.close).toHaveBeenCalled();
    expect(closeDatabase).toHaveBeenCalled();
  });

  it('should handle uncaught exceptions', async () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    const error = new Error('Uncaught error');
    process.emit('uncaughtException', error);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockApp.log.fatal).toHaveBeenCalledWith('Uncaught Exception:', error);
    expect(mockApp.close).toHaveBeenCalled();
  });

  it('should handle unhandled rejections', async () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    const reason = new Error('Unhandled rejection');
    const promise = Promise.reject(reason);
    process.emit('unhandledRejection', reason, promise);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockApp.log.fatal).toHaveBeenCalledWith(
      'Unhandled Rejection at:',
      promise,
      'reason:',
      reason,
    );
    expect(mockApp.close).toHaveBeenCalled();
  });

  it('should set timeout for shutdown', () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    process.emit('SIGTERM', 'SIGTERM');

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
  });

  it('should clear timeout on successful shutdown', async () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    process.emit('SIGTERM', 'SIGTERM');

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle shutdown errors', async () => {
    const error = new Error('Close failed');
    vi.mocked(mockApp.close).mockRejectedValue(error);

    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    process.emit('SIGTERM', 'SIGTERM');

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockApp.log.error).toHaveBeenCalledWith('Error during shutdown:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should only shutdown once', async () => {
    setupGracefulShutdown(mockApp as unknown as FastifyInstance);

    process.emit('SIGTERM', 'SIGTERM');
    process.emit('SIGTERM', 'SIGTERM');

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockApp.close).toHaveBeenCalledTimes(1);
  });

  it('should correctly report shutdown status', () => {
    expect(isAppShuttingDown()).toBe(false);

    setupGracefulShutdown(mockApp as unknown as FastifyInstance);
    process.emit('SIGTERM', 'SIGTERM');

    expect(isAppShuttingDown()).toBe(true);
  });
});

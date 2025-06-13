import { FastifyReply, FastifyRequest } from 'fastify';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import { shutdownMiddleware } from '@api/middleware/shutdown';
import { isAppShuttingDown } from '@api/utils/graceful-shutdown';

vi.mock('@api/utils/graceful-shutdown', () => ({
  isAppShuttingDown: vi.fn(),
}));

describe('Shutdown Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      log: {
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        child: vi.fn().mockReturnThis(),
        level: 'info',
        silent: vi.fn(),
      } as unknown as FastifyRequest['log'],
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue(undefined),
    };

    vi.clearAllMocks();
  });

  it('should allow requests when not shutting down', async () => {
    vi.mocked(isAppShuttingDown).mockReturnValue(false);

    await shutdownMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should reject requests when shutting down', async () => {
    vi.mocked(isAppShuttingDown).mockReturnValue(true);

    await shutdownMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.log?.warn).toHaveBeenCalledWith('Request rejected during shutdown');
    expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(mockReply.header).toHaveBeenCalledWith('Connection', 'close');
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Service Unavailable',
      message: 'Server is shutting down',
      code: 'SERVER_SHUTTING_DOWN',
    });
  });

  it('should return 503 status code during shutdown', async () => {
    vi.mocked(isAppShuttingDown).mockReturnValue(true);

    await shutdownMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(503);
  });

  it('should set Connection: close header', async () => {
    vi.mocked(isAppShuttingDown).mockReturnValue(true);

    await shutdownMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.header).toHaveBeenCalledWith('Connection', 'close');
  });
});

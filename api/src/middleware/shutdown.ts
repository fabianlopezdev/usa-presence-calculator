import { FastifyReply, FastifyRequest } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { isAppShuttingDown } from '@api/utils/graceful-shutdown';

export async function shutdownMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (isAppShuttingDown()) {
    request.log.warn('Request rejected during shutdown');
    await reply.code(HTTP_STATUS.SERVICE_UNAVAILABLE).header('Connection', 'close').send({
      error: 'Service Unavailable',
      message: 'Server is shutting down',
      code: 'SERVER_SHUTTING_DOWN',
    });
  }
}

import { FastifyReply } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';

export function handleSyncPushError(error: unknown, reply: FastifyReply): void {
  if (error instanceof Error) {
    const errorMessage = error.message;

    if (errorMessage.startsWith('FORBIDDEN:')) {
      reply.code(HTTP_STATUS.FORBIDDEN).send({
        error: {
          message: errorMessage.substring(11),
          code: 'FORBIDDEN',
        },
      });
      return;
    }

    if (errorMessage.startsWith('INVALID_TRIP_DATA:')) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: errorMessage.substring(19),
          code: 'INVALID_TRIP_DATA',
        },
      });
      return;
    }

    if (errorMessage.startsWith('MISSING_REQUIRED_FIELDS:')) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: errorMessage.substring(25),
          code: 'MISSING_REQUIRED_FIELDS',
        },
      });
      return;
    }
  }

  reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
    error: {
      message: 'Failed to sync data',
      code: 'SYNC_ERROR',
    },
  });
}

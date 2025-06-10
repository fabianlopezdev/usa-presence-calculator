import { FastifyRequest, FastifyReply } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { AUTH_ERRORS } from '@api/constants/auth';
import { SessionService } from '@api/services/session';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      sessionId: string;
    };
  }
}

export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: AUTH_ERRORS.UNAUTHORIZED,
    });
  }

  const token = authHeader.substring(7);

  try {
    const sessionService = new SessionService();
    const payload = sessionService.verifyAccessToken(token);

    request.user = {
      userId: payload.userId,
      sessionId: payload.sessionId,
    };
  } catch {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: AUTH_ERRORS.INVALID_TOKEN,
    });
  }
}

import fp from 'fastify-plugin';
import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { REQUEST_TIMEOUTS, ROUTE_TIMEOUTS, TIMEOUT_MESSAGES } from '@api/constants/timeout';

declare module 'fastify' {
  interface FastifyRequest {
    timeoutHandle?: NodeJS.Timeout;
  }
}

function getTimeoutForRoute(request: FastifyRequest): number {
  // routerPath is available on the request context
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const routePath = (request as any).routerPath || '';

  // Check if we have a specific timeout for this route
  if (routePath && routePath in ROUTE_TIMEOUTS) {
    return ROUTE_TIMEOUTS[routePath as keyof typeof ROUTE_TIMEOUTS];
  }

  // Check for pattern matches
  const url = request.url.toLowerCase();

  if (url.includes('/health')) {
    return REQUEST_TIMEOUTS.FAST;
  }

  if (url.includes('/sync')) {
    return REQUEST_TIMEOUTS.LONG;
  }

  if (url.includes('/import') || url.includes('/export')) {
    return REQUEST_TIMEOUTS.UPLOAD;
  }

  if (url.includes('/auth')) {
    return REQUEST_TIMEOUTS.STANDARD;
  }

  // Default timeout
  return REQUEST_TIMEOUTS.DEFAULT;
}

function setupTimeoutHandler(request: FastifyRequest, reply: FastifyReply, timeout: number): void {
  request.timeoutHandle = setTimeout(() => {
    if (!reply.sent) {
      request.log.warn(
        {
          url: request.url,
          method: request.method,
          timeout,
        },
        'Request timeout',
      );

      reply.code(HTTP_STATUS.REQUEST_TIMEOUT).send({
        error: {
          message: TIMEOUT_MESSAGES.REQUEST,
          code: 'REQUEST_TIMEOUT',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, timeout);
}

function clearTimeoutHandler(request: FastifyRequest): void {
  if (request.timeoutHandle) {
    clearTimeout(request.timeoutHandle);
    request.timeoutHandle = undefined;
  }
}

const timeoutPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  // Add request timeout handling
  fastify.addHook('onRequest', (request, reply, done) => {
    const timeout = getTimeoutForRoute(request);
    setupTimeoutHandler(request, reply, timeout);

    // Log timeout configuration in development
    if (process.env.NODE_ENV === 'development') {
      request.log.debug(
        {
          url: request.url,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          routePath: (request as any).routerPath || 'unknown',
          timeout,
        },
        'Request timeout configured',
      );
    }
    done();
  });

  // Clear timeout when response is sent
  fastify.addHook('onSend', (request, _reply, _payload, done) => {
    clearTimeoutHandler(request);
    done();
  });

  // Clear timeout on error
  fastify.addHook('onError', (request, _reply, _error, done) => {
    clearTimeoutHandler(request);
    done();
  });

  fastify.log.info(
    {
      defaultTimeout: REQUEST_TIMEOUTS.DEFAULT,
      environment: process.env.NODE_ENV,
    },
    'Request timeout plugin registered',
  );

  done();
};

export default fp(timeoutPlugin, {
  name: 'timeout',
  fastify: '5.x',
});

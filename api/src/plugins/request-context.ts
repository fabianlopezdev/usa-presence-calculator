import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    context: RequestContext;
    startTime: number;
  }
}

export interface RequestContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method: string;
  path: string;
  timestamp: string;
  duration?: number;
}

// Helper functions
function initializeContext(request: FastifyRequest): void {
  request.startTime = Date.now();
  const correlationId = request.headers['x-correlation-id'] as string || 
    request.headers['x-request-id'] as string || request.id;

  request.context = {
    correlationId,
    requestId: request.id,
    method: request.method,
    path: request.url,
    timestamp: new Date().toISOString(),
    userAgent: request.headers['user-agent'],
    ip: request.ip,
  };
}

function enrichWithUser(request: FastifyRequest): void {
  if (request.user?.userId) {
    request.context.userId = request.user.userId;
  }
}

function logRequestCompletion(request: FastifyRequest): void {
  if (request.startTime) {
    request.context.duration = Date.now() - request.startTime;
  }
  request.log.info({
    context: request.context,
    statusCode: request.raw.statusCode,
  }, 'Request completed');
}

const requestContextPlugin: FastifyPluginAsync = (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', initializeContext);
  fastify.addHook('preHandler', enrichWithUser);
  fastify.addHook('onResponse', logRequestCompletion);
  fastify.addHook('onSend', (request, reply) => {
    reply.header('X-Correlation-ID', request.context.correlationId);
    reply.header('X-Request-ID', request.context.requestId);
  });
  fastify.decorate('getRequestContext', (request: FastifyRequest): RequestContext => request.context);
  fastify.decorate('withContext', <T>(
    context: RequestContext,
    fn: () => T | Promise<T>,
  ): T | Promise<T> => fn());
  return Promise.resolve();
};

export default fp(requestContextPlugin, {
  name: 'request-context',
});

// ===== CONTEXT UTILITIES =====

export function extractContext(request: FastifyRequest): RequestContext {
  return request.context;
}

export function enrichContext(
  request: FastifyRequest, 
  additional: Partial<RequestContext>,
): void {
  request.context = {
    ...request.context,
    ...additional,
  };
}

export function getCorrelationId(request: FastifyRequest): string {
  return request.context.correlationId;
}

export function getRequestDuration(request: FastifyRequest): number | undefined {
  if (!request.startTime) {
    return undefined;
  }
  return Date.now() - request.startTime;
}

// ===== CONTEXT LOGGING =====

export function logWithContext(
  request: FastifyRequest,
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  additional?: Record<string, unknown>,
): void {
  request.log[level]({
    ...request.context,
    ...additional,
  }, message);
}

export function createContextualLogger(request: FastifyRequest): {
  info: (message: string, additional?: Record<string, unknown>) => void;
  warn: (message: string, additional?: Record<string, unknown>) => void;
  error: (message: string, additional?: Record<string, unknown>) => void;
  debug: (message: string, additional?: Record<string, unknown>) => void;
} {
  return {
    info: (message: string, additional?: Record<string, unknown>) => 
      logWithContext(request, 'info', message, additional),
    warn: (message: string, additional?: Record<string, unknown>) => 
      logWithContext(request, 'warn', message, additional),
    error: (message: string, additional?: Record<string, unknown>) => 
      logWithContext(request, 'error', message, additional),
    debug: (message: string, additional?: Record<string, unknown>) => 
      logWithContext(request, 'debug', message, additional),
  };
}
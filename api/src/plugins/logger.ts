import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import pino from 'pino';

import { config } from '@api/config/env';
import {
  LOG_BODY_MAX_SIZE,
  LOG_IGNORE_ROUTES,
  LOG_MESSAGES,
  LOG_REDACT_PATHS,
  LOG_ROTATION,
} from '@api/constants/logging';

interface RequestSerializer {
  method: string;
  url: string;
  host: string;
  remoteAddress: string;
  remotePort?: number;
  requestId: string;
}

interface ReplySerializer {
  statusCode: number;
  requestId: string;
}

function getLogLevel(): string {
  return config.LOG_LEVEL || (config.NODE_ENV === 'production' ? 'info' : 'debug');
}

function shouldLogRoute(url: string): boolean {
  return !LOG_IGNORE_ROUTES.some((pattern) => {
    if (pattern.endsWith('*')) {
      return url.startsWith(pattern.slice(0, -1));
    }
    return url === pattern;
  });
}

function truncateBody(body: unknown): unknown {
  const bodyString = JSON.stringify(body);
  if (bodyString.length > LOG_BODY_MAX_SIZE) {
    return { message: LOG_MESSAGES.BODY_TOO_LARGE, size: bodyString.length };
  }
  return body;
}

function createRequestSerializer(): (request: FastifyRequest) => RequestSerializer {
  return (request: FastifyRequest) => {
    const serialized: RequestSerializer = {
      method: request.method,
      url: request.url,
      host: request.hostname,
      remoteAddress: request.ip,
      remotePort: request.socket.remotePort,
      requestId: request.id,
    };

    // Add body if present and route should be logged
    if (request.body && shouldLogRoute(request.url)) {
      (serialized as unknown as Record<string, unknown>).body = truncateBody(request.body);
    }

    return serialized;
  };
}

function createReplySerializer(): (reply: FastifyReply) => ReplySerializer {
  return (reply: FastifyReply) => ({
    statusCode: reply.statusCode,
    requestId: reply.request.id,
  });
}

function createBaseOptions(): pino.LoggerOptions {
  return {
    level: getLogLevel(),
    redact: {
      paths: LOG_REDACT_PATHS,
      censor: '[REDACTED]',
    },
    serializers: {
      req: createRequestSerializer(),
      res: createReplySerializer(),
      err: pino.stdSerializers.err,
    },
  };
}

function createDevelopmentLogger(): pino.Logger {
  return pino({
    ...createBaseOptions(),
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
        singleLine: false,
      },
    },
  });
}

function createProductionLogger(): pino.Logger {
  const baseOptions = createBaseOptions();

  if (LOG_ROTATION.ENABLED) {
    // Ensure log directory exists
    const logDir = path.resolve(LOG_ROTATION.DIRECTORY);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // Use pino with file rotation transport
    return pino(
      {
        ...baseOptions,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      },
      pino.multistream([
        // Console output
        { stream: process.stdout },
        // File output with rotation
        {
          stream: pino.transport({
            target: 'pino-roll',
            options: {
              file: path.join(logDir, `${LOG_ROTATION.FILE_PREFIX}.log`),
              frequency: LOG_ROTATION.INTERVAL,
              size: LOG_ROTATION.MAX_SIZE,
              compress: LOG_ROTATION.COMPRESS,
              limit: {
                count: LOG_ROTATION.MAX_FILES,
              },
            },
          }) as unknown as NodeJS.WritableStream,
        },
      ]),
    );
  }

  // Standard production logger without file rotation
  return pino({
    ...baseOptions,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  });
}

function createLogger(): pino.Logger | false {
  if (config.NODE_ENV === 'test') {
    return false;
  }

  if (config.NODE_ENV === 'development') {
    return createDevelopmentLogger();
  }

  return createProductionLogger();
}

function setupRequestLogging(fastify: FastifyInstance, logger: pino.Logger): void {
  fastify.addHook('onRequest', (request, _reply, done) => {
    request.log = logger.child({ requestId: request.id });

    // Log request start with body if present
    if (shouldLogRoute(request.url)) {
      const logData: Record<string, unknown> = {
        msg: LOG_MESSAGES.REQUEST_START,
        method: request.method,
        url: request.url,
      };

      if (request.body) {
        logData.body = truncateBody(request.body);
      }

      request.log.info(logData);
    }

    done();
  });
}

function setupResponseLogging(fastify: FastifyInstance): void {
  fastify.addHook('onResponse', (request, reply, done) => {
    if (shouldLogRoute(request.url)) {
      const logData: Record<string, unknown> = {
        msg: LOG_MESSAGES.REQUEST_COMPLETE,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      };

      // Try to get response payload if available
      const payload = (reply as unknown as Record<string, unknown>).payload;
      if (payload && typeof payload === 'string') {
        try {
          const parsedPayload = JSON.parse(payload) as unknown;
          logData.response = truncateBody(parsedPayload);
        } catch {
          // If not JSON, just include length
          logData.responseSize = payload.length;
        }
      }

      request.log.info(logData);
    }
    done();
  });
}

export const loggerPlugin = fp(
  (fastify: FastifyInstance) => {
    const logger = createLogger();

    if (logger) {
      fastify.log = logger;
      setupRequestLogging(fastify, logger);
      setupResponseLogging(fastify);
    }
  },
  {
    name: 'logger',
  },
);

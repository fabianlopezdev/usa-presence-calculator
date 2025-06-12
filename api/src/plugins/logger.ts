import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import pino from 'pino';

import { config } from '@api/config/env';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.secret',
  '*.creditCard',
  '*.ssn',
];

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

function createRequestSerializer(): (request: FastifyRequest) => RequestSerializer {
  return (request: FastifyRequest) => ({
    method: request.method,
    url: request.url,
    host: request.hostname,
    remoteAddress: request.ip,
    remotePort: request.socket.remotePort,
    requestId: request.id,
  });
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
      paths: redactPaths,
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
  return pino({
    ...createBaseOptions(),
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

export const loggerPlugin = fp(
  (fastify: FastifyInstance) => {
    const logger = createLogger();

    if (logger) {
      fastify.log = logger;

      // Add request logging
      fastify.addHook('onRequest', (request, _reply, done) => {
        request.log = logger.child({ requestId: request.id });
        done();
      });

      // Log response time
      fastify.addHook('onResponse', (request, reply, done) => {
        request.log.info({
          responseTime: reply.elapsedTime,
        });
        done();
      });
    }
  },
  {
    name: 'logger',
  },
);

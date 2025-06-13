import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify';

import { HEALTH } from '@api/constants/health';
import { HTTP_STATUS } from '@api/constants/http';

import { handleLivenessCheck, handleMetrics, handleReadinessCheck } from './health-handlers';
import { httpRequestDuration, httpRequestsTotal } from './health-helpers';

const healthResponseSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
    timestamp: { type: 'string', format: 'date-time' },
    version: { type: 'string' },
    uptime: { type: 'number' },
    checks: {
      type: 'object',
      properties: {
        database: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            error: { type: 'string' },
            latency: { type: 'number' },
          },
          additionalProperties: true,
        },
        memory: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            usage: {
              type: 'object',
              properties: {
                heapUsed: { type: 'number' },
                heapTotal: { type: 'number' },
                external: { type: 'number' },
                rss: { type: 'number' },
              },
            },
          },
          additionalProperties: true,
        },
      },
    },
    error: { type: 'string' },
    debug: { type: 'object' },
  },
};

interface FastifyRequestWithStartTime extends FastifyRequest {
  startTime?: bigint;
}

function registerMetricsHooks(fastify: FastifyInstance): void {
  fastify.addHook('onRequest', (request: FastifyRequestWithStartTime, _reply, done) => {
    request.startTime = process.hrtime.bigint();
    done();
  });

  fastify.addHook('onResponse', (request: FastifyRequestWithStartTime, reply, done) => {
    const startTime = request.startTime;
    if (startTime && !request.url.startsWith('/health')) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1e9;
      const route = request.url;

      httpRequestDuration
        .labels(request.method, route, reply.statusCode.toString())
        .observe(duration);

      httpRequestsTotal.labels(request.method, route, reply.statusCode.toString()).inc();
    }
    done();
  });
}

function registerReadinessRoute(fastify: FastifyInstance): void {
  fastify.get(
    HEALTH.ENDPOINTS.READY,
    {
      schema: {
        tags: ['Health'],
        summary: 'Readiness probe',
        description: 'Checks if the service is ready to accept traffic',
        response: {
          [HTTP_STATUS.OK]: {
            description: 'Service is ready',
            ...healthResponseSchema,
          },
          [HTTP_STATUS.SERVICE_UNAVAILABLE]: {
            description: 'Service is not ready',
            ...healthResponseSchema,
          },
        },
      },
    },
    handleReadinessCheck,
  );
}

function registerLivenessRoute(fastify: FastifyInstance): void {
  fastify.get(
    HEALTH.ENDPOINTS.LIVE,
    {
      schema: {
        tags: ['Health'],
        summary: 'Liveness probe',
        description: 'Simple check to see if the process is alive',
        response: {
          [HTTP_STATUS.OK]: {
            description: 'Service is alive',
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['alive'] },
              timestamp: { type: 'string', format: 'date-time' },
              pid: { type: 'number' },
            },
          },
        },
      },
    },
    handleLivenessCheck,
  );
}

function registerMetricsRoute(fastify: FastifyInstance): void {
  fastify.get(
    HEALTH.ENDPOINTS.METRICS,
    {
      schema: {
        tags: ['Health'],
        summary: 'Prometheus metrics',
        description: 'Metrics in Prometheus format',
        response: {
          [HTTP_STATUS.OK]: {
            description: 'Metrics in Prometheus format',
            type: 'string',
          },
        },
      },
    },
    handleMetrics,
  );
}

const healthEnhancedRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  registerMetricsHooks(fastify);
  registerReadinessRoute(fastify);
  registerLivenessRoute(fastify);
  registerMetricsRoute(fastify);
  done();
};

export default healthEnhancedRoute;

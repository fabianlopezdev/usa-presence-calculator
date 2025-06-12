import { FastifyReply, FastifyRequest } from 'fastify';

import { config } from '@api/config/env';
import { HEALTH } from '@api/constants/health';
import { HTTP_STATUS } from '@api/constants/http';

import {
  checkDatabase,
  checkMemory,
  ReadinessResponse,
  LivenessResponse,
  register,
} from './health-helpers';

export async function handleReadinessCheck(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  try {
    const checks = await Promise.all([checkDatabase(), Promise.resolve(checkMemory())]);

    const [databaseCheck, memoryCheck] = checks;
    const isHealthy =
      databaseCheck.status === HEALTH.STATUS.HEALTHY &&
      memoryCheck.status !== HEALTH.STATUS.UNHEALTHY;

    const response: ReadinessResponse = {
      status: isHealthy ? HEALTH.STATUS.HEALTHY : HEALTH.STATUS.UNHEALTHY,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
      },
    };

    if (config.NODE_ENV === 'development') {
      response.debug = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: config.NODE_ENV,
      };
    }

    return reply
      .code(isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE)
      .header('Cache-Control', HEALTH.CACHE_CONTROL.NO_CACHE)
      .header('Pragma', 'no-cache')
      .header('Expires', '0')
      .send(response);
  } catch (error) {
    return reply.code(HTTP_STATUS.SERVICE_UNAVAILABLE).send({
      status: HEALTH.STATUS.UNHEALTHY,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function handleLivenessCheck(_request: FastifyRequest, reply: FastifyReply): FastifyReply {
  const response: LivenessResponse = {
    status: HEALTH.STATUS.ALIVE,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };

  return reply
    .header('Cache-Control', HEALTH.CACHE_CONTROL.NO_CACHE)
    .header('Pragma', 'no-cache')
    .header('Expires', '0')
    .send(response);
}

export async function handleMetrics(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const metrics = await register.metrics();
  return reply
    .header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    .header('Cache-Control', HEALTH.CACHE_CONTROL.METRICS)
    .send(metrics);
}

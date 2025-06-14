import { FastifyInstance } from 'fastify';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { buildTestApp } from '@api/test-utils/app-builder';

describe('Request Context Plugin', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should add correlation ID to request context', async () => {
    const correlationId = 'test-correlation-123';
    
    app.get('/test-context', async (request, reply) => {
      reply.send({
        correlationId: request.context.correlationId,
        requestId: request.context.requestId,
        method: request.context.method,
        path: request.context.path,
      });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-context',
      headers: {
        'x-correlation-id': correlationId,
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body) as { correlationId: string; requestId: string; method: string; path: string };
    expect(data.correlationId).toBe(correlationId);
    expect(data.requestId).toBeTruthy();
    expect(data.method).toBe('GET');
    expect(data.path).toBe('/test-context');
  });

  it('should generate correlation ID if not provided', async () => {
    app.get('/test-auto-id', async (request, reply) => {
      reply.send({
        correlationId: request.context.correlationId,
        requestId: request.context.requestId,
      });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-auto-id',
    });

    const data = JSON.parse(response.body) as { correlationId: string; requestId: string };
    expect(data.correlationId).toBeTruthy();
    expect(data.correlationId).toBe(data.requestId);
  });

  it('should add correlation ID to response headers', async () => {
    const correlationId = 'response-test-456';
    
    app.get('/test-headers', async (request, reply) => {
      reply.send({ success: true });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-headers',
      headers: {
        'x-correlation-id': correlationId,
      },
    });

    expect(response.headers['x-correlation-id']).toBe(correlationId);
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('should track request duration', async () => {
    app.get('/test-duration', async (request, reply) => {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = request.startTime ? Date.now() - request.startTime : 0;
      reply.send({ duration });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-duration',
    });

    const data = JSON.parse(response.body) as { duration: number };
    expect(data.duration).toBeGreaterThanOrEqual(50);
  });

  it('should include user context after authentication', async () => {
    const userId = 'user-123';
    
    app.get('/test-user-context', {
      preHandler: (request) => {
        // Simulate authentication
        request.user = { userId };
      },
    }, async (request, reply) => {
      reply.send({
        userId: request.context.userId,
      });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-user-context',
    });

    const data = JSON.parse(response.body) as { userId: string };
    expect(data.userId).toBe(userId);
  });

  it('should include request metadata in context', async () => {
    const userAgent = 'TestAgent/1.0';
    
    app.get('/test-metadata', async (request, reply) => {
      reply.send({
        userAgent: request.context.userAgent,
        ip: request.context.ip,
        timestamp: request.context.timestamp,
      });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-metadata',
      headers: {
        'user-agent': userAgent,
      },
    });

    const data = JSON.parse(response.body) as { userAgent: string; ip: string; timestamp: string };
    expect(data.userAgent).toBe(userAgent);
    expect(data.timestamp).toBeTruthy();
    expect(new Date(data.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });
});
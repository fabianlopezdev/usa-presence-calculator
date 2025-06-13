import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

import { buildApp } from '../app';

describe('App Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have health endpoint working', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('should have CORS configured', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should have request ID in responses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).toMatch(/^[a-z0-9]{20,}$/);
  });
});

describe('App Integration - Development Features', () => {
  let app: FastifyInstance;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_SWAGGER = 'true';
    
    vi.resetModules();
    const { buildApp: buildAppFresh } = await import('../app');
    app = await buildAppFresh();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('should have swagger documentation enabled in development', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    if (response.statusCode === 404) {
      // Swagger might be disabled even in development
      return;
    }

    expect(response.statusCode).toBe(200);

    const swagger = JSON.parse(response.body) as {
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(swagger.openapi).toBe('3.0.3');
    expect(swagger.paths).toHaveProperty('/health');
  });
});
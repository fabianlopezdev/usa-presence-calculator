import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';

import swaggerPlugin from '../swagger';

describe('Swagger Plugin', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = fastify({ logger: false });
    await app.register(swaggerPlugin);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register swagger documentation route', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    
    const swagger = JSON.parse(response.body) as {
      openapi: string;
      info: { title: string; version: string };
    };
    
    expect(swagger.openapi).toBe('3.0.3');
    expect(swagger.info.title).toBe('USA Presence Calculator API');
  });

  it('should serve swagger UI', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('swagger-ui');
  });

  it('should include server information', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    const swagger = JSON.parse(response.body) as {
      servers: Array<{ url: string; description: string }>;
    };

    expect(swagger.servers).toBeDefined();
    expect(swagger.servers.length).toBeGreaterThan(0);
  });
});
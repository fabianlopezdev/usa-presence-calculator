import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

  it('should have swagger documentation enabled', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(response.statusCode).toBe(200);

    const swagger = JSON.parse(response.body) as {
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(swagger.openapi).toBe('3.0.3');
    expect(swagger.paths).toHaveProperty('/health');
  });

  it('should have health endpoint documented', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    const swagger = JSON.parse(response.body) as {
      paths: {
        '/health': {
          get: {
            tags: string[];
            summary: string;
            description: string;
          };
        };
      };
    };

    expect(swagger.paths['/health'].get.tags).toContain('Health');
    expect(swagger.paths['/health'].get.summary).toBe('Health check endpoint');
  });

  it('should register documentation routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/documentation',
    });

    expect([200, 302]).toContain(response.statusCode);

    if (response.statusCode === 302) {
      expect(response.headers.location).toContain('documentation');
    }
  });
});

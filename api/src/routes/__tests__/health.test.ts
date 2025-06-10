import { fastify, FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    // Import and register health route
    const healthRoute = await import('../health');
    await app.register(healthRoute.default);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 status code', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return correct response body', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    const json = response.json();
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('timestamp');
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });

  it('should return correct content-type header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
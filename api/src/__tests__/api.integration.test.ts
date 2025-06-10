import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';

import { closeDatabase, initializeDatabase } from '@api/db/connection';
import healthRoute from '@api/routes/health';
import { cleanupTestDatabase, resetTestDatabase } from '@api/test-utils/db';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    resetTestDatabase();
    
    app = fastify({ 
      logger: false,
      forceCloseConnections: true,
    });
    
    await app.register(healthRoute);
    await app.ready();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body) as { status: string; timestamp: string };
      expect(body.status).toBe('ok');
    });
  });

  describe('Server Configuration', () => {
    it('should handle graceful shutdown', async () => {
      const testApp = fastify({ logger: false });
      await testApp.register(healthRoute);
      await testApp.ready();
      
      const closePromise = testApp.close();
      await expect(closePromise).resolves.toBeUndefined();
    });

    it('should maintain database connection', () => {
      expect(() => initializeDatabase()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/undefined-route',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle method not allowed', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/health',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
import fastify, { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { config } from '@api/config/env';
import { buildTestApp } from '@api/test-utils/app-builder';

describe('Swagger Plugin', () => {
  let app: FastifyInstance;
  let originalNodeEnv: string | undefined;
  let originalEnableSwagger: string | undefined;
  let originalSwaggerUsername: string | undefined;
  let originalSwaggerPassword: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalEnableSwagger = process.env.ENABLE_SWAGGER;
    originalSwaggerUsername = process.env.SWAGGER_USERNAME;
    originalSwaggerPassword = process.env.SWAGGER_PASSWORD;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ENABLE_SWAGGER = originalEnableSwagger;
    process.env.SWAGGER_USERNAME = originalSwaggerUsername;
    process.env.SWAGGER_PASSWORD = originalSwaggerPassword;
    vi.clearAllMocks();
  });

  describe('Development Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SWAGGER = 'true';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('development');
      vi.spyOn(config, 'ENABLE_SWAGGER', 'get').mockReturnValue(true);
      app = await buildTestApp();
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

    it('should serve swagger UI without authentication', async () => {
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
      expect(swagger.servers[0].url).toBe('http://localhost:3000');
      expect(swagger.servers[0].description).toBe('Development server');
    });
  });

  describe('Production Environment with Authentication', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_SWAGGER = 'true';
      process.env.SWAGGER_USERNAME = 'admin';
      process.env.SWAGGER_PASSWORD = 'secret-password';

      vi.resetModules();
      vi.doMock('@api/config/env', () => ({
        config: {
          NODE_ENV: 'production',
          ENABLE_SWAGGER: true,
          SWAGGER_USERNAME: 'admin',
          SWAGGER_PASSWORD: 'secret-password',
          PORT: 3000,
          HOST: '0.0.0.0',
          API_PREFIX: '/api/v1',
          CORS_ORIGIN: 'http://localhost:3000',
          CORS_CREDENTIALS: true,
          RATE_LIMIT_MAX: 100,
          RATE_LIMIT_WINDOW_MS: 900000,
          LOG_LEVEL: 'info',
          LOG_PRETTY: false,
          ENABLE_AUDIT_LOGS: true,
          ENABLE_FIELD_ENCRYPTION: true,
        },
      }));

      const swaggerPluginModule = await import('../swagger');
      app = fastify({ logger: false });
      await app.register(swaggerPluginModule.default);
      await app.ready();
    });

    it('should require authentication for swagger UI', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
      });

      expect(response.statusCode).toBe(401);
      expect(response.headers['www-authenticate']).toContain('Basic');
    });

    it('should allow access with correct credentials', async () => {
      const credentials = Buffer.from('admin:secret-password').toString('base64');
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('swagger-ui');
    });

    it('should deny access with incorrect credentials', async () => {
      const credentials = Buffer.from('admin:wrong-password').toString('base64');
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Production Environment without Authentication', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_SWAGGER = 'true';

      vi.resetModules();
      vi.doMock('@api/config/env', () => ({
        config: {
          NODE_ENV: 'production',
          ENABLE_SWAGGER: true,
          SWAGGER_USERNAME: undefined,
          SWAGGER_PASSWORD: undefined,
          PORT: 3000,
          HOST: '0.0.0.0',
          API_PREFIX: '/api/v1',
          CORS_ORIGIN: 'http://localhost:3000',
          CORS_CREDENTIALS: true,
          RATE_LIMIT_MAX: 100,
          RATE_LIMIT_WINDOW_MS: 900000,
          LOG_LEVEL: 'info',
          LOG_PRETTY: false,
          ENABLE_AUDIT_LOGS: true,
          ENABLE_FIELD_ENCRYPTION: true,
        },
      }));

      const swaggerPluginModule = await import('../swagger');
      app = fastify({ logger: false });
      await app.register(swaggerPluginModule.default);
      await app.ready();
    });

    it('should serve swagger UI without authentication when credentials not configured', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('Swagger Disabled', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SWAGGER = 'false';

      vi.resetModules();
      vi.doMock('@api/config/env', () => ({
        config: {
          NODE_ENV: 'development',
          ENABLE_SWAGGER: false,
          SWAGGER_USERNAME: undefined,
          SWAGGER_PASSWORD: undefined,
          PORT: 3000,
          HOST: '0.0.0.0',
          API_PREFIX: '/api/v1',
          CORS_ORIGIN: 'http://localhost:3000',
          CORS_CREDENTIALS: true,
          RATE_LIMIT_MAX: 100,
          RATE_LIMIT_WINDOW_MS: 900000,
          LOG_LEVEL: 'info',
          LOG_PRETTY: true,
          ENABLE_AUDIT_LOGS: true,
          ENABLE_FIELD_ENCRYPTION: true,
        },
      }));

      const swaggerPluginModule = await import('../swagger');
      app = fastify({ logger: false });
      await app.register(swaggerPluginModule.default);
      await app.ready();
    });

    it('should not register swagger routes when disabled', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Test Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      process.env.ENABLE_SWAGGER = 'true';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('test');
      vi.spyOn(config, 'ENABLE_SWAGGER', 'get').mockReturnValue(true);
      app = await buildTestApp();
    });

    it('should not register swagger in test environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});

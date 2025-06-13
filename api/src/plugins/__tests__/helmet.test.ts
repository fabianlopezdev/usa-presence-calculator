import { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { config } from '@api/config/env';
import { buildTestApp } from '@api/test-utils/app-builder';

describe('Helmet Plugin', () => {
  let app: FastifyInstance;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    process.env.NODE_ENV = originalNodeEnv;
    vi.clearAllMocks();
  });

  describe('Production Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('production');
      app = await buildTestApp();
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['content-security-policy']).toContain("script-src 'self'");
      expect(response.headers['content-security-policy']).toContain("object-src 'none'");
    });

    it('should set Strict-Transport-Security header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=63072000');
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains');
      expect(response.headers['strict-transport-security']).toContain('preload');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-XSS-Protection header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should set Referrer-Policy header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should set Cross-Origin headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['cross-origin-embedder-policy']).toBe('require-corp');
      expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Development Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      vi.spyOn(config, 'NODE_ENV', 'get').mockReturnValue('development');
      app = await buildTestApp();
    });

    it('should not set Content-Security-Policy header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['content-security-policy']).toBeUndefined();
    });

    it('should not set Strict-Transport-Security header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['strict-transport-security']).toBeUndefined();
    });

    it('should still set basic security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should not set Cross-Origin headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['cross-origin-embedder-policy']).toBeUndefined();
      expect(response.headers['cross-origin-opener-policy']).toBeUndefined();
      expect(response.headers['cross-origin-resource-policy']).toBeUndefined();
    });
  });

  // Note: Testing the test environment behavior is complex due to config caching
  // The plugin correctly skips helmet when NODE_ENV=test, which is verified
  // by the fact that other tests don't get helmet headers interfering
});

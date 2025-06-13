import { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '@api/app';
import { RATE_LIMIT_CONFIG } from '@api/constants/rate-limit';
import { API_PATHS } from '@api/test-utils/api-paths';

describe('Rate Limiting', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Global Rate Limit', () => {
    it('should enforce global rate limit', async () => {
      const maxRequests = RATE_LIMIT_CONFIG.GLOBAL.MAX_REQUESTS;

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        const response = await app.inject({
          method: 'GET',
          url: '/health',
        });
        expect(response.statusCode).toBe(200);
      }

      // Next request should be rate limited
      const limitedResponse = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(limitedResponse.statusCode).toBe(429);
      expect(limitedResponse.json()).toHaveProperty('error');
    });
  });

  describe('Auth Endpoint Rate Limits', () => {
    describe('Magic Link Send', () => {
      it('should enforce strict rate limit on magic link sending', async () => {
        const maxRequests = RATE_LIMIT_CONFIG.AUTH.MAGIC_LINK_SEND.MAX_REQUESTS;
        const validPayload = { email: 'test@example.com' };

        // Make requests up to the limit
        for (let i = 0; i < maxRequests; i++) {
          const response = await app.inject({
            method: 'POST',
            url: API_PATHS.AUTH_MAGIC_LINK_SEND,
            payload: validPayload,
          });
          // Might fail due to other reasons, but shouldn't be 429
          expect(response.statusCode).not.toBe(429);
        }

        // Next request should be rate limited
        const limitedResponse = await app.inject({
          method: 'POST',
          url: API_PATHS.AUTH_MAGIC_LINK_SEND,
          payload: validPayload,
        });
        expect(limitedResponse.statusCode).toBe(429);
      });
    });

    describe('Passkey Registration', () => {
      it('should enforce rate limit on passkey registration options', async () => {
        const maxRequests = RATE_LIMIT_CONFIG.AUTH.PASSKEY_REGISTER.MAX_REQUESTS;
        const validPayload = { email: 'test@example.com' };

        // Make requests up to the limit
        for (let i = 0; i < maxRequests; i++) {
          const response = await app.inject({
            method: 'POST',
            url: API_PATHS.AUTH_PASSKEY_OPTIONS,
            payload: validPayload,
          });
          // Might fail due to other reasons, but shouldn't be 429
          expect(response.statusCode).not.toBe(429);
        }

        // Next request should be rate limited
        const limitedResponse = await app.inject({
          method: 'POST',
          url: API_PATHS.AUTH_PASSKEY_OPTIONS,
          payload: validPayload,
        });
        expect(limitedResponse.statusCode).toBe(429);
      });
    });

    describe('Session Info', () => {
      it('should allow more frequent requests for session info', async () => {
        const maxRequests = RATE_LIMIT_CONFIG.AUTH.SESSION_INFO.MAX_REQUESTS;

        // Session info has higher limit (60/minute)
        expect(maxRequests).toBeGreaterThan(30);

        // Make many requests quickly
        for (let i = 0; i < 30; i++) {
          const response = await app.inject({
            method: 'GET',
            url: API_PATHS.AUTH_SESSION,
          });
          // Should not be rate limited for first 30 requests
          expect(response.statusCode).not.toBe(429);
        }
      });
    });
  });

  describe('Rate Limit Headers', () => {
    it('should return rate limit headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Different IPs', () => {
    it('should track rate limits separately for different IPs', async () => {
      const maxRequests = RATE_LIMIT_CONFIG.AUTH.MAGIC_LINK_SEND.MAX_REQUESTS;
      const validPayload = { email: 'test@example.com' };

      // Exhaust rate limit for first IP
      for (let i = 0; i < maxRequests; i++) {
        await app.inject({
          method: 'POST',
          url: API_PATHS.AUTH_MAGIC_LINK_SEND,
          payload: validPayload,
          headers: { 'x-forwarded-for': '192.168.1.1' },
        });
      }

      // First IP should be rate limited
      const limitedResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.AUTH_MAGIC_LINK_SEND,
        payload: validPayload,
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      expect(limitedResponse.statusCode).toBe(429);

      // Different IP should still work
      const differentIpResponse = await app.inject({
        method: 'POST',
        url: API_PATHS.AUTH_MAGIC_LINK_SEND,
        payload: validPayload,
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });
      expect(differentIpResponse.statusCode).not.toBe(429);
    });
  });
});

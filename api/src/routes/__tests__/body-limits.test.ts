import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BODY_LIMITS } from '@api/constants/body-limits';
import { HTTP_STATUS } from '@api/constants/http';
import { buildApp } from '@api/app';
import { getDatabase } from '@api/db/connection';
import type { FastifyInstance, FastifyRequest } from 'fastify';

vi.mock('@api/db/connection');
vi.mock('@api/config/env', () => ({
  config: {
    NODE_ENV: 'test',
    DATABASE_PATH: ':memory:',
    JWT_SECRET: 'test-secret',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:3000',
    CORS_CREDENTIALS: true,
  },
}));

vi.mock('@api/middleware/auth', () => ({
  authenticateUser: vi.fn((request: FastifyRequest, _reply: unknown) => {
    (request as FastifyRequest & { user: { userId: string; sessionId: string } }).user = {
      userId: 'test-user-123',
      sessionId: 'test-session-123',
    };
  }),
}));

describe('Body Limits', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockReturnValue(null),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            get: vi.fn().mockReturnValue({
              id: 'user-123',
              email: 'test@example.com',
            }),
          }),
        }),
      }),
    };

    vi.mocked(getDatabase).mockReturnValue(mockDb as unknown as ReturnType<typeof getDatabase>);

    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Auth Routes', () => {
    it('should reject requests exceeding body limit for magic link send', async () => {
      const largePayload = {
        email: 'test@example.com',
        // Create a payload larger than AUTH_REQUEST limit (50KB)
        extraData: 'x'.repeat(BODY_LIMITS.AUTH_REQUEST + 1000),
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/magic-link/send',
        payload: largePayload,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseBody = response.json();
      expect(responseBody).toMatchObject({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds the maximum allowed size',
        },
      });
    });

    it('should accept requests within body limit for magic link send', async () => {
      const validPayload = {
        email: 'test@example.com',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/magic-link/send',
        payload: validPayload,
      });

      // Should not be rejected for body size
      expect(response.statusCode).not.toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });
  });

  describe('Sync Routes', () => {
    it.skip('should reject sync push requests exceeding 10MB limit', async () => {
      const largePayload = {
        deviceId: 'test-device',
        syncVersion: 1,
        trips: Array(1000).fill({
          id: 'trip-123',
          userId: 'test-user-123',
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
          destination: 'x'.repeat(10000), // Large destination string
          reason: 'vacation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      };

      const response = await app.inject({
        method: 'POST',
        url: '/sync/push',
        headers: {
          authorization: 'Bearer fake-token',
        },
        payload: largePayload,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseBody = response.json();
      expect(responseBody).toMatchObject({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message:
            'Sync data exceeds the maximum allowed size. Please sync more frequently to avoid large payloads.',
        },
      });
    });
  });

  describe('Trip Routes', () => {
    it('should reject trip creation requests exceeding 100KB limit', async () => {
      const largePayload = {
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        destination: 'USA',
        notes: 'x'.repeat(BODY_LIMITS.API_SMALL + 1000), // Large notes field
      };

      const response = await app.inject({
        method: 'POST',
        url: '/trips',
        headers: {
          authorization: 'Bearer fake-token',
        },
        payload: largePayload,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseBody = response.json();
      expect(responseBody).toMatchObject({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
        },
      });
    });
  });

  describe('Settings Routes', () => {
    it('should reject settings update requests exceeding 10KB limit', async () => {
      const largePayload = {
        theme: 'dark',
        customData: 'x'.repeat(BODY_LIMITS.SETTINGS_UPDATE + 1000),
      };

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/settings',
        headers: {
          authorization: 'Bearer fake-token',
        },
        payload: largePayload,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseBody = response.json();
      expect(responseBody).toMatchObject({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
        },
      });
    });
  });

  describe('CSP Report Route', () => {
    it('should reject CSP reports exceeding 10KB limit', async () => {
      const largeReport = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
          'script-sample': 'x'.repeat(BODY_LIMITS.CSP_REPORT + 1000),
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/csp-report',
        payload: largeReport,
      });

      expect(response.statusCode).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });
  });
});

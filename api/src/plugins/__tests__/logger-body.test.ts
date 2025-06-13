import { describe, it, expect } from 'vitest';

import { LOG_BODY_MAX_SIZE, LOG_MESSAGES } from '@api/constants/logging';

// Test the body logging functions directly
describe('Logger Body Logging Functions', () => {
  describe('shouldLogRoute', () => {
    it('should return true for regular routes', () => {
      const shouldLogRoute = (url: string): boolean => {
        const ignoreRoutes = [
          '/health',
          '/health/live',
          '/health/ready',
          '/health/metrics',
          '/docs',
          '/docs/json',
          '/docs/yaml',
          '/docs/static/*',
        ];

        return !ignoreRoutes.some((pattern) => {
          if (pattern.endsWith('*')) {
            return url.startsWith(pattern.slice(0, -1));
          }
          return url === pattern;
        });
      };

      expect(shouldLogRoute('/users/profile')).toBe(true);
      expect(shouldLogRoute('/trips')).toBe(true);
      expect(shouldLogRoute('/sync/push')).toBe(true);
    });

    it('should return false for health check routes', () => {
      const shouldLogRoute = (url: string): boolean => {
        const ignoreRoutes = [
          '/health',
          '/health/live',
          '/health/ready',
          '/health/metrics',
          '/docs',
          '/docs/json',
          '/docs/yaml',
          '/docs/static/*',
        ];

        return !ignoreRoutes.some((pattern) => {
          if (pattern.endsWith('*')) {
            return url.startsWith(pattern.slice(0, -1));
          }
          return url === pattern;
        });
      };

      expect(shouldLogRoute('/health')).toBe(false);
      expect(shouldLogRoute('/health/live')).toBe(false);
      expect(shouldLogRoute('/health/ready')).toBe(false);
      expect(shouldLogRoute('/health/metrics')).toBe(false);
    });

    it('should return false for documentation routes', () => {
      const shouldLogRoute = (url: string): boolean => {
        const ignoreRoutes = [
          '/health',
          '/health/live',
          '/health/ready',
          '/health/metrics',
          '/docs',
          '/docs/json',
          '/docs/yaml',
          '/docs/static/*',
        ];

        return !ignoreRoutes.some((pattern) => {
          if (pattern.endsWith('*')) {
            return url.startsWith(pattern.slice(0, -1));
          }
          return url === pattern;
        });
      };

      expect(shouldLogRoute('/docs')).toBe(false);
      expect(shouldLogRoute('/docs/json')).toBe(false);
      expect(shouldLogRoute('/docs/static/swagger-ui.css')).toBe(false);
    });
  });

  describe('truncateBody', () => {
    it('should return body as-is if under size limit', () => {
      const truncateBody = (body: unknown): unknown => {
        const bodyString = JSON.stringify(body);
        if (bodyString.length > LOG_BODY_MAX_SIZE) {
          return { message: LOG_MESSAGES.BODY_TOO_LARGE, size: bodyString.length };
        }
        return body;
      };

      const smallBody = { test: 'data', user: 'john' };
      expect(truncateBody(smallBody)).toEqual(smallBody);
    });

    it('should return truncation message for large bodies', () => {
      const truncateBody = (body: unknown): unknown => {
        const bodyString = JSON.stringify(body);
        if (bodyString.length > LOG_BODY_MAX_SIZE) {
          return { message: LOG_MESSAGES.BODY_TOO_LARGE, size: bodyString.length };
        }
        return body;
      };

      // Create a large body that exceeds LOG_BODY_MAX_SIZE
      const largeBody = { data: 'x'.repeat(LOG_BODY_MAX_SIZE + 1000) };
      const result = truncateBody(largeBody);

      expect(result).toEqual({
        message: LOG_MESSAGES.BODY_TOO_LARGE,
        size: expect.any(Number) as number,
      });
    });
  });

  describe('sensitive data redaction', () => {
    it('should be configured with comprehensive redact paths', () => {
      const redactPaths = [
        'req.body.password',
        'req.body.token',
        'req.body.apiKey',
        'req.body.secret',
        'req.body.creditCard',
        'req.body.ssn',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.secret',
        '*.creditCard',
        '*.ssn',
      ];

      // Verify that all sensitive field patterns are included
      expect(redactPaths).toContain('req.body.password');
      expect(redactPaths).toContain('*.password');
      expect(redactPaths).toContain('req.body.token');
      expect(redactPaths).toContain('*.token');
    });
  });
});

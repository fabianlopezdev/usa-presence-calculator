import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { HTTP_STATUS } from '@api/constants/http';
import { AuthenticationError, DatabaseError, ValidationError } from '@api/utils/errors';
import { createGlobalErrorHandler } from '@api/utils/global-error-handler';

describe('Global Error Handler', () => {
  const mockRequest = {
    id: 'test-request-id',
    method: 'GET',
    url: '/test',
    log: {
      error: vi.fn(),
      fatal: vi.fn(),
    },
  } as unknown as FastifyRequest;

  let mockReply: FastifyReply;
  const statusMock = vi.fn();
  const sendMock = vi.fn();

  const handler = createGlobalErrorHandler();

  beforeEach(() => {
    vi.clearAllMocks();
    mockReply = {
      status: statusMock,
      send: sendMock,
    } as unknown as FastifyReply;
    statusMock.mockReturnValue(mockReply);
    sendMock.mockReturnValue(mockReply);
    process.env.NODE_ENV = 'development'; // Set to development to include details
  });

  describe('Fastify validation errors', () => {
    it('should handle Fastify validation errors', () => {
      const error = {
        validation: [{ dataPath: '.email', message: 'must be string' }],
        statusCode: 400,
        code: 'FST_ERR_VALIDATION',
        message: 'Validation error',
        name: 'FastifyError',
      } as unknown as FastifyError;

      handler(error, mockRequest, mockReply);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      const sendCall = sendMock.mock.calls[0][0] as {
        error: {
          message: string;
          code: string;
          requestId: string;
          timestamp: string;
          details: {
            errors: unknown;
          };
        };
      };
      expect(sendCall).toEqual({
        error: {
          message: 'Request validation failed',
          code: 'VALIDATION_ERROR',
          requestId: 'test-request-id',
          timestamp: expect.any(String) as string,
          details: {
            errors: error.validation,
          },
        },
      });
    });
  });

  describe('Zod validation errors', () => {
    it('should handle Zod validation errors', () => {
      const zodError = Object.assign(
        new z.ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['email'],
            message: 'Expected string, received number',
          },
        ]),
        { statusCode: 400 },
      );

      handler(zodError as unknown as FastifyError, mockRequest, mockReply);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(sendMock).toHaveBeenCalledWith({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId: 'test-request-id',
          timestamp: expect.any(String) as string,
          details: {
            errors: [
              {
                field: 'email',
                message: 'Expected string, received number',
                code: 'invalid_type',
              },
            ],
          },
        },
      });
    });
  });

  describe('BaseError instances', () => {
    it('should handle operational errors correctly', () => {
      const error = new AuthenticationError('Invalid token');

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(sendMock).toHaveBeenCalledWith({
        error: {
          message: 'Invalid token',
          code: 'AUTHENTICATION_ERROR',
          requestId: 'test-request-id',
          timestamp: expect.any(String) as string,
          details: undefined,
        },
      });
      expect(mockRequest.log.fatal).not.toHaveBeenCalled();
    });

    it('should handle non-operational errors correctly', () => {
      const error = new DatabaseError('Connection failed');

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      expect(mockRequest.log.fatal).toHaveBeenCalledWith({
        err: error,
        requestId: 'test-request-id',
        message: 'Non-operational error occurred',
        stack: expect.any(String) as string,
      });
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('should include details in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new ValidationError('Invalid input', { field: 'email' });

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      expect(sendMock).toHaveBeenCalledWith({
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          requestId: 'test-request-id',
          timestamp: expect.any(String) as string,
          details: { field: 'email' },
        },
      });
    });

    it('should hide internal error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new DatabaseError('Connection string: postgres://user:pass@host');

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      expect(sendMock).toHaveBeenCalledWith({
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
          requestId: 'test-request-id',
          timestamp: expect.any(String) as string,
          details: undefined,
        },
      });
    });
  });

  describe('Generic errors', () => {
    it('should convert generic Error to InternalError', () => {
      const error = new Error('Something went wrong');

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRequest.log.fatal).toHaveBeenCalled();
    });

    it('should handle unknown error types', () => {
      const error = 'string error';

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRequest.log.fatal).toHaveBeenCalled();
    });
  });

  describe('Sensitive data masking', () => {
    it('should mask sensitive fields in error details', () => {
      process.env.NODE_ENV = 'development';
      const error = new ValidationError('Invalid request', {
        password: 'secret123',
        email: 'user@example.com',
        token: 'jwt-token',
        apiKey: 'api-key-123',
      });

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      const sentError = sendMock.mock.calls[0][0] as {
        error: { details: Record<string, string> };
      };
      expect(sentError.error.details.password).toBe('[REDACTED]');
      expect(sentError.error.details.email).toBe('user@example.com');
      expect(sentError.error.details.token).toBe('[REDACTED]');
      expect(sentError.error.details.apiKey).toBe('[REDACTED]');
    });

    it('should mask nested sensitive fields', () => {
      process.env.NODE_ENV = 'development';
      const error = new ValidationError('Invalid request', {
        user: {
          email: 'user@example.com',
          password: 'secret123',
          profile: {
            name: 'John',
            ssn: '123-45-6789',
          },
        },
      });

      handler(error as unknown as FastifyError, mockRequest, mockReply);

      const sentError = sendMock.mock.calls[0][0] as {
        error: {
          details: {
            user: {
              email: string;
              password: string;
              profile: {
                name: string;
                ssn: string;
              };
            };
          };
        };
      };
      expect(sentError.error.details).toEqual({
        user: {
          email: 'user@example.com',
          password: '[REDACTED]',
          profile: {
            name: 'John',
            ssn: '[REDACTED]',
          },
        },
      });
    });
  });

  describe('Request context logging', () => {
    it('should log error with request context', () => {
      const error = new ValidationError('Test error');
      const requestWithUser = {
        ...mockRequest,
        user: { id: 'user-123' },
      } as FastifyRequest & { user: { id: string } };

      handler(error as FastifyError, requestWithUser, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalledWith({
        err: error,
        requestId: 'test-request-id',
        method: 'GET',
        url: '/test',
        userId: 'user-123',
        errorType: 'ValidationError',
        isOperational: true,
      });
    });

    it('should handle missing request ID gracefully', () => {
      const error = new ValidationError('Test error');
      const requestWithoutId = {
        ...mockRequest,
        id: undefined,
      } as unknown as FastifyRequest;

      handler(error as FastifyError, requestWithoutId, mockReply);

      const sentError = sendMock.mock.calls[0][0] as { error: { requestId: string } };
      expect(sentError.error.requestId).toBe('unknown');
    });
  });
});

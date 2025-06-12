import { describe, expect, it } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import {
  AuthenticationError,
  AuthorizationError,
  BaseError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  InternalError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  isOperationalError,
  toBaseError,
} from '@api/utils/errors';

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should serialize to JSON correctly', () => {
      const error = new ValidationError('Invalid input');
      const json = error.toJSON();

      expect(json).toEqual({
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: undefined,
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with correct properties', () => {
      const error = new AuthenticationError('Invalid credentials');

      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with correct properties', () => {
      const error = new AuthorizationError('Access denied');

      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with correct properties', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with correct properties', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.code).toBe('CONFLICT');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with correct properties', () => {
      const error = new RateLimitError('Too many requests');

      expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('DatabaseError', () => {
    it('should create database error with correct properties', () => {
      const error = new DatabaseError('Connection failed');

      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error with correct properties', () => {
      const error = new ExternalServiceError('Service unavailable');

      expect(error.statusCode).toBe(HTTP_STATUS.BAD_GATEWAY);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('InternalError', () => {
    it('should create internal error with correct properties', () => {
      const error = new InternalError('Unexpected error');

      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      expect(isOperationalError(new ValidationError('test'))).toBe(true);
      expect(isOperationalError(new AuthenticationError('test'))).toBe(true);
      expect(isOperationalError(new NotFoundError('test'))).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      expect(isOperationalError(new DatabaseError('test'))).toBe(false);
      expect(isOperationalError(new InternalError('test'))).toBe(false);
    });

    it('should return false for non-BaseError instances', () => {
      expect(isOperationalError(new Error('test'))).toBe(false);
      expect(isOperationalError('not an error')).toBe(false);
      expect(isOperationalError(null)).toBe(false);
    });
  });

  describe('toBaseError', () => {
    it('should return BaseError instance as is', () => {
      const error = new ValidationError('test');
      expect(toBaseError(error)).toBe(error);
    });

    it('should convert Error to InternalError', () => {
      const error = new Error('test error');
      const baseError = toBaseError(error);

      expect(baseError).toBeInstanceOf(InternalError);
      expect(baseError.message).toBe('test error');
      expect(baseError.details).toEqual({ originalError: 'Error' });
    });

    it('should convert unknown to InternalError', () => {
      const baseError = toBaseError('string error');

      expect(baseError).toBeInstanceOf(InternalError);
      expect(baseError.message).toBe('An unexpected error occurred');
      expect(baseError.details).toEqual({ originalError: 'string error' });
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof Error and BaseError', () => {
      const error = new ValidationError('test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new ValidationError('test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });
});

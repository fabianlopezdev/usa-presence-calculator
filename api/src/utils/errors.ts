import { HTTP_STATUS } from '@api/constants/http';

export abstract class BaseError extends Error {
  abstract statusCode: number;
  abstract code: string;
  abstract isOperational: boolean;

  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class AuthenticationError extends BaseError {
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;
  readonly code = 'AUTHENTICATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class AuthorizationError extends BaseError {
  readonly statusCode = HTTP_STATUS.FORBIDDEN;
  readonly code = 'AUTHORIZATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = HTTP_STATUS.NOT_FOUND;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class ConflictError extends BaseError {
  readonly statusCode = HTTP_STATUS.CONFLICT;
  readonly code = 'CONFLICT';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class RateLimitError extends BaseError {
  readonly statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class DatabaseError extends BaseError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = 'DATABASE_ERROR';
  readonly isOperational = false;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class ExternalServiceError extends BaseError {
  readonly statusCode = HTTP_STATUS.BAD_GATEWAY;
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly isOperational = true;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class InternalError extends BaseError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = 'INTERNAL_ERROR';
  readonly isOperational = false;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export function isOperationalError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

export function toBaseError(error: unknown): BaseError {
  if (error instanceof BaseError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, { originalError: error.name });
  }

  return new InternalError('An unexpected error occurred', { originalError: error });
}

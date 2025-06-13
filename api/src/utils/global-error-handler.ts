import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BODY_LIMIT_MESSAGES } from '@api/constants/body-limits';
import { HTTP_STATUS } from '@api/constants/http';
import { TIMEOUT_MESSAGES } from '@api/constants/timeout';
import {
  BaseError,
  InternalError,
  ValidationError,
  isOperationalError,
  toBaseError,
} from '@api/utils/errors';

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId: string;
    timestamp: string;
    details?: unknown;
  };
}

function maskSensitiveData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'apikey',
    'secret',
    'authorization',
    'cookie',
    'session',
    'creditcard',
    'ssn',
    'pin',
  ];

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  // Handle objects
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

function createErrorResponse(
  error: BaseError,
  requestId: string,
  includeDetails: boolean = true,
): ErrorResponse {
  return {
    error: {
      message: error.message,
      code: error.code,
      requestId,
      timestamp: new Date().toISOString(),
      details: includeDetails && error.details ? maskSensitiveData(error.details) : undefined,
    },
  };
}

interface ErrorContext {
  error: FastifyError;
  request: FastifyRequest;
  reply: FastifyReply;
  requestId: string;
  isDevelopment: boolean;
}

function logError(context: ErrorContext): void {
  const { error, request, requestId } = context;
  const userId = (request as FastifyRequest & { user?: { id: string } }).user?.id;

  request.log.error({
    err: error,
    requestId,
    method: request.method,
    url: request.url,
    userId,
    errorType: error.constructor.name,
    isOperational: isOperationalError(error),
  });
}

function handleFastifyValidation(context: ErrorContext): boolean {
  const { error, reply, requestId, isDevelopment } = context;

  if (error.validation) {
    const validationError = new ValidationError('Request validation failed', {
      errors: error.validation,
    });

    reply
      .status(validationError.statusCode)
      .send(createErrorResponse(validationError, requestId, isDevelopment));
    return true;
  }

  return false;
}

function handleZodValidation(context: ErrorContext): boolean {
  const { error, reply, requestId, isDevelopment } = context;

  if (error instanceof z.ZodError) {
    const validationError = new ValidationError('Validation failed', {
      errors: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    });

    reply
      .status(validationError.statusCode)
      .send(createErrorResponse(validationError, requestId, isDevelopment));
    return true;
  }

  return false;
}

function handleRateLimitError(context: ErrorContext): boolean {
  const { error, reply } = context;

  if (error.statusCode === 429) {
    reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: error.message,
    });
    return true;
  }

  return false;
}

function handleBodySizeError(context: ErrorContext): boolean {
  const { error, request, reply, requestId } = context;

  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    const routeUrl = request.url;
    let message = BODY_LIMIT_MESSAGES.DEFAULT;

    // Provide specific messages for different endpoint types
    if (routeUrl.includes('/sync')) {
      message = BODY_LIMIT_MESSAGES.SYNC;
    } else if (routeUrl.includes('/import')) {
      message = BODY_LIMIT_MESSAGES.IMPORT;
    }

    reply.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).send({
      error: {
        message,
        code: 'PAYLOAD_TOO_LARGE',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return true;
  }

  return false;
}

function handleJsonParseError(context: ErrorContext): boolean {
  const { error, reply, requestId } = context;

  if (
    error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' ||
    error.message?.includes('Invalid JSON') ||
    error.message?.includes('Unexpected token') ||
    error.message?.includes('JSON')
  ) {
    reply.status(400).send({
      error: {
        message: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return true;
  }

  return false;
}

function handleTimeoutError(context: ErrorContext): boolean {
  const { error, reply, requestId } = context;

  if (
    error.code === 'ETIMEDOUT' ||
    error.code === 'ESOCKETTIMEDOUT' ||
    error.code === 'REQUEST_TIMEOUT' ||
    error.message?.includes('timeout') ||
    error.message?.includes('Timeout')
  ) {
    reply.status(HTTP_STATUS.REQUEST_TIMEOUT).send({
      error: {
        message: TIMEOUT_MESSAGES.REQUEST,
        code: 'REQUEST_TIMEOUT',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return true;
  }

  return false;
}

function handleSpecialErrors(context: ErrorContext): boolean {
  if (handleRateLimitError(context)) return true;
  if (handleBodySizeError(context)) return true;
  if (handleJsonParseError(context)) return true;
  if (handleTimeoutError(context)) return true;

  return false;
}

function handleNonOperationalError(context: ErrorContext, baseError: BaseError): boolean {
  const { error, request, reply, requestId, isDevelopment } = context;

  if (!isOperationalError(baseError)) {
    request.log.fatal({
      err: error,
      requestId,
      message: 'Non-operational error occurred',
      stack: error.stack,
    });

    if (!isDevelopment) {
      const internalError = new InternalError('An unexpected error occurred');
      reply
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(createErrorResponse(internalError, requestId, false));
      return true;
    }
  }

  return false;
}

export function createGlobalErrorHandler() {
  return function globalErrorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ): void {
    // Check if reply was already sent (e.g., by rate limit plugin)
    if (reply.sent) {
      return;
    }

    const requestId = request.id || 'unknown';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const context: ErrorContext = { error, request, reply, requestId, isDevelopment };

    if (handleSpecialErrors(context)) return;

    logError(context);

    if (handleFastifyValidation(context)) return;
    if (handleZodValidation(context)) return;

    const baseError = toBaseError(error);

    if (handleNonOperationalError(context, baseError)) return;

    reply
      .status(baseError.statusCode)
      .send(createErrorResponse(baseError, requestId, isDevelopment));
  };
}

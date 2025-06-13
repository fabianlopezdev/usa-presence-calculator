import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ALERT_TYPES, AlertSeverity } from '@api/constants/alerting';
import { HTTP_STATUS } from '@api/constants/http';
import { alertingService } from '@api/services/alerting';
import { ErrorContext, handleSpecialErrors } from '@api/utils/error-handlers';
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

function handleNonOperationalError(context: ErrorContext, baseError: BaseError): boolean {
  const { error, request, reply, requestId, isDevelopment } = context;

  if (!isOperationalError(baseError)) {
    request.log.fatal({
      err: error,
      requestId,
      message: 'Non-operational error occurred',
      stack: error.stack,
    });

    // Send critical alert for non-operational errors
    void alertingService.alert({
      type: ALERT_TYPES.DEPLOYMENT_HEALTH,
      severity: 'critical' as AlertSeverity,
      message: `Non-operational error: ${error.message}`,
      error,
      request,
      context: {
        errorName: error.name,
        errorCode: error.code,
        errorStack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
      },
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

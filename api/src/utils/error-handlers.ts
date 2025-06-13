import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { ALERT_TYPES, AlertSeverity } from '@api/constants/alerting';
import { BODY_LIMIT_MESSAGES } from '@api/constants/body-limits';
import { HTTP_STATUS } from '@api/constants/http';
import { TIMEOUT_MESSAGES } from '@api/constants/timeout';
import { alertingService } from '@api/services/alerting';

export interface ErrorContext {
  error: FastifyError;
  request: FastifyRequest;
  reply: FastifyReply;
  requestId: string;
  isDevelopment: boolean;
}

export function handleRateLimitError(context: ErrorContext): boolean {
  const { error, request, reply } = context;

  if (error.statusCode === 429) {
    // Send alert for rate limit violations
    void alertingService.alert({
      type: ALERT_TYPES.RATE_LIMIT_EXCEEDED,
      severity: 'medium' as AlertSeverity,
      message: `Rate limit exceeded for ${request.method} ${request.url}`,
      request,
      context: {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: error.message,
    });
    return true;
  }

  return false;
}

export function handleBodySizeError(context: ErrorContext): boolean {
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

export function handleJsonParseError(context: ErrorContext): boolean {
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

export function handleTimeoutError(context: ErrorContext): boolean {
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

export function handleSpecialErrors(context: ErrorContext): boolean {
  if (handleRateLimitError(context)) return true;
  if (handleBodySizeError(context)) return true;
  if (handleJsonParseError(context)) return true;
  if (handleTimeoutError(context)) return true;

  return false;
}

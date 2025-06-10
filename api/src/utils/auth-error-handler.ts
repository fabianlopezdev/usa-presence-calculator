import { FastifyReply } from 'fastify';
import { z } from 'zod';

import { AUTH_ERRORS } from '@api/constants/auth';
import { HTTP_STATUS } from '@api/constants/http';

export function handleWebAuthnError(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific WebAuthn errors based on SimpleWebAuthn documentation
    if (error.name === 'InvalidStateError') {
      return AUTH_ERRORS.PASSKEY_ALREADY_REGISTERED;
    }

    if (error.name === 'NotAllowedError') {
      return AUTH_ERRORS.PASSKEY_AUTHENTICATION_FAILED;
    }

    if (error.name === 'AbortError') {
      return 'Authentication was cancelled';
    }

    if (error.name === 'SecurityError') {
      return 'Security error during authentication';
    }

    if (error.name === 'UnknownError') {
      return 'An unknown error occurred during authentication';
    }

    // Return the original error message for other cases
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'MessageRejected' ||
      error.message.includes('Rate exceeded') ||
      error.message.includes('Throttling')
    );
  }
  return false;
}

export function isSESError(error: unknown): boolean {
  if (error instanceof Error && 'name' in error) {
    const sesErrorNames = [
      'MessageRejected',
      'MailFromDomainNotVerified',
      'ConfigurationSetDoesNotExist',
      'InvalidParameterValue',
      'AccountSendingPaused',
    ];

    return sesErrorNames.includes(error.name);
  }
  return false;
}

function handleZodError(error: z.ZodError, reply: FastifyReply): FastifyReply {
  return reply.code(HTTP_STATUS.BAD_REQUEST).send({
    error: 'Validation error',
    details: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  });
}

function handleKnownAuthError(message: string, reply: FastifyReply): FastifyReply | null {
  if (message === AUTH_ERRORS.USER_NOT_FOUND) {
    return reply.code(HTTP_STATUS.NOT_FOUND).send({ error: message });
  }

  if (message === AUTH_ERRORS.RATE_LIMIT_EXCEEDED) {
    return reply.code(HTTP_STATUS.TOO_MANY_REQUESTS).send({ error: message });
  }

  const unauthorizedErrors = [
    AUTH_ERRORS.INVALID_TOKEN,
    AUTH_ERRORS.TOKEN_EXPIRED,
    AUTH_ERRORS.SESSION_EXPIRED,
    AUTH_ERRORS.MAGIC_LINK_EXPIRED,
    AUTH_ERRORS.MAGIC_LINK_ALREADY_USED,
  ];

  if (unauthorizedErrors.includes(message as (typeof unauthorizedErrors)[number])) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: message });
  }

  if (message === AUTH_ERRORS.USER_ALREADY_EXISTS) {
    return reply.code(HTTP_STATUS.CONFLICT).send({ error: message });
  }

  // Check if message is one of the known auth errors
  const authErrorValues = Object.values(AUTH_ERRORS) as string[];
  if (authErrorValues.includes(message)) {
    return reply.code(HTTP_STATUS.BAD_REQUEST).send({ error: message });
  }

  return null;
}

export function handleAuthError(error: unknown, reply: FastifyReply): FastifyReply {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return handleZodError(error, reply);
  }

  if (error instanceof Error) {
    const message = error.message;

    // Check for specific auth errors
    const handledError = handleKnownAuthError(message, reply);
    if (handledError) {
      return handledError;
    }

    // Handle WebAuthn specific errors
    const webAuthnError = handleWebAuthnError(error);
    if (webAuthnError !== error.message) {
      return reply.code(HTTP_STATUS.BAD_REQUEST).send({ error: webAuthnError });
    }
  }

  // Default error response
  return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
    error: 'An unexpected error occurred',
  });
}

import { AUTH_ERRORS } from '@api/constants/auth';

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

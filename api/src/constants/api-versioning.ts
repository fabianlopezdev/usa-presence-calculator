import { API_VERSION } from '@usa-presence/shared';

// Re-export from shared for backward compatibility
export { API_VERSION } from '@usa-presence/shared';

export const API_VERSIONING_CONFIG = {
  ENABLE_VERSION_HEADER: true,
  VERSION_HEADER_NAME: 'api-version',
  DEFAULT_VERSION: API_VERSION.CURRENT,
} as const;

export const API_VERSIONING_MESSAGES = {
  VERSION_NOT_SUPPORTED: 'API version not supported',
  VERSION_DEPRECATED: 'This API version is deprecated',
} as const;

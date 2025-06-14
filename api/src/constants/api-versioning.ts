// Define API_VERSION locally to avoid import issues
export const API_VERSION = {
  CURRENT: 'v1',
  PREFIX: '/api/v1',
  SUPPORTED_VERSIONS: ['v1'],
} as const;

export const API_VERSIONING_CONFIG = {
  ENABLE_VERSION_HEADER: true,
  VERSION_HEADER_NAME: 'api-version',
  DEFAULT_VERSION: API_VERSION.CURRENT,
} as const;

export const API_VERSIONING_MESSAGES = {
  VERSION_NOT_SUPPORTED: 'API version not supported',
  VERSION_DEPRECATED: 'This API version is deprecated',
} as const;

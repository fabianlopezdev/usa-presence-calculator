export const LOG_LEVELS = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
  SILENT: 'silent',
} as const;

export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["x-auth-token"]',
  'req.headers["x-access-token"]',
  'req.headers["x-refresh-token"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.oldPassword',
  'req.body.newPassword',
  'req.body.confirmPassword',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.apiKey',
  'req.body.secret',
  'req.body.creditCard',
  'req.body.ssn',
  'req.body.pin',
  'req.body.passkey',
  'req.body.credential',
  'req.body.authenticatorData',
  'req.body.clientDataJSON',
  'req.body.publicKeyCredential',
  '*.password',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.secret',
  '*.creditCard',
  '*.ssn',
  '*.pin',
  '*.passkey',
  '*.credential',
  '*.authenticatorData',
  '*.clientDataJSON',
];

export const LOG_IGNORE_ROUTES = [
  '/health',
  '/health/live',
  '/health/ready',
  '/health/metrics',
  '/docs',
  '/docs/json',
  '/docs/yaml',
  '/docs/static/*',
];

export const LOG_BODY_MAX_SIZE = 10000; // 10KB max body size to log

export const LOG_MESSAGES = {
  REQUEST_START: 'Request started',
  REQUEST_COMPLETE: 'Request completed',
  REQUEST_ERROR: 'Request error',
  BODY_TOO_LARGE: 'Request/response body too large to log',
  CIRCULAR_REFERENCE: 'Circular reference detected in body',
} as const;

export const LOG_SERIALIZER_CONFIG = {
  MAX_ARRAY_LENGTH: 10,
  MAX_OBJECT_KEYS: 20,
  MAX_STRING_LENGTH: 200,
} as const;

export const LOG_ROTATION = {
  ENABLED: process.env.NODE_ENV === 'production',
  DIRECTORY: process.env.LOG_DIR || 'logs',
  FILE_PREFIX: 'api',
  MAX_FILES: 30, // Keep 30 days of logs
  MAX_SIZE: '100M', // Max size per file before rotation
  DATE_PATTERN: 'YYYY-MM-DD',
  COMPRESS: true,
  INTERVAL: '1d', // Daily rotation
} as const;

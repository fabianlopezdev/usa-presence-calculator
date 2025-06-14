# API Constants Reference - USA Presence Calculator

This document provides a comprehensive reference for all constants, configuration values, and enums used in the API codebase.

## Table of Contents

1. [Constants Overview](#constants-overview)
2. [HTTP Constants](#http-constants)
3. [Authentication Constants](#authentication-constants)
4. [Rate Limiting Constants](#rate-limiting-constants)
5. [Timeout Constants](#timeout-constants)
6. [Body Size Limits](#body-size-limits)
7. [Logging Constants](#logging-constants)
8. [Security Constants](#security-constants)
9. [API Versioning Constants](#api-versioning-constants)
10. [Message Constants](#message-constants)
11. [Database Constants](#database-constants)
12. [Environment Configuration](#environment-configuration)

## Constants Overview

### Statistics

- **Total Constant Files**: 15
- **Total Constants**: 85+ constant values
- **Configuration Categories**: 12
- **Message Templates**: 50+

### Constants by Category

| Category        | File                    | Purpose                      |
| --------------- | ----------------------- | ---------------------------- |
| **HTTP**        | `http.ts`               | HTTP status codes            |
| **Auth**        | `auth.ts`               | Authentication configuration |
| **Rate Limit**  | `rate-limit.ts`         | Rate limiting thresholds     |
| **Timeouts**    | `timeout.ts`            | Request timeout values       |
| **Body Limits** | `body-limits.ts`        | Request body size limits     |
| **Logging**     | `logging.ts`            | Log configuration            |
| **Security**    | `helmet.ts`, `cors.ts`  | Security headers             |
| **API**         | `api-versioning.ts`     | API version config           |
| **Messages**    | Various `*-messages.ts` | User-facing messages         |
| **Database**    | `db.ts`                 | Database configuration       |

## HTTP Constants

**File**: `src/constants/http.ts`

### HTTP Status Codes

```typescript
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
```

## Authentication Constants

**File**: `src/constants/auth.ts`

### JWT Configuration

```typescript
export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  MAGIC_LINK_EXPIRY: '15m',
  JWT_ALGORITHM: 'HS256' as const,
  BCRYPT_ROUNDS: 10,
  SESSION_COOKIE_NAME: 'session',
  REFRESH_COOKIE_NAME: 'refresh_token',
} as const;
```

### Authentication Types

```typescript
export const AUTH_TYPES = {
  MAGIC_LINK: 'magic_link',
  PASSKEY: 'passkey',
  REFRESH_TOKEN: 'refresh_token',
} as const;
```

### Authentication Messages

```typescript
export const AUTH_MESSAGES = {
  MAGIC_LINK_SENT: 'Magic link sent to your email',
  MAGIC_LINK_INVALID: 'Invalid or expired magic link',
  MAGIC_LINK_EXPIRED: 'Magic link has expired',
  SESSION_CREATED: 'Session created successfully',
  SESSION_NOT_FOUND: 'Session not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSKEY_REGISTERED: 'Passkey registered successfully',
  PASSKEY_NOT_FOUND: 'Passkey not found',
} as const;
```

## Rate Limiting Constants

**File**: `src/constants/rate-limit.ts`

### Rate Limit Configuration

```typescript
export const RATE_LIMIT = {
  AUTH_ENDPOINTS: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
    MESSAGE: 'Too many authentication attempts, please try again later',
  },
  API_ENDPOINTS: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS_AUTHENTICATED: 100,
    MAX_REQUESTS_UNAUTHENTICATED: 20,
    MESSAGE: 'Too many requests, please try again later',
  },
  SYNC_ENDPOINTS: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
    MESSAGE: 'Sync rate limit exceeded, please try again later',
  },
  GLOBAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 1000,
    MESSAGE: 'Global rate limit exceeded',
  },
} as const;
```

### Rate Limit Headers

```typescript
export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
} as const;
```

## Timeout Constants

**File**: `src/constants/timeout.ts`

### Request Timeouts

```typescript
export const REQUEST_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  FAST: 5000, // 5 seconds
  STANDARD: 30000, // 30 seconds
  LONG: 60000, // 1 minute
  UPLOAD: 300000, // 5 minutes
} as const;
```

### Route-Specific Timeouts

```typescript
export const ROUTE_TIMEOUTS = {
  '/health': REQUEST_TIMEOUTS.FAST,
  '/health/ready': REQUEST_TIMEOUTS.FAST,
  '/health/live': REQUEST_TIMEOUTS.FAST,
  '/api/v1/auth/magic-link/send': REQUEST_TIMEOUTS.STANDARD,
  '/api/v1/sync/pull': REQUEST_TIMEOUTS.LONG,
  '/api/v1/sync/push': REQUEST_TIMEOUTS.LONG,
  '/api/v1/trips/import': REQUEST_TIMEOUTS.UPLOAD,
} as const;
```

### Server Timeouts

```typescript
export const SERVER_TIMEOUTS = {
  KEEP_ALIVE_TIMEOUT: 65000, // 65 seconds
  CONNECTION_TIMEOUT: 120000, // 2 minutes
  REQUEST_TIMEOUT: 60000, // 1 minute
} as const;
```

### Timeout Messages

```typescript
export const TIMEOUT_MESSAGES = {
  REQUEST: 'Request timeout',
  GATEWAY: 'Gateway timeout',
  DATABASE: 'Database operation timeout',
} as const;
```

## Body Size Limits

**File**: `src/constants/body-limits.ts`

### Request Body Limits

```typescript
export const BODY_LIMITS = {
  DEFAULT: 1048576, // 1MB
  SMALL: 10240, // 10KB
  MEDIUM: 102400, // 100KB
  LARGE: 5242880, // 5MB

  // Specific endpoints
  AUTH_REQUEST: 10240, // 10KB
  TRIP_CREATE: 10240, // 10KB
  TRIP_UPDATE: 10240, // 10KB
  SETTINGS_UPDATE: 10240, // 10KB
  SYNC_PUSH: 1048576, // 1MB
  SYNC_PULL: 10240, // 10KB
  CSV_IMPORT: 5242880, // 5MB
  CSP_REPORT: 10240, // 10KB
} as const;
```

## Logging Constants

**File**: `src/constants/logging.ts`

### Log Configuration

```typescript
export const LOG_CONFIG = {
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },
  DEFAULT_LEVEL: 'info',
  PRODUCTION_LEVEL: 'info',
  DEVELOPMENT_LEVEL: 'debug',
  TEST_LEVEL: 'silent',
} as const;
```

### Log Rotation

```typescript
export const LOG_ROTATION = {
  ENABLED: true,
  DIRECTORY: './logs',
  FILE_PREFIX: 'api',
  MAX_FILES: 7,
  MAX_SIZE: '10M',
  INTERVAL: 'daily',
  COMPRESS: true,
} as const;
```

### Ignored Routes

```typescript
export const LOG_IGNORE_ROUTES = [
  '/health',
  '/health/*',
  '/documentation',
  '/documentation/*',
  '/metrics',
  '/favicon.ico',
] as const;
```

### Redacted Paths

```typescript
export const LOG_REDACT_PATHS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'cookie',
  'set-cookie',
  '*.token',
  '*.password',
  'req.headers.authorization',
  'req.headers.cookie',
] as const;
```

### Log Messages

```typescript
export const LOG_MESSAGES = {
  REQUEST_START: 'Request started',
  REQUEST_COMPLETE: 'Request completed',
  AUTH_ATTEMPT: 'Authentication attempt',
  AUTH_SUCCESS: 'Authentication successful',
  AUTH_FAILURE: 'Authentication failed',
  RATE_LIMIT_HIT: 'Rate limit exceeded',
  ERROR_HANDLED: 'Error handled',
  SHUTDOWN_INITIATED: 'Shutdown initiated',
  SHUTDOWN_COMPLETE: 'Shutdown complete',
  BODY_TOO_LARGE: 'Request body too large to log',
} as const;
```

## Security Constants

### Helmet Configuration

**File**: `src/constants/helmet.ts`

```typescript
export const HELMET_CONFIG = {
  PRODUCTION: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  },
  DEVELOPMENT: {
    contentSecurityPolicy: false,
    hsts: false,
    // Other settings remain
  },
} as const;
```

### CORS Configuration

**File**: `src/constants/cors.ts`

```typescript
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://app.usapresencecalculator.com',
    'https://usapresencecalculator.com',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
  EXPOSED_HEADERS: [
    'X-Request-ID',
    'X-Correlation-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  MAX_AGE: 86400, // 24 hours
  CREDENTIALS: true,
} as const;
```

## API Versioning Constants

**File**: `src/constants/api-versioning.ts`

```typescript
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
```

## Message Constants

### Trip Messages

**File**: `src/constants/trips-messages.ts`

```typescript
export const TRIPS_API_MESSAGES = {
  // Success
  TRIP_CREATED: 'Trip created successfully',
  TRIP_UPDATED: 'Trip updated successfully',
  TRIP_DELETED: 'Trip deleted successfully',

  // Errors
  TRIP_NOT_FOUND: 'Trip not found',
  INVALID_DATE_FORMAT: 'Date must be in YYYY-MM-DD format',
  INVALID_DATE_RANGE: 'Return date must be after or equal to departure date',
  INVALID_REQUEST_BODY: 'Invalid request body',
  DESTINATION_REQUIRED: 'Destination is required',
  VERSION_MISMATCH: 'Trip has been modified by another request',

  // Validation
  DEPARTURE_DATE_REQUIRED: 'Departure date is required',
  RETURN_DATE_REQUIRED: 'Return date is required',
  DESTINATION_TOO_LONG: 'Destination must be 100 characters or less',
  NOTES_TOO_LONG: 'Notes must be 500 characters or less',
} as const;
```

### User Messages

**File**: `src/constants/users-messages.ts`

```typescript
export const USERS_API_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
} as const;
```

### Settings Messages

**File**: `src/constants/settings.ts`

```typescript
export const SETTINGS_API_MESSAGES = {
  SETTINGS_RETRIEVED: 'Settings retrieved successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  SETTINGS_NOT_FOUND: 'Settings not found',
  INVALID_REQUEST_BODY: 'Invalid settings data',
  NO_CHANGES_PROVIDED: 'No changes provided',
  INVALID_THEME: 'Invalid theme selection',
  INVALID_LANGUAGE: 'Invalid language selection',
} as const;
```

### Sync Messages

**File**: `src/constants/sync-messages.ts`

```typescript
export const SYNC_MESSAGES = {
  // Success
  SYNC_COMPLETE: 'Sync completed successfully',
  NO_CHANGES: 'No changes to sync',
  CHANGES_PULLED: 'Changes pulled successfully',
  CHANGES_PUSHED: 'Changes pushed successfully',

  // Errors
  SYNC_FAILED: 'Sync failed',
  INVALID_SYNC_TOKEN: 'Invalid sync token',
  DEVICE_ID_REQUIRED: 'Device ID is required',
  SYNC_CONFLICT: 'Sync conflict detected',

  // Conflict Resolution
  SERVER_WINS: 'Server version kept',
  CLIENT_WINS: 'Client version kept',
  MANUAL_MERGE_REQUIRED: 'Manual merge required',
} as const;
```

## Database Constants

**File**: `src/constants/db.ts`

```typescript
export const DB_CONFIG = {
  FILENAME: process.env.DB_PATH || './data/app.db',
  TIMEOUT: 5000, // 5 seconds
  VERBOSE: process.env.NODE_ENV === 'development',
  WAL_MODE: true,
  FOREIGN_KEYS: true,
} as const;

export const DB_CONSTANTS = {
  MAX_BATCH_SIZE: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  UUID_LENGTH: 21, // CUID2 length
  MAX_STRING_LENGTH: 500,
  MAX_TEXT_LENGTH: 5000,
} as const;
```

## Environment Configuration

**File**: `src/config/env.ts`

### Required Environment Variables

```typescript
export const ENV_SCHEMA = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DB_PATH: z.string().default('./data/app.db'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Email (optional)
  EMAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Swagger (optional)
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
  SWAGGER_USERNAME: z.string().optional(),
  SWAGGER_PASSWORD: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().optional(), // Comma-separated
});
```

### Configuration Validation

```typescript
// Validate and parse environment
export const config = ENV_SCHEMA.parse(process.env);

// Helper to get typed config values
export function getConfig<K extends keyof typeof config>(key: K): (typeof config)[K] {
  return config[key];
}
```

---

Last updated: January 2025

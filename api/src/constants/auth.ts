export const AUTH_CONFIG = {
  // JWT Token Configuration
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes in milliseconds
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  JWT_ALGORITHM: 'HS256' as const,
  JWT_ISSUER: 'usa-presence-calculator',
  JWT_AUDIENCE: 'usa-presence-calculator-api',

  // Magic Link Configuration
  MAGIC_LINK_EXPIRY: 15 * 60 * 1000, // 15 minutes in milliseconds
  MAGIC_LINK_LENGTH: 32, // characters

  // Passkey Configuration
  RP_NAME: 'USA Presence Calculator',
  RP_ID: process.env.PASSKEY_RP_ID || 'localhost',
  PASSKEY_TIMEOUT: 60000, // 60 seconds
  ATTESTATION_PREFERENCE: 'none' as const,
  USER_VERIFICATION: 'preferred' as const,

  // Rate Limiting
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_MAGIC_LINK_REQUESTS: 3,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes

  // Session Configuration
  SESSION_COOKIE_NAME: 'usa-presence-session',
  REFRESH_COOKIE_NAME: 'usa-presence-refresh',
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  COOKIE_HTTP_ONLY: true,
  COOKIE_SAME_SITE: 'strict' as const,
  COOKIE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Email Configuration
  EMAIL_FROM: 'USA Presence Calculator <noreply@usapresencecalculator.com>',
  EMAIL_SUBJECT_MAGIC_LINK: 'Your sign-in link for USA Presence Calculator',
  EMAIL_SUBJECT_WELCOME: 'Welcome to USA Presence Calculator',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists with this email',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later',
  PASSKEY_REGISTRATION_FAILED: 'Failed to register passkey',
  PASSKEY_AUTHENTICATION_FAILED: 'Failed to authenticate with passkey',
  PASSKEY_ALREADY_REGISTERED: 'Authenticator was probably already registered by user',
  MAGIC_LINK_EXPIRED: 'Magic link has expired',
  MAGIC_LINK_ALREADY_USED: 'Magic link has already been used',
  SESSION_EXPIRED: 'Session has expired',
  UNAUTHORIZED: 'Unauthorized access',
  EMAIL_NOT_VERIFIED: 'Email address not verified',
  PASSKEY_NOT_FOUND: 'Passkey not found',
} as const;

export const AUTH_ROUTES = {
  // Passkey endpoints
  PASSKEY_REGISTER_OPTIONS: '/auth/passkey/register-options',
  PASSKEY_REGISTER_VERIFY: '/auth/passkey/register-verify',
  PASSKEY_LOGIN_OPTIONS: '/auth/passkey/login-options',
  PASSKEY_LOGIN_VERIFY: '/auth/passkey/login-verify',

  // Magic link endpoints
  MAGIC_LINK_REQUEST: '/auth/magic-link/request',
  MAGIC_LINK_VERIFY: '/auth/magic-link/verify',

  // Session endpoints
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  SESSION_STATUS: '/auth/session',

  // User endpoints
  PROFILE: '/auth/profile',
  DELETE_ACCOUNT: '/auth/delete-account',
} as const;

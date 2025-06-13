export const API_VERSION = {
  CURRENT: 'v1',
  PREFIX: '/api/v1',
  SUPPORTED_VERSIONS: ['v1'],
} as const;

export function getVersionedPath(path: string): string {
  return `${API_VERSION.PREFIX}${path}`;
}

export const API_PATHS = {
  // Auth
  AUTH_SESSION: getVersionedPath('/auth/session'),
  AUTH_MAGIC_LINK_SEND: getVersionedPath('/auth/magic-link/send'),
  AUTH_MAGIC_LINK_VERIFY: getVersionedPath('/auth/magic-link/verify'),
  AUTH_PASSKEY_OPTIONS: getVersionedPath('/auth/passkey/register/options'),
  AUTH_PASSKEY_VERIFY: getVersionedPath('/auth/passkey/register/verify'),
  AUTH_PASSKEY_AUTH_OPTIONS: getVersionedPath('/auth/passkey/authenticate/options'),
  AUTH_PASSKEY_AUTH_VERIFY: getVersionedPath('/auth/passkey/authenticate/verify'),
  AUTH_PASSKEY_LIST: getVersionedPath('/auth/passkey/list'),
  AUTH_PASSKEY_DELETE: (id: string) => getVersionedPath(`/auth/passkey/${id}`),
  AUTH_PASSKEY_RENAME: (id: string) => getVersionedPath(`/auth/passkey/${id}/rename`),
  AUTH_REFRESH_TOKEN: getVersionedPath('/auth/refresh-token'),
  AUTH_LOGOUT: getVersionedPath('/auth/logout'),

  // Users
  USERS_PROFILE: getVersionedPath('/users/profile'),

  // Settings
  USERS_SETTINGS: getVersionedPath('/users/settings'),

  // Trips
  TRIPS_LIST: getVersionedPath('/trips'),
  TRIPS_CREATE: getVersionedPath('/trips'),
  TRIPS_GET: (id: string) => getVersionedPath(`/trips/${id}`),
  TRIPS_UPDATE: (id: string) => getVersionedPath(`/trips/${id}`),
  TRIPS_DELETE: (id: string) => getVersionedPath(`/trips/${id}`),

  // Sync
  SYNC_PULL: getVersionedPath('/sync/pull'),
  SYNC_PUSH: getVersionedPath('/sync/push'),

  // Unversioned paths (health checks, monitoring)
  HEALTH: '/health',
  HEALTH_READY: '/health/ready',
  HEALTH_LIVE: '/health/live',

  // Security
  CSP_REPORT: getVersionedPath('/csp-report'),
} as const;

export type ApiPath = (typeof API_PATHS)[keyof typeof API_PATHS];

export const DEVELOPMENT_CONFIG = {
  HOT_RELOAD_ENABLED: true,
  WATCH_DIRECTORIES: ['src', '../shared/src'],
  WATCH_EXTENSIONS: ['ts', 'js', 'json'],
  RESTART_DELAY_MS: 1000,
  CLEAR_CONSOLE_ON_RESTART: true,
  TSX_OPTIONS: {
    ENABLE_SOURCE_MAPS: true,
    EXPERIMENTAL_SPECIFIER_RESOLUTION: 'node' as const,
  },
} as const;

export const DEVELOPMENT_MESSAGES = {
  SERVER_STARTING: '🚀 Starting development server...',
  SERVER_READY: '✅ Server ready',
  SERVER_RESTARTING: '🔄 Restarting due to changes...',
  BUILD_SUCCESS: '✅ Build completed successfully',
  BUILD_FAILED: '❌ Build failed',
  WATCHING_FOR_CHANGES: '👀 Watching for file changes...',
} as const;

export const DEVELOPMENT_PORTS = {
  DEFAULT: 3000,
  FALLBACK_PORTS: [3001, 3002, 3003],
  HEALTH_CHECK_PATH: '/health',
} as const;
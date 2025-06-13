export const SHUTDOWN = {
  TIMEOUT_MS: 30000, // 30 seconds
  SIGNALS: ['SIGTERM', 'SIGINT'] as const,
  MESSAGES: {
    RECEIVED: 'Shutdown signal received',
    CLOSING_SERVER: 'Closing HTTP server',
    SERVER_CLOSED: 'HTTP server closed',
    CLOSING_DATABASE: 'Closing database connections',
    DATABASE_CLOSED: 'Database connections closed',
    CLEANUP_COMPLETE: 'Graceful shutdown complete',
    TIMEOUT: 'Shutdown timeout exceeded, forcing exit',
    ERROR: 'Error during shutdown',
  },
} as const;

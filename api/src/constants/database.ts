export const DATABASE = {
  PRAGMA: {
    JOURNAL_MODE: 'WAL',
    BUSY_TIMEOUT: 5000,
    SYNCHRONOUS: 'NORMAL',
    CACHE_SIZE: -64000,
    TEMP_STORE: 'MEMORY',
    MMAP_SIZE: 2147483648,
  },
  MIGRATION: {
    TABLE_NAME: 'drizzle_migrations',
    FOLDER: 'migrations',
  },
  CONNECTION: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
  },
} as const;

import path from 'node:path';

export const BACKUP_CONFIG = {
  DIRECTORY: process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
  RETENTION_DAYS: 7,
  COMPRESSION: {
    ENABLED: true,
    LEVEL: 9, // Maximum compression
  },
  FILE_PREFIX: 'usa-presence-db',
  FILE_EXTENSION: '.sqlite',
  COMPRESSED_EXTENSION: '.sqlite.gz',
  MAX_CONCURRENT_BACKUPS: 1,
  LOCK_TIMEOUT_MS: 30000, // 30 seconds
} as const;

export const BACKUP_MESSAGES = {
  START: 'Starting database backup',
  SUCCESS: 'Database backup completed successfully',
  CLEANUP_START: 'Cleaning up old backups',
  CLEANUP_SUCCESS: 'Old backups cleaned up',
  ERROR: {
    DIRECTORY_CREATE: 'Failed to create backup directory',
    BACKUP_FAILED: 'Database backup failed',
    COMPRESSION_FAILED: 'Failed to compress backup file',
    CLEANUP_FAILED: 'Failed to clean up old backups',
    LOCK_TIMEOUT: 'Another backup is already running',
  },
} as const;

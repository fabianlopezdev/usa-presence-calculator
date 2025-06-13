#!/usr/bin/env node
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

import { format } from 'date-fns';

import { config } from '@api/config/env';
import { BACKUP_CONFIG, BACKUP_MESSAGES } from '@api/constants/backup';
import { getDatabasePath } from '@api/db/connection';

let isBackupRunning = false;

async function ensureBackupDirectory(): Promise<void> {
  try {
    await fs.mkdir(BACKUP_CONFIG.DIRECTORY, { recursive: true });
  } catch (error) {
    console.error(BACKUP_MESSAGES.ERROR.DIRECTORY_CREATE, error);
    throw error;
  }
}

async function createBackup(): Promise<string> {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const backupFileName = `${BACKUP_CONFIG.FILE_PREFIX}-${timestamp}${BACKUP_CONFIG.FILE_EXTENSION}`;
  const backupPath = path.join(BACKUP_CONFIG.DIRECTORY, backupFileName);
  const compressedPath = `${backupPath}${BACKUP_CONFIG.COMPRESSED_EXTENSION.replace(BACKUP_CONFIG.FILE_EXTENSION, '')}`;

  try {
    const sourcePath = getDatabasePath();

    if (BACKUP_CONFIG.COMPRESSION.ENABLED) {
      const readStream = createReadStream(sourcePath);
      const writeStream = createWriteStream(compressedPath);
      const gzipStream = createGzip({ level: BACKUP_CONFIG.COMPRESSION.LEVEL });

      await pipeline(readStream, gzipStream, writeStream);

      console.log(`Backup created: ${compressedPath}`);
      return compressedPath;
    } else {
      await fs.copyFile(sourcePath, backupPath);
      console.log(`Backup created: ${backupPath}`);
      return backupPath;
    }
  } catch (error) {
    console.error(BACKUP_MESSAGES.ERROR.BACKUP_FAILED, error);
    throw error;
  }
}

async function cleanupOldBackups(): Promise<void> {
  try {
    const files = await fs.readdir(BACKUP_CONFIG.DIRECTORY);
    const backupFiles = files.filter(
      (file) =>
        file.startsWith(BACKUP_CONFIG.FILE_PREFIX) &&
        (file.endsWith(BACKUP_CONFIG.FILE_EXTENSION) ||
          file.endsWith(BACKUP_CONFIG.COMPRESSED_EXTENSION)),
    );

    const now = Date.now();
    const retentionMs = BACKUP_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_CONFIG.DIRECTORY, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > retentionMs) {
        await fs.unlink(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error(BACKUP_MESSAGES.ERROR.CLEANUP_FAILED, error);
    // Don't throw here - cleanup failures shouldn't fail the backup
  }
}

async function runBackup(): Promise<void> {
  if (isBackupRunning) {
    console.error(BACKUP_MESSAGES.ERROR.LOCK_TIMEOUT);
    process.exit(1);
  }

  isBackupRunning = true;

  try {
    console.log(BACKUP_MESSAGES.START);
    console.log(`Database: ${config.NODE_ENV === 'production' ? 'production' : 'development'}`);

    await ensureBackupDirectory();
    const backupPath = await createBackup();

    console.log(BACKUP_MESSAGES.CLEANUP_START);
    await cleanupOldBackups();
    console.log(BACKUP_MESSAGES.CLEANUP_SUCCESS);

    console.log(BACKUP_MESSAGES.SUCCESS);
    console.log(`Backup location: ${backupPath}`);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  } finally {
    isBackupRunning = false;
  }
}

// Run if called directly
if (require.main === module) {
  runBackup().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runBackup };

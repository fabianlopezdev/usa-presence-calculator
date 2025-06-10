import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

import { config } from '@api/config/env';
import { DATABASE } from '@api/constants/database';

let db: BetterSQLite3Database | null = null;
let sqliteDb: Database.Database | null = null;

export function initializeDatabase(): BetterSQLite3Database {
  if (db) {
    return db;
  }

  const isTest = config.NODE_ENV === 'test';
  const dbPath = isTest ? ':memory:' : config.DATABASE_URL;

  if (!isTest && dbPath !== ':memory:') {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  sqliteDb = new Database(dbPath);

  sqliteDb.pragma(`journal_mode = ${DATABASE.PRAGMA.JOURNAL_MODE}`);
  sqliteDb.pragma(`busy_timeout = ${DATABASE.PRAGMA.BUSY_TIMEOUT}`);
  sqliteDb.pragma(`synchronous = ${DATABASE.PRAGMA.SYNCHRONOUS}`);
  sqliteDb.pragma(`cache_size = ${DATABASE.PRAGMA.CACHE_SIZE}`);
  sqliteDb.pragma(`temp_store = ${DATABASE.PRAGMA.TEMP_STORE}`);
  sqliteDb.pragma(`mmap_size = ${DATABASE.PRAGMA.MMAP_SIZE}`);

  if (config.ENABLE_FIELD_ENCRYPTION && config.DATABASE_ENCRYPTION_KEY) {
    sqliteDb.pragma(`key="${config.DATABASE_ENCRYPTION_KEY}"`);
  }

  db = drizzle(sqliteDb);

  return db;
}

export function getDatabase(): BetterSQLite3Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getSQLiteDatabase(): Database.Database {
  if (!sqliteDb) {
    throw new Error('Database not initialized');
  }
  return sqliteDb;
}

export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    db = null;
  }
}

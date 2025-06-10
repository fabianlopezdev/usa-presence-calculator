import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { config } from '@api/config/env';
import {
  initializeDatabase,
  closeDatabase,
  getDatabase,
  getSQLiteDatabase,
} from '@api/db/connection';

describe('Database Connection', () => {
  beforeEach(() => {
    closeDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('initializeDatabase', () => {
    it('should initialize database successfully', () => {
      const db = initializeDatabase();

      expect(db).toBeDefined();
      expect(db.constructor.name).toBe('BetterSQLite3Database');
    });

    it('should configure database with WAL mode', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();
      const walMode = sqliteDb.prepare('PRAGMA journal_mode').get() as { journal_mode: string };

      // In-memory databases use 'memory' mode instead of WAL
      if (config.NODE_ENV === 'test' && config.DATABASE_URL === ':memory:') {
        expect(walMode.journal_mode).toBe('memory');
      } else {
        expect(walMode.journal_mode).toBe('wal');
      }
    });

    it.skip('should configure database with encryption when enabled', () => {
      // Skip this test as standard SQLite doesn't support cipher_version pragma
      // This would only work with SQLCipher which we're not using yet
      if (config.ENABLE_FIELD_ENCRYPTION) {
        initializeDatabase();
        getSQLiteDatabase();
        // Would need SQLCipher for this to work
        // const cipher = sqliteDb.prepare('PRAGMA cipher_version').get() as { cipher_version?: string };
        // expect(cipher.cipher_version).toBeDefined();
      }
    });

    it('should reuse existing connection if already initialized', () => {
      const db1 = initializeDatabase();
      const db2 = initializeDatabase();

      expect(db1).toBe(db2);
    });
  });

  describe('getDatabase', () => {
    it('should return database instance after initialization', () => {
      initializeDatabase();
      const db = getDatabase();

      expect(db).toBeDefined();
      expect(db.constructor.name).toBe('BetterSQLite3Database');
    });

    it('should throw error if database not initialized', () => {
      expect(() => getDatabase()).toThrow('Database not initialized');
    });
  });

  describe('getSQLiteDatabase', () => {
    it('should return SQLite instance after initialization', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      expect(sqliteDb).toBeDefined();
      expect(sqliteDb.constructor.name).toBe('Database');
    });

    it('should throw error if database not initialized', () => {
      expect(() => getSQLiteDatabase()).toThrow('Database not initialized');
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection successfully', () => {
      initializeDatabase();
      closeDatabase();

      expect(() => getDatabase()).toThrow('Database not initialized');
    });

    it('should handle closing already closed database', () => {
      closeDatabase();
      expect(() => closeDatabase()).not.toThrow();
    });
  });

  describe('database operations', () => {
    it('should execute basic queries', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      const result = sqliteDb.prepare('SELECT 1 + 1 as sum').get() as { sum: number };
      expect(result.sum).toBe(2);
    });

    it('should handle transactions', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      const insert = sqliteDb.prepare('INSERT INTO test_table (value) VALUES (?)');
      const select = sqliteDb.prepare('SELECT * FROM test_table WHERE value = ?');

      sqliteDb.transaction(() => {
        insert.run('test_value');
      })();

      const result = select.get('test_value') as { id: number; value: string };
      expect(result).toBeDefined();
      expect(result.value).toBe('test_value');
    });
  });
});

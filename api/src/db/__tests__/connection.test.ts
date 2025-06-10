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

  describe('edge cases and error handling', () => {
    it('should handle empty database URL in production mode', () => {
      const originalEnv = config.NODE_ENV;
      const originalUrl = config.DATABASE_URL;

      Object.assign(config, { NODE_ENV: 'production' });
      Object.assign(config, { DATABASE_URL: '' });

      const db = initializeDatabase();
      expect(db).toBeDefined();

      const sqliteDb = getSQLiteDatabase();
      const result = sqliteDb.prepare('SELECT 1 as test').get() as { test: number };
      expect(result.test).toBe(1);

      closeDatabase();
      Object.assign(config, { NODE_ENV: originalEnv });
      Object.assign(config, { DATABASE_URL: originalUrl });
    });

    it('should handle concurrent initialization attempts', () => {
      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(initializeDatabase()));

      return Promise.all(promises).then((databases) => {
        const firstDb = databases[0];
        databases.forEach((db) => expect(db).toBe(firstDb));
      });
    });

    it('should recover from database errors', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      expect(() => {
        sqliteDb.prepare('INVALID SQL SYNTAX').get();
      }).toThrow();

      const result = sqliteDb.prepare('SELECT 1 as test').get() as { test: number };
      expect(result.test).toBe(1);
    });

    it('should handle large transactions', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS large_test (
          id INTEGER PRIMARY KEY,
          data TEXT
        )
      `);

      const insert = sqliteDb.prepare('INSERT INTO large_test (data) VALUES (?)');
      const largeData = 'x'.repeat(1000000);

      sqliteDb.transaction(() => {
        for (let i = 0; i < 100; i++) {
          insert.run(largeData);
        }
      })();

      const count = sqliteDb.prepare('SELECT COUNT(*) as count FROM large_test').get() as {
        count: number;
      };
      expect(count.count).toBe(100);

      sqliteDb.exec('DROP TABLE large_test');
    });

    it('should handle transaction rollback on error', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS rollback_test (
          id INTEGER PRIMARY KEY,
          value TEXT UNIQUE
        )
      `);

      const insert = sqliteDb.prepare('INSERT INTO rollback_test (value) VALUES (?)');

      expect(() => {
        sqliteDb.transaction(() => {
          insert.run('unique_value');
          insert.run('unique_value');
        })();
      }).toThrow();

      const count = sqliteDb.prepare('SELECT COUNT(*) as count FROM rollback_test').get() as {
        count: number;
      };
      expect(count.count).toBe(0);

      sqliteDb.exec('DROP TABLE rollback_test');
    });

    it('should handle prepared statement with various data types', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS type_test (
          id INTEGER PRIMARY KEY,
          text_val TEXT,
          int_val INTEGER,
          real_val REAL,
          blob_val BLOB,
          null_val TEXT
        )
      `);

      const insert = sqliteDb.prepare(`
        INSERT INTO type_test (text_val, int_val, real_val, blob_val, null_val) 
        VALUES (?, ?, ?, ?, ?)
      `);

      const buffer = Buffer.from('binary data');
      insert.run('text', 42, 3.14159, buffer, null);

      const result = sqliteDb.prepare('SELECT * FROM type_test').get() as {
        text_val: string;
        int_val: number;
        real_val: number;
        blob_val: Buffer;
        null_val: string | null;
      };

      expect(result.text_val).toBe('text');
      expect(result.int_val).toBe(42);
      expect(result.real_val).toBeCloseTo(3.14159);
      expect(Buffer.isBuffer(result.blob_val)).toBe(true);
      expect(result.blob_val.toString()).toBe('binary data');
      expect(result.null_val).toBeNull();

      sqliteDb.exec('DROP TABLE type_test');
    });

    it('should handle special characters in queries', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS special_chars (
          id INTEGER PRIMARY KEY,
          value TEXT
        )
      `);

      const insert = sqliteDb.prepare('INSERT INTO special_chars (value) VALUES (?)');
      const specialStrings = [
        "O'Brien",
        'Line1\nLine2',
        'Tab\tSeparated',
        'Quote"Inside',
        'Backslash\\Path',
        '😀🎉🌟',
        '<script>alert("xss")</script>',
        'NULL',
        '',
      ];

      specialStrings.forEach((str) => insert.run(str));

      const results = sqliteDb
        .prepare('SELECT value FROM special_chars ORDER BY id')
        .all() as Array<{ value: string }>;

      results.forEach((result, index) => {
        expect(result.value).toBe(specialStrings[index]);
      });

      sqliteDb.exec('DROP TABLE special_chars');
    });

    it('should handle database locking scenarios', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS lock_test (
          id INTEGER PRIMARY KEY,
          counter INTEGER DEFAULT 0
        )
      `);

      sqliteDb.prepare('INSERT INTO lock_test (id, counter) VALUES (1, 0)').run();

      const update = sqliteDb.prepare('UPDATE lock_test SET counter = counter + 1 WHERE id = 1');
      const select = sqliteDb.prepare('SELECT counter FROM lock_test WHERE id = 1');

      const promises = Array(10)
        .fill(null)
        .map(
          () =>
            new Promise<void>((resolve) => {
              update.run();
              resolve();
            }),
        );

      return Promise.all(promises).then(() => {
        const result = select.get() as { counter: number };
        expect(result.counter).toBe(10);
        sqliteDb.exec('DROP TABLE lock_test');
      });
    });

    it('should handle memory constraints gracefully', () => {
      initializeDatabase();
      const sqliteDb = getSQLiteDatabase();

      const pragma = sqliteDb.prepare('PRAGMA cache_size').get() as { cache_size: number };
      expect(pragma.cache_size).toBeDefined();

      sqliteDb.exec('PRAGMA cache_size = 100');
      const newPragma = sqliteDb.prepare('PRAGMA cache_size').get() as { cache_size: number };
      expect(Math.abs(newPragma.cache_size)).toBe(100);
    });
  });
});

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from '@api/config/env';
import { DATABASE } from '@api/constants/database';

import { getDatabase, getSQLiteDatabase, initializeDatabase } from './connection';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigrations(): void {
  console.warn('🚀 Running database migrations...');
  console.warn(`📁 Database URL: ${config.DATABASE_URL}`);

  try {
    initializeDatabase();
    const db = getDatabase();
    const sqliteDb = getSQLiteDatabase();

    const migrationsFolder = path.join(__dirname, '..', '..', DATABASE.MIGRATION.FOLDER);
    console.warn(`📂 Migrations folder: ${migrationsFolder}`);

    migrate(db, { migrationsFolder });

    const currentVersion = sqliteDb
      .prepare('SELECT user_version FROM pragma_user_version')
      .get() as {
      user_version: number;
    };
    console.warn(`✅ Migrations completed. Database version: ${currentVersion.user_version}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

void runMigrations();

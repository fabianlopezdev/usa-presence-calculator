import { getDatabase, getSQLiteDatabase } from '@api/db/connection';

/**
 * Executes a function within a database transaction
 * Since better-sqlite3 is synchronous and we have async operations,
 * we'll use manual transaction management
 */
export async function withTransaction<T>(
  fn: (db: ReturnType<typeof getDatabase>) => Promise<T>,
): Promise<T> {
  const db = getDatabase();
  const sqlite = getSQLiteDatabase();

  // Begin transaction
  sqlite.prepare('BEGIN').run();

  try {
    // Execute the async function
    const result = await fn(db);

    // Commit if successful
    sqlite.prepare('COMMIT').run();

    return result;
  } catch (error) {
    // Rollback on error
    try {
      sqlite.prepare('ROLLBACK').run();
    } catch {
      // Ignore rollback errors
    }
    throw error;
  }
}

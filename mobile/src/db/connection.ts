import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expoDb = openDatabaseSync('usa-presence-calculator.db');

export const db = drizzle(expoDb, { schema });

export async function initializeDatabase(): Promise<void> {
  try {
    await expoDb.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
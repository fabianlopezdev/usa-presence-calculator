import { sql } from 'drizzle-orm';

import { db } from './connection';

export function beginTransaction(): void {
  db.run(sql`BEGIN TRANSACTION`);
}

export function commitTransaction(): void {
  db.run(sql`COMMIT`);
}

export function rollbackTransaction(): void {
  db.run(sql`ROLLBACK`);
}

export async function runInTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  try {
    beginTransaction();
    const result = await callback();
    commitTransaction();
    return result;
  } catch (error) {
    rollbackTransaction();
    throw error;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
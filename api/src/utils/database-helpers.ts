import { SQL, and, asc, desc, eq, sql } from 'drizzle-orm';
import { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { getDatabase } from '@api/db/connection';
import { ConflictError, DatabaseError } from '@api/utils/errors';

// ===== TYPES =====

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: SQLiteColumn | SQL;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface FindOrCreateOptions<T> {
  table: SQLiteTable;
  where: SQL | undefined;
  create: Partial<T>;
}

export interface BatchInsertOptions {
  chunkSize?: number;
  onChunkComplete?: (processed: number, total: number) => void;
}

export interface OptimisticLockOptions {
  versionColumn: SQLiteColumn;
  incrementVersion?: boolean;
}

// ===== PAGINATION =====

export async function paginate<T>(
  table: SQLiteTable,
  options: PaginationOptions = {},
  where?: SQL,
): Promise<PaginationResult<T>> {
  const db = getDatabase();
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countQuery = db.select({ count: sql<number>`COUNT(*)` }).from(table);
    if (where) countQuery.where(where);
    const [{ count }] = await countQuery;
    const total = Number(count) || 0;

    // Get paginated data
    let dataQuery = db.select().from(table);
    if (where) {
      dataQuery = dataQuery.where(where) as typeof dataQuery;
    }
    if (options.orderBy) {
      dataQuery = dataQuery.orderBy(
        options.orderDirection === 'desc' ? desc(options.orderBy) : asc(options.orderBy),
      ) as typeof dataQuery;
    }

    const data = (await dataQuery.limit(limit).offset(offset)) as T[];
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    throw new DatabaseError('Pagination query failed', { error });
  }
}

// ===== FIND OR CREATE =====

export async function findOrCreate<T extends Record<string, unknown>>(
  options: FindOrCreateOptions<T>,
): Promise<{ record: T; created: boolean }> {
  const db = getDatabase();

  try {
    // Try to find existing record
    const existingQuery = db.select().from(options.table);

    if (options.where) {
      existingQuery.where(options.where);
    }

    const existing = await existingQuery;

    if (existing.length > 0) {
      return { record: existing[0] as T, created: false };
    }

    // Create new record if not found
    const [created] = await db.insert(options.table).values(options.create).returning();

    return { record: created as T, created: true };
  } catch (error) {
    throw new DatabaseError('Find or create operation failed', { error });
  }
}

// ===== BATCH INSERT =====

export async function batchInsert<T extends Record<string, unknown>>(
  table: SQLiteTable,
  records: T[],
  options: BatchInsertOptions = {},
): Promise<{ inserted: number }> {
  if (records.length === 0) {
    return { inserted: 0 };
  }

  const db = getDatabase();
  const chunkSize = options.chunkSize || 100;
  let totalInserted = 0;

  try {
    // Process in chunks
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);

      await db.insert(table).values(chunk);
      totalInserted += chunk.length;

      if (options.onChunkComplete) {
        options.onChunkComplete(totalInserted, records.length);
      }
    }

    return { inserted: totalInserted };
  } catch (error) {
    throw new DatabaseError('Batch insert failed', {
      error,
      inserted: totalInserted,
      total: records.length,
    });
  }
}

// ===== SOFT DELETE =====

export async function softDelete(
  table: SQLiteTable,
  where: SQL,
  _deletedAtColumn: SQLiteColumn,
): Promise<{ deleted: number }> {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  try {
    const result = await db
      .update(table)
      .set({ deletedAt: timestamp } as Record<string, unknown>)
      .where(where)
      .returning();

    return { deleted: result.length };
  } catch (error) {
    throw new DatabaseError('Soft delete failed', { error });
  }
}

// ===== OPTIMISTIC LOCKING =====

export async function withOptimisticLocking<T extends Record<string, unknown>>(
  table: SQLiteTable,
  id: string,
  idColumn: SQLiteColumn,
  currentVersion: number,
  updates: Partial<T>,
  options: OptimisticLockOptions,
): Promise<T> {
  const db = getDatabase();
  const { versionColumn, incrementVersion = true } = options;

  try {
    // Build update with version check
    const updateData: Record<string, unknown> = {
      ...updates,
      ...(incrementVersion ? { syncVersion: currentVersion + 1 } : {}),
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(table)
      .set(updateData)
      .where(and(eq(idColumn, id), eq(versionColumn, currentVersion)))
      .returning();

    if (result.length === 0) {
      throw new ConflictError('Record was modified by another process', {
        id,
        expectedVersion: currentVersion,
      });
    }

    return result[0] as T;
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    throw new DatabaseError('Optimistic locking update failed', { error });
  }
}

// ===== UTILITY FUNCTIONS =====

export async function exists(table: SQLiteTable, where: SQL): Promise<boolean> {
  const db = getDatabase();

  const [result] = await db
    .select({ count: sql<number>`1` })
    .from(table)
    .where(where)
    .limit(1);

  return result !== undefined;
}

export async function count(table: SQLiteTable, where?: SQL): Promise<number> {
  const db = getDatabase();

  const query = db.select({ count: sql<number>`COUNT(*)` }).from(table);

  if (where) {
    query.where(where);
  }

  const [result] = await query;
  return Number(result.count) || 0;
}

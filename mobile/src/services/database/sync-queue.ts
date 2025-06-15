import { eq, and, lt, sql } from 'drizzle-orm';

import { db } from '@/db/connection';
import { syncQueue } from '@/db/schema';
import { generateId, getCurrentTimestamp } from '@/db/utils';

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'trip' | 'user' | 'settings';
  entityId: string;
  data?: string;
  retryCount: number;
  lastAttempt?: string;
  createdAt: string;
}

const MAX_RETRY_COUNT = 3;

export class SyncQueueService {
  static async addToQueue(
    operation: SyncQueueItem['operation'],
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    data?: unknown
  ): Promise<void> {
    const id = generateId();
    const timestamp = getCurrentTimestamp();
    
    await db.insert(syncQueue).values({
      id,
      operation,
      entityType,
      entityId,
      data: data ? JSON.stringify(data) : null,
      retryCount: 0,
      lastAttempt: null,
      createdAt: timestamp,
    });
  }

  static async getQueueItems(limit = 10): Promise<SyncQueueItem[]> {
    const items = await db
      .select()
      .from(syncQueue)
      .where(lt(syncQueue.retryCount, MAX_RETRY_COUNT))
      .limit(limit);
      
    return items as SyncQueueItem[];
  }

  static async updateRetryCount(id: string): Promise<void> {
    const timestamp = getCurrentTimestamp();
    
    await db
      .update(syncQueue)
      .set({
        retryCount: sql`retry_count + 1`,
        lastAttempt: timestamp,
      })
      .where(eq(syncQueue.id, id));
  }

  static async removeFromQueue(id: string): Promise<void> {
    await db.delete(syncQueue).where(eq(syncQueue.id, id));
  }

  static async clearEntityFromQueue(
    entityType: string,
    entityId: string
  ): Promise<void> {
    await db
      .delete(syncQueue)
      .where(
        and(
          eq(syncQueue.entityType, entityType),
          eq(syncQueue.entityId, entityId)
        )
      );
  }

  static async getQueueSize(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(syncQueue);
      
    return result?.count ?? 0;
  }

  static async clearAllQueues(): Promise<void> {
    await db.delete(syncQueue);
  }
}
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'trip' | 'user' | 'settings';
  entityId: string;
  data?: unknown;
  timestamp: string;
  retryCount: number;
}

interface SyncState {
  lastSyncTimestamp: string | null;
  syncVersion: number;
  isSyncing: boolean;
  syncError: string | null;
  pendingOperations: SyncOperation[];
  conflictedItems: Array<{
    id: string;
    localData: unknown;
    remoteData: unknown;
    timestamp: string;
  }>;
  setSyncStatus: (isSyncing: boolean, error?: string | null) => void;
  updateSyncTimestamp: (timestamp: string, version: number) => void;
  addPendingOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) => void;
  removePendingOperation: (operationId: string) => void;
  incrementRetryCount: (operationId: string) => void;
  addConflict: (conflict: { id: string; localData: unknown; remoteData: unknown }) => void;
  resolveConflict: (conflictId: string) => void;
  clearAllPendingOperations: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastSyncTimestamp: null,
      syncVersion: 0,
      isSyncing: false,
      syncError: null,
      pendingOperations: [],
      conflictedItems: [],
      setSyncStatus: (isSyncing, error = null) => set({ isSyncing, syncError: error }),
      updateSyncTimestamp: (timestamp, version) => set({
        lastSyncTimestamp: timestamp,
        syncVersion: version,
      }),
      addPendingOperation: (operation) => set((state) => ({
        pendingOperations: [
          ...state.pendingOperations,
          {
            ...operation,
            id: `${operation.type}-${operation.entityId}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      })),
      removePendingOperation: (operationId) => set((state) => ({
        pendingOperations: state.pendingOperations.filter((op) => op.id !== operationId),
      })),
      incrementRetryCount: (operationId) => set((state) => ({
        pendingOperations: state.pendingOperations.map((op) =>
          op.id === operationId ? { ...op, retryCount: op.retryCount + 1 } : op
        ),
      })),
      addConflict: (conflict) => set((state) => ({
        conflictedItems: [
          ...state.conflictedItems,
          { ...conflict, timestamp: new Date().toISOString() },
        ],
      })),
      resolveConflict: (conflictId) => set((state) => ({
        conflictedItems: state.conflictedItems.filter((item) => item.id !== conflictId),
      })),
      clearAllPendingOperations: () => set({ pendingOperations: [] }),
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
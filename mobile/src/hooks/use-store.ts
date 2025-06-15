import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Trip, UserProfile } from '@usa-presence/shared';

import { useUserStore, useTripsStore, useUIStore, useSyncStore } from '@/stores';

interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface StoreReturn {
  user: {
    user: UserProfile | null;
    isAuthenticated: boolean;
    setUser: (user: UserProfile | null) => void;
    logout: () => void;
  };
  trips: {
    trips: Trip[];
    isLoading: boolean;
    error: string | null;
    addTrip: (trip: Trip) => void;
    updateTrip: (id: string, trip: Partial<Trip>) => void;
    deleteTrip: (id: string) => void;
  };
  ui: {
    modals: {
      addTrip: ModalState;
      editTrip: ModalState;
      deleteConfirm: ModalState;
      syncStatus: ModalState;
    };
    toasts: Toast[];
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    openModal: (modal: keyof StoreReturn['ui']['modals']) => void;
    closeModal: (modal: keyof StoreReturn['ui']['modals']) => void;
  };
  sync: {
    isSyncing: boolean;
    syncError: string | null;
    lastSyncTimestamp: string | null;
    pendingOperations: unknown[];
  };
  isOffline: () => boolean;
}

export function useStore(): StoreReturn {
  const user = useUserStore(useShallow((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    setUser: state.setUser,
    logout: state.logout,
  })));

  const trips = useTripsStore(useShallow((state) => ({
    trips: state.trips,
    isLoading: state.isLoading,
    error: state.error,
    addTrip: state.addTrip,
    updateTrip: state.updateTrip,
    deleteTrip: state.deleteTrip,
  })));

  const ui = useUIStore(useShallow((state) => ({
    modals: state.modals,
    toasts: state.toasts,
    showToast: state.showToast,
    openModal: state.openModal,
    closeModal: state.closeModal,
  })));

  const sync = useSyncStore(useShallow((state) => ({
    isSyncing: state.isSyncing,
    syncError: state.syncError,
    lastSyncTimestamp: state.lastSyncTimestamp,
    pendingOperations: state.pendingOperations,
  })));

  const isOffline = useCallback(() => sync.pendingOperations.length > 0 || !user.isAuthenticated, [sync.pendingOperations.length, user.isAuthenticated]);

  return {
    user,
    trips,
    ui,
    sync,
    isOffline,
  };
}
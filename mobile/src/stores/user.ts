import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

import type { UserProfile } from '@usa-presence/shared';

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

interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authToken: string | null;
  refreshToken: string | null;
  lastSyncedAt: string | null;
  setUser: (user: UserProfile | null) => void;
  setTokens: (authToken: string | null, refreshToken: string | null) => void;
  updateLastSynced: (timestamp: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authToken: null,
      refreshToken: null,
      lastSyncedAt: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (authToken, refreshToken) => set({ authToken, refreshToken }),
      updateLastSynced: (timestamp) => set({ lastSyncedAt: timestamp }),
      logout: () => set({
        user: null,
        isAuthenticated: false,
        authToken: null,
        refreshToken: null,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

import type { Trip } from '@usa-presence/shared';

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

interface TripsState {
  trips: Trip[];
  pendingSyncTrips: string[];
  isLoading: boolean;
  error: string | null;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setTrips: (trips: Trip[]) => void;
  markTripForSync: (tripId: string) => void;
  clearSyncedTrip: (tripId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTripsStore = create<TripsState>()(
  persist(
    (set) => ({
      trips: [],
      pendingSyncTrips: [],
      isLoading: false,
      error: null,
      addTrip: (trip) => set((state) => ({
        trips: [...state.trips, trip],
        pendingSyncTrips: [...state.pendingSyncTrips, trip.id],
      })),
      updateTrip: (id, updates) => set((state) => ({
        trips: state.trips.map((trip) =>
          trip.id === id ? { ...trip, ...updates } : trip
        ),
        pendingSyncTrips: state.pendingSyncTrips.includes(id)
          ? state.pendingSyncTrips
          : [...state.pendingSyncTrips, id],
      })),
      deleteTrip: (id) => set((state) => ({
        trips: state.trips.filter((trip) => trip.id !== id),
        pendingSyncTrips: [...state.pendingSyncTrips, id],
      })),
      setTrips: (trips) => set({ trips }),
      markTripForSync: (tripId) => set((state) => ({
        pendingSyncTrips: state.pendingSyncTrips.includes(tripId)
          ? state.pendingSyncTrips
          : [...state.pendingSyncTrips, tripId],
      })),
      clearSyncedTrip: (tripId) => set((state) => ({
        pendingSyncTrips: state.pendingSyncTrips.filter((id) => id !== tripId),
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'trips-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        trips: state.trips,
        pendingSyncTrips: state.pendingSyncTrips,
      }),
    }
  )
);
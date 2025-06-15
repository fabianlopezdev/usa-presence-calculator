import type { StateCreator } from 'zustand';

export interface StoreSlice<T> {
  set: (partial: Partial<T>) => void;
  get: () => T;
}

export type SliceCreator<T> = StateCreator<
  T,
  [],
  [],
  T
>;
import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

interface UIState {
  isNavigationReady: boolean;
  activeTab: string;
  modals: {
    addTrip: ModalState;
    editTrip: ModalState;
    deleteConfirm: ModalState;
    syncStatus: ModalState;
  };
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  loadingStates: Record<string, boolean>;
  setNavigationReady: (ready: boolean) => void;
  setActiveTab: (tab: string) => void;
  openModal: (modalName: keyof UIState['modals'], data?: unknown) => void;
  closeModal: (modalName: keyof UIState['modals']) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  dismissToast: (id: string) => void;
  setLoading: (key: string, isLoading: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isNavigationReady: false,
  activeTab: 'dashboard',
  modals: {
    addTrip: { isOpen: false },
    editTrip: { isOpen: false },
    deleteConfirm: { isOpen: false },
    syncStatus: { isOpen: false },
  },
  toasts: [],
  loadingStates: {},
  setNavigationReady: (ready) => set({ isNavigationReady: ready }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  openModal: (modalName, data) => set((state) => ({
    modals: {
      ...state.modals,
      [modalName]: { isOpen: true, data },
    },
  })),
  closeModal: (modalName) => set((state) => ({
    modals: {
      ...state.modals,
      [modalName]: { isOpen: false, data: undefined },
    },
  })),
  showToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    if (duration && duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
  },
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),
  setLoading: (key, isLoading) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: isLoading,
    },
  })),
}));
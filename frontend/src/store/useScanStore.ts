import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult } from 'src/types/scan.types';
const HISTORY_LIMIT = 50;

interface ScanState {
  currentScan: ScanResult | null;
  history: ScanResult[];
  isLoading: boolean;
}

interface ScanActions {
  setLoading: (loading: boolean) => void;
  setScanResult: (result: ScanResult) => void;
  clearCurrent: () => void;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;
}

type ScanStore = ScanState & ScanActions;

export const useScanStore = create<ScanStore>()(
  persist(
    (set) => ({
      currentScan: null,
      history: [],
      isLoading: false,

      setLoading: (loading) => set({ isLoading: loading }),

      setScanResult: (result) =>
        set((state) => ({
          currentScan: result,
          history: [result, ...state.history].slice(0, HISTORY_LIMIT),
        })),

      clearCurrent: () => set({ currentScan: null }),

      deleteFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'scan-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ history: state.history }),
    },
  ),
);

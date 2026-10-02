import { create } from "zustand";
import { RequestMetric } from "@/types/api";

interface DevToolsState {
  metrics: RequestMetric[];
  addMetric: (metric: RequestMetric) => void;
  clearMetrics: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const useDevToolsStore = create<DevToolsState>((set) => ({
  metrics: [],
  isOpen: false,
  addMetric: (metric) =>
    set((state) => ({
      metrics: [metric, ...state.metrics].slice(0, 50),
    })),
  clearMetrics: () => set({ metrics: [] }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
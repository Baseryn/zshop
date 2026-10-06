import { create } from "zustand";
import { RequestMetric } from "@/types/api";

export type DevToolsTab = "context" | "network" | "schema" | "sse";

interface DevToolsState {
  isOpen: boolean;
  activeTab: DevToolsTab;
  metrics: RequestMetric[];
  selectedMetric: RequestMetric | null;
  schemaData: any | null;
  isSchemaLoading: boolean;

  // Actions
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setActiveTab: (tab: DevToolsTab) => void;
  addMetric: (metric: RequestMetric) => void;
  clearMetrics: () => void;
  setSelectedMetric: (metric: RequestMetric | null) => void;
  setSchemaData: (data: any) => void;
  setSchemaLoading: (loading: boolean) => void;
}

export const useDevToolsStore = create<DevToolsState>((set) => ({
  isOpen: false,
  activeTab: "context",
  metrics: [],
  selectedMetric: null,
  schemaData: null,
  isSchemaLoading: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  addMetric: (metric) =>
    set((state) => ({
      metrics: [metric, ...state.metrics].slice(0, 50),
    })),
  clearMetrics: () => set({ metrics: [], selectedMetric: null }),
  setSelectedMetric: (selectedMetric) => set({ selectedMetric }),
  setSchemaData: (schemaData) => set({ schemaData }),
  setSchemaLoading: (isSchemaLoading) => set({ isSchemaLoading }),
}));
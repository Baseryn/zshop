import { create } from "zustand";
import { ConnectionStatus, StreamEventLog } from "@/types/realtime";

interface RealtimeState {
  status: ConnectionStatus;
  events: StreamEventLog[];
  lastEvent: StreamEventLog | null;

  // Actions
  setStatus: (status: ConnectionStatus) => void;
  addEvent: (event: string, data: any) => void;
  clearEvents: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: "disconnected",
  events: [],
  lastEvent: null,

  setStatus: (status) => set({ status }),
  addEvent: (event, data) => {
    const log: StreamEventLog = {
      id: crypto.randomUUID(),
      event,
      data,
      receivedAt: new Date().toLocaleTimeString(),
    };

    set((state) => ({
      events: [log, ...state.events].slice(0, 50),
      lastEvent: log,
    }));
  },
  clearEvents: () => set({ events: [], lastEvent: null }),
}));
import { create } from "zustand";

/**
 * Local UI state only: the Realtime connection status for the "Live" indicator.
 * Server data (products, cart, orders, profile) lives in TanStack Query, never here.
 */
export type RealtimeStatus = "idle" | "connecting" | "live" | "reconnecting";

interface SyncState {
  realtime: RealtimeStatus;
  setRealtime: (status: RealtimeStatus) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  realtime: "idle",
  setRealtime: (realtime) => set({ realtime }),
}));

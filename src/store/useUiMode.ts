import { create } from "zustand";
import type { SidebarMode } from "@/types";

type UiModeState = {
  sidebarMode: SidebarMode;
  planDialogOpen: boolean;
  connectionsDialogOpen: boolean;
  selectedDateISO: string | null;
  setSidebarMode: (mode: SidebarMode) => void;
  toggleSidebar: () => void;
  openPlanDialog: () => void;
  closePlanDialog: () => void;
  openConnectionsDialog: () => void;
  closeConnectionsDialog: () => void;
  setSelectedDate: (dateISO: string | null) => void;
};

export const useUiMode = create<UiModeState>()((set) => ({
  sidebarMode: "workouts",
  planDialogOpen: false,
  connectionsDialogOpen: false,
  selectedDateISO: null,
  setSidebarMode: (sidebarMode) => set({ sidebarMode }),
  toggleSidebar: () =>
    set((s) => ({ sidebarMode: s.sidebarMode === "workouts" ? "coach" : "workouts" })),
  openPlanDialog: () => set({ planDialogOpen: true }),
  closePlanDialog: () => set({ planDialogOpen: false }),
  openConnectionsDialog: () => set({ connectionsDialogOpen: true }),
  closeConnectionsDialog: () => set({ connectionsDialogOpen: false }),
  setSelectedDate: (selectedDateISO) => set({ selectedDateISO }),
}));

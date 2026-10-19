import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { OuraDay } from "@/types";
import { fetchOuraDays } from "@/lib/oura";

const DAYS_KEY = "rj.oura.days";
const LAST_SYNC_KEY = "rj.oura.lastSyncedAt";

type OuraState = {
  days: Record<string, OuraDay>;
  lastSyncedAt: string | null;
  syncing: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  sync: () => Promise<void>;
  clear: () => Promise<void>;
};

const toMap = (list: OuraDay[]) => Object.fromEntries(list.map((d) => [d.dateISO, d]));

export const useOura = create<OuraState>()((set) => ({
  days: {},
  lastSyncedAt: null,
  syncing: false,
  error: null,

  hydrate: async () => {
    const [days, lastSyncedAt] = await Promise.all([
      idbGet<OuraDay[]>(DAYS_KEY),
      idbGet<string>(LAST_SYNC_KEY),
    ]);
    set({ days: toMap(days ?? []), lastSyncedAt: lastSyncedAt ?? null });
  },

  sync: async () => {
    set({ syncing: true, error: null });
    try {
      const days = await fetchOuraDays();
      const now = new Date().toISOString();
      await idbSet(DAYS_KEY, days);
      await idbSet(LAST_SYNC_KEY, now);
      set({ days: toMap(days), lastSyncedAt: now, syncing: false });
    } catch (e) {
      set({ syncing: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  clear: async () => {
    await idbDel(DAYS_KEY);
    await idbDel(LAST_SYNC_KEY);
    set({ days: {}, lastSyncedAt: null, error: null });
  },
}));

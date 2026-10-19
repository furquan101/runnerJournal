import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type { RunDetail } from "@/types";
import { fetchActivityDetail } from "@/lib/strava";
import { getValidAccessToken } from "@/lib/stravaOAuth";

const key = (id: number) => `rj.strava.detail.${id}`;

type RunDetailsState = {
  details: Record<number, RunDetail>;
  load: (id: number) => Promise<void>;
};

const inFlight = new Set<number>();

/** Route + splits per activity, fetched on demand and cached in IndexedDB. */
export const useRunDetails = create<RunDetailsState>()((set, get) => ({
  details: {},
  load: async (id) => {
    if (get().details[id] || inFlight.has(id)) return;
    inFlight.add(id);
    try {
      let detail = await idbGet<RunDetail>(key(id));
      if (!detail) {
        detail = await fetchActivityDetail(await getValidAccessToken(), id);
        await idbSet(key(id), detail);
      }
      set((s) => ({ details: { ...s.details, [id]: detail! } }));
    } catch {
      // No route to show (not connected, or a private/manual activity); the card falls back to stats.
    } finally {
      inFlight.delete(id);
    }
  },
}));

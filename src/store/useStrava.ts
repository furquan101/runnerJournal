import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { StravaActivity } from "@/types";
import { fetchActivities } from "@/lib/strava";
import { getValidAccessToken } from "@/lib/stravaOAuth";

const ACTIVITIES_KEY = "rj.strava.activities";
const LAST_SYNC_KEY = "rj.strava.lastSyncedAt";

type StravaState = {
  activities: StravaActivity[];
  lastSyncedAt: string | null;
  syncing: boolean;
  error: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  sync: () => Promise<void>;
  clear: () => Promise<void>;
};

export const useStrava = create<StravaState>()((set) => ({
  activities: [],
  lastSyncedAt: null,
  syncing: false,
  error: null,
  hydrated: false,

  hydrate: async () => {
    const [activities, lastSyncedAt] = await Promise.all([
      idbGet<StravaActivity[]>(ACTIVITIES_KEY),
      idbGet<string>(LAST_SYNC_KEY),
    ]);
    set({
      activities: activities ?? [],
      lastSyncedAt: lastSyncedAt ?? null,
      hydrated: true,
    });
  },

  sync: async () => {
    set({ syncing: true, error: null });
    try {
      const accessToken = await getValidAccessToken();
      const activities = await fetchActivities({ accessToken, perPage: 60 });
      const now = new Date().toISOString();
      await idbSet(ACTIVITIES_KEY, activities);
      await idbSet(LAST_SYNC_KEY, now);
      set({ activities, lastSyncedAt: now, syncing: false, error: null });
    } catch (e) {
      set({
        syncing: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  clear: async () => {
    await idbDel(ACTIVITIES_KEY);
    await idbDel(LAST_SYNC_KEY);
    set({ activities: [], lastSyncedAt: null, error: null });
  },
}));

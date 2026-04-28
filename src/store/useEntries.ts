import { create } from "zustand";
import type { JournalEntry } from "@/types";
import { allEntries, putEntry } from "@/lib/storage";

type EntriesState = {
  entries: Record<string, JournalEntry>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  upsert: (entry: JournalEntry) => Promise<void>;
  getByDate: (dateISO: string) => JournalEntry | undefined;
};

export const useEntries = create<EntriesState>()((set, get) => ({
  entries: {},
  hydrated: false,
  hydrate: async () => {
    const list = await allEntries();
    const map: Record<string, JournalEntry> = {};
    for (const e of list) map[e.dateISO] = e;
    set({ entries: map, hydrated: true });
  },
  upsert: async (entry) => {
    await putEntry(entry);
    set((s) => ({ entries: { ...s.entries, [entry.dateISO]: entry } }));
  },
  getByDate: (dateISO) => get().entries[dateISO],
}));

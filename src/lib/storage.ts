import { get, set, entries } from "idb-keyval";
import type { JournalEntry } from "@/types";

const ENTRY_PREFIX = "entry:";
const entryKey = (dateISO: string) => `${ENTRY_PREFIX}${dateISO}`;

export async function getEntry(dateISO: string): Promise<JournalEntry | undefined> {
  return await get<JournalEntry>(entryKey(dateISO));
}

export async function putEntry(entry: JournalEntry): Promise<void> {
  await set(entryKey(entry.dateISO), entry);
}

export async function allEntries(): Promise<JournalEntry[]> {
  const all = await entries<string, JournalEntry>();
  return all
    .filter(([k]) => typeof k === "string" && k.startsWith(ENTRY_PREFIX))
    .map(([, v]) => v);
}

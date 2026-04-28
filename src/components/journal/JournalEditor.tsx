import { useEffect, useMemo, useRef, useState } from "react";
import { useEntries } from "@/store/useEntries";
import { usePlan } from "@/store/usePlan";
import { useUiMode } from "@/store/useUiMode";
import { todayISO, workoutForDate } from "@/lib/date";
import { promptForDate } from "@/lib/prompts";
import { EntryHeader } from "@/components/journal/EntryHeader";
import { parseISO } from "date-fns";

const SAVE_DEBOUNCE_MS = 500;

export function JournalEditor() {
  const selectedDateISO = useUiMode((s) => s.selectedDateISO);
  const today = useMemo(() => todayISO(), []);
  const dateISO = selectedDateISO ?? today;
  const date = useMemo(() => parseISO(dateISO), [dateISO]);

  const hydrated = useEntries((s) => s.hydrated);
  const upsert = useEntries((s) => s.upsert);
  const plan = usePlan((s) => s.plan);
  const workout = useMemo(() => workoutForDate(plan, dateISO), [plan, dateISO]);

  const [body, setBody] = useState("");
  const prevDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const prev = prevDateRef.current;
    if (prev !== null && prev !== dateISO) {
      void upsert({
        dateISO: prev,
        workoutId: workoutForDate(plan, prev)?.id,
        body,
        updatedAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBody(useEntries.getState().entries[dateISO]?.body ?? "");
    prevDateRef.current = dateISO;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, dateISO]);

  useEffect(() => {
    if (!hydrated || prevDateRef.current !== dateISO) return;
    const handle = window.setTimeout(() => {
      void upsert({
        dateISO,
        workoutId: workout?.id,
        body,
        updatedAt: new Date().toISOString(),
      });
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [body, hydrated, dateISO, workout?.id, upsert]);

  return (
    <div className="flex h-full flex-col chrome-group">
      <div className="px-[120px] pt-[86px]">
        <EntryHeader date={date} workout={workout} />
      </div>
      <textarea
        key={dateISO}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={promptForDate(dateISO)}
        className="flex-1 w-full max-w-[856px] mx-[120px] mt-10 mb-24 resize-none border-0 bg-transparent text-black outline-none focus:outline-none placeholder:opacity-60"
        style={{
          fontSize: "var(--rj-font-size, 20px)",
          lineHeight: 1.6,
          minHeight: 0,
        }}
        autoFocus
        spellCheck
      />
    </div>
  );
}

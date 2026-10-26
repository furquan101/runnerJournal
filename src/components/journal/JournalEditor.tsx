import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useEntries } from "@/store/useEntries";
import { usePlan } from "@/store/usePlan";
import { useStrava } from "@/store/useStrava";
import { useUiMode } from "@/store/useUiMode";
import { todayISO, workoutForDate } from "@/lib/date";
import { promptForDate } from "@/lib/prompts";
import { activitiesOnDate } from "@/lib/runStats";
import { EntryHeader } from "@/components/journal/EntryHeader";

const SAVE_DEBOUNCE_MS = 500;

export function JournalEditor() {
  const selectedDateISO = useUiMode((s) => s.selectedDateISO);
  const setSelectedDate = useUiMode((s) => s.setSelectedDate);
  const today = useMemo(() => todayISO(), []);
  const dateISO = selectedDateISO ?? today;
  const date = useMemo(() => parseISO(dateISO), [dateISO]);

  const hydrated = useEntries((s) => s.hydrated);
  const upsert = useEntries((s) => s.upsert);
  const plan = usePlan((s) => s.plan);
  const workout = useMemo(() => workoutForDate(plan, dateISO), [plan, dateISO]);
  const allActivities = useStrava((s) => s.activities);
  const activities = useMemo(() => activitiesOnDate(allActivities, dateISO), [allActivities, dateISO]);

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

  const shiftDay = (days: number) => {
    const next = format(addDays(date, days), "yyyy-MM-dd");
    setSelectedDate(next === today ? null : next);
  };

  return (
    <div className="flex h-full flex-col chrome-group">
      <div className="px-6 pt-10 md:px-[120px] md:pt-[86px] flex flex-col gap-4">
        <EntryHeader
          date={date}
          workout={workout}
          done={activities.length > 0 || !!workout?.completed}
          onPrev={() => shiftDay(-1)}
          onNext={dateISO < today ? () => shiftDay(1) : undefined}
        />
      </div>
      <textarea
        key={dateISO}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={promptForDate(dateISO)}
        className="flex-1 w-auto max-w-[856px] mx-6 md:mx-[120px] mt-8 mb-6 md:mb-24 resize-none border-0 bg-transparent text-black outline-none focus:outline-none placeholder:opacity-60"
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

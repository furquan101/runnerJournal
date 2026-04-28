import { DotSeparator } from "@/components/DotSeparator";
import { formatEntryHeading } from "@/lib/date";
import type { Workout } from "@/types";

export function EntryHeader({ date, workout }: { date: Date; workout?: Workout }) {
  return (
    <div className="chrome flex items-center gap-3 text-base text-black opacity-70">
      <span>{formatEntryHeading(date)}</span>
      {workout && (
        <>
          <DotSeparator />
          <span>{workout.description}</span>
        </>
      )}
    </div>
  );
}

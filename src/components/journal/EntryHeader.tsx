import { DotSeparator } from "@/components/DotSeparator";
import { formatEntryHeading } from "@/lib/date";
import type { Workout } from "@/types";

export function EntryHeader({ date, workout }: { date: Date; workout?: Workout }) {
  const distance =
    workout && workout.type !== "rest" && workout.distanceMiles > 0
      ? `${workout.distanceMiles} mi`
      : null;

  return (
    <div className="chrome flex items-center gap-3 text-base text-black opacity-70">
      <span>{formatEntryHeading(date)}</span>
      {distance && (
        <>
          <DotSeparator />
          <span>{distance}</span>
        </>
      )}
      {workout && (
        <>
          <DotSeparator />
          <span>{workout.description}</span>
        </>
      )}
      {workout?.pace && (
        <>
          <DotSeparator />
          <span>{workout.pace}</span>
        </>
      )}
    </div>
  );
}

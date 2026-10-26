import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { DotSeparator } from "@/components/DotSeparator";
import { formatEntryHeading } from "@/lib/date";
import type { Workout } from "@/types";

export function EntryHeader({
  date,
  workout,
  done,
  onPrev,
  onNext,
}: {
  date: Date;
  workout?: Workout;
  done: boolean;
  onPrev: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="chrome flex max-w-[856px] flex-wrap items-center gap-3 text-base text-black">
        <span>{formatEntryHeading(date)}</span>
        {workout && (
          <>
            <DotSeparator />
            {done ? (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Check className="size-4" aria-hidden />
                {workout.description}
              </span>
            ) : (
              <span className="opacity-70">Planned: {workout.description}</span>
            )}
          </>
        )}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous day"
            className="grid size-6 place-items-center rounded hover:bg-neutral-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            aria-label="Next day"
            className="grid size-6 place-items-center rounded hover:bg-neutral-100 disabled:opacity-0"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

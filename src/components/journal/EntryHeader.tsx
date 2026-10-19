import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { DotSeparator } from "@/components/DotSeparator";
import { formatEntryHeading } from "@/lib/date";
import { describeActivity } from "@/lib/runStats";
import { describeOuraDay } from "@/lib/oura";
import type { OuraDay, StravaActivity, Workout } from "@/types";

export function EntryHeader({
  date,
  workout,
  activities,
  oura,
  onPrev,
  onNext,
}: {
  date: Date;
  workout?: Workout;
  activities: StravaActivity[];
  oura?: OuraDay;
  onPrev: () => void;
  onNext?: () => void;
}) {
  const ran = activities.length > 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="chrome flex max-w-[856px] flex-wrap items-center gap-3 text-base text-black">
        <span>{formatEntryHeading(date)}</span>
        {workout && (
          <>
            <DotSeparator />
            {ran || workout.completed ? (
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
      {activities.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm text-black">
          <span className="inline-block size-2 rounded-full bg-[#FC4C02]" aria-hidden />
          <span className="text-[#FC4C02]">Strava</span>
          <span className="opacity-80">
            {a.name} · {describeActivity(a)}
          </span>
        </div>
      ))}
      {oura && describeOuraDay(oura) && (
        <div className="flex items-center gap-2 text-sm text-black">
          <span className="inline-block size-2 rounded-full bg-[#2f3a8f]" aria-hidden />
          <span className="text-[#2f3a8f]">Oura</span>
          <span className="opacity-80">{describeOuraDay(oura)}</span>
        </div>
      )}
    </div>
  );
}

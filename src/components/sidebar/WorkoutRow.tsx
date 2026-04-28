import { DotSeparator } from "@/components/DotSeparator";
import type { Workout } from "@/types";

export function WorkoutRow({
  workout,
  selected = false,
  onSelect,
  onToggleComplete,
}: {
  workout: Workout;
  selected?: boolean;
  onSelect?: () => void;
  onToggleComplete?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "chrome group flex w-full flex-col gap-3 rounded-md border-b border-[#d9d9d9] px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-100 focus:outline-none focus-visible:bg-neutral-100 " +
        (selected ? "bg-neutral-100" : "")
      }
    >
      <p className="text-xl text-black">{workout.weekday}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-sm text-black">
        <span>{workout.description}</span>
        {workout.pace && (
          <>
            <DotSeparator />
            <span>{workout.pace}</span>
          </>
        )}
        <DotSeparator />
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggleComplete?.();
            }
          }}
          className={
            "cursor-pointer text-sm transition " +
            (workout.completed ? "text-emerald-700" : "text-black/60 hover:text-black")
          }
        >
          {workout.completed ? "Complete" : "Mark complete"}
        </span>
      </div>
    </button>
  );
}

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUiMode } from "@/store/useUiMode";
import { usePlan } from "@/store/usePlan";
import { groupByWeek, weekMiles, findCurrentWeekIndex } from "@/lib/planWeeks";
import { todayISO } from "@/lib/date";

export function PlanOverviewDialog() {
  const open = useUiMode((s) => s.planOverviewDialogOpen);
  const close = useUiMode((s) => s.closePlanOverviewDialog);
  const plan = usePlan((s) => s.plan);

  const weeks = useMemo(() => (plan ? groupByWeek(plan.schedule) : []), [plan]);
  const [weekIndex, setWeekIndex] = useState(0);

  useEffect(() => {
    if (open) setWeekIndex(findCurrentWeekIndex(weeks, todayISO()));
  }, [open, weeks]);

  if (!plan) return null;

  const currentWeek = weeks[weekIndex];
  const canPrev = weekIndex > 0;
  const canNext = weekIndex < weeks.length - 1;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && canPrev) {
      e.preventDefault();
      setWeekIndex((i) => i - 1);
    } else if (e.key === "ArrowRight" && canNext) {
      e.preventDefault();
      setWeekIndex((i) => i + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-[720px]" onKeyDown={onKeyDown}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-normal">
            {plan.target.race} plan overview
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
          <p className="text-base text-black">
            {format(parseISO(plan.target.raceDate), "d LLL yyyy")} · Goal {plan.target.goalTime}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70">
            <span>{weeks.length} weeks</span>
            <span>{plan.target.trainingFreqPerWeek} runs / week</span>
          </div>
        </div>

        {weeks.length === 0 ? (
          <p className="text-sm opacity-60">No workouts in this plan yet.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setWeekIndex((i) => i - 1)}
                disabled={!canPrev}
              >
                ← Prev
              </Button>
              <p className="text-sm text-black">
                Week {weekIndex + 1} of {weeks.length} ·{" "}
                {format(parseISO(currentWeek.weekStartISO), "d LLL")} ·{" "}
                <span className="opacity-60">{weekMiles(currentWeek.workouts)} mi</span>
              </p>
              <Button
                variant="ghost"
                onClick={() => setWeekIndex((i) => i + 1)}
                disabled={!canNext}
              >
                Next →
              </Button>
            </div>

            <div className="rounded-md border border-neutral-200">
              {currentWeek.workouts.length === 0 ? (
                <p className="px-4 py-3 text-sm opacity-60">No workouts scheduled this week.</p>
              ) : (
                <ul className="flex flex-col">
                  {currentWeek.workouts.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 text-sm text-black/80 last:border-b-0"
                    >
                      <span
                        aria-hidden
                        className={
                          "h-2 w-2 shrink-0 rounded-full border border-black " +
                          (w.completed ? "bg-black" : "bg-transparent")
                        }
                      />
                      <span className="w-12 shrink-0 opacity-60">{w.weekday.slice(0, 3)}</span>
                      <span className="flex-1">{w.description}</span>
                      {w.pace && <span className="opacity-60">{w.pace}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={close}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

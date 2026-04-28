import { Fragment, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown } from "lucide-react";
import { usePlan } from "@/store/usePlan";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { useUiMode } from "@/store/useUiMode";
import { buildSchedule } from "@/lib/planGenerator";
import { generateLLMPlan, LLMPlanError } from "@/lib/planLLM";
import { todayISO } from "@/lib/date";
import { groupByWeek, findCurrentWeekIndex } from "@/lib/planWeeks";
import { WorkoutRow } from "@/components/sidebar/WorkoutRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ONE_HOUR_MS = 60 * 60 * 1000;

export function WorkoutSidebar() {
  const plan = usePlan((s) => s.plan);
  const setPlan = usePlan((s) => s.setPlan);
  const markComplete = usePlan((s) => s.markComplete);

  const apiKey = useSettings((s) => s.openRouterKey);
  const stravaConnected = useSettings((s) => !!s.stravaAccessToken);
  const lastSyncedAt = useStrava((s) => s.lastSyncedAt);
  const syncStrava = useStrava((s) => s.sync);
  const selectedDateISO = useUiMode((s) => s.selectedDateISO);
  const setSelectedDate = useUiMode((s) => s.setSelectedDate);

  const activeDateISO = selectedDateISO ?? todayISO();
  const weeks = useMemo(() => (plan ? groupByWeek(plan.schedule) : []), [plan]);
  const currentWeekIdx = useMemo(() => findCurrentWeekIndex(weeks, todayISO()), [weeks]);
  const planIdentity = plan?.target.createdAt ?? "";
  const [weekIndex, setWeekIndex] = useState(currentWeekIdx);
  useEffect(() => {
    setWeekIndex(currentWeekIdx);
  }, [planIdentity, currentWeekIdx]);
  const safeWeekIndex = weeks.length > 0 ? Math.min(weekIndex, weeks.length - 1) : 0;

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  const displayWeek = weeks[safeWeekIndex];
  const week = displayWeek?.workouts ?? [];
  const headingLabel = displayWeek
    ? `Workouts for ${format(parseISO(displayWeek.weekStartISO), "d MMM")}`
    : "Workouts";

  const canPersonalise = !!apiKey && stravaConnected;

  const onSync = async () => {
    if (!canPersonalise) {
      setPlan(plan.target, buildSchedule(plan.target));
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      const stale = !lastSyncedAt || Date.now() - new Date(lastSyncedAt).getTime() > ONE_HOUR_MS;
      if (stale) await syncStrava();
      const acts = useStrava.getState().activities;
      const { schedule, notes } = await generateLLMPlan({
        apiKey: apiKey!,
        target: plan.target,
        activities: acts,
      });
      setPlan(plan.target, schedule, notes);
    } catch (e) {
      const msg = e instanceof LLMPlanError ? e.message : e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="group flex items-center gap-1.5 text-lg font-normal text-black focus:outline-none">
              <span>{headingLabel}</span>
              <ChevronDown className="size-4 opacity-60 transition group-hover:opacity-100" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[60vh] min-w-[220px] overflow-y-auto"
            >
              {weeks.map((wk, i) => (
                <DropdownMenuItem
                  key={wk.weekStartISO}
                  onSelect={() => setWeekIndex(i)}
                  className={i === safeWeekIndex ? "font-medium" : ""}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>
                      {i === currentWeekIdx ? "This week" : `Week ${i + 1}`}
                      <span className="ml-2 opacity-60">
                        {format(parseISO(wk.weekStartISO), "d MMM")}
                      </span>
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => void onSync()}
            disabled={syncing}
            className="chrome text-sm text-black hover:underline disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="h-px w-full bg-[#d9d9d9]" />
      </div>
      <div className="flex flex-col gap-2">
        {week.length === 0 ? (
          <p className="text-sm opacity-60">No workouts scheduled this week.</p>
        ) : (
          week.map((w, i) => (
            <Fragment key={w.id}>
              {i > 0 && <div className="h-px w-full bg-[#d9d9d9]" />}
              <WorkoutRow
                workout={w}
                selected={w.dateISO === activeDateISO}
                onSelect={() => setSelectedDate(w.dateISO)}
                onToggleComplete={() => markComplete(w.id, !w.completed)}
              />
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}

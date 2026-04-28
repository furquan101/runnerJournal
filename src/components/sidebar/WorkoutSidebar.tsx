import { useMemo, useState } from "react";
import { usePlan } from "@/store/usePlan";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { useUiMode } from "@/store/useUiMode";
import { buildSchedule } from "@/lib/planGenerator";
import { generateLLMPlan, LLMPlanError } from "@/lib/planLLM";
import { currentWeekWorkouts, todayISO } from "@/lib/date";
import { WorkoutRow } from "@/components/sidebar/WorkoutRow";

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
  const week = useMemo(() => (plan ? currentWeekWorkouts(plan) : []), [plan]);

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-normal text-black">Workouts for the week</h2>
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
      <div className="flex flex-col">
        {week.length === 0 ? (
          <p className="text-sm opacity-60">No workouts scheduled this week.</p>
        ) : (
          week.map((w) => (
            <WorkoutRow
              key={w.id}
              workout={w}
              selected={w.dateISO === activeDateISO}
              onSelect={() => setSelectedDate(w.dateISO)}
              onToggleComplete={() => markComplete(w.id, !w.completed)}
            />
          ))
        )}
      </div>
    </div>
  );
}

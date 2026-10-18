import { useMemo } from "react";
import { usePlan } from "@/store/usePlan";
import { useStrava } from "@/store/useStrava";
import { isWorkoutDone } from "@/lib/runStats";

export function RunsCompleted() {
  const plan = usePlan((s) => s.plan);
  const activities = useStrava((s) => s.activities);
  const count = useMemo(
    () => (plan ? plan.schedule.filter((w) => isWorkoutDone(w, activities)).length : 0),
    [plan, activities],
  );
  return <span className="text-sm text-black">Runs completed: {count}</span>;
}

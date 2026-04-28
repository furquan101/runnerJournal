import { useMemo } from "react";
import { usePlan } from "@/store/usePlan";

export function RunsCompleted() {
  const plan = usePlan((s) => s.plan);
  const count = useMemo(
    () => (plan ? plan.schedule.filter((w) => w.completed).length : 0),
    [plan],
  );
  return <span className="text-sm text-black">Runs completed: {count}</span>;
}

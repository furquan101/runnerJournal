import { useUiMode } from "@/store/useUiMode";
import { usePlan } from "@/store/usePlan";

export function PlanOverviewLink() {
  const plan = usePlan((s) => s.plan);
  const open = useUiMode((s) => s.openPlanOverviewDialog);
  if (!plan) return null;
  return (
    <button
      type="button"
      onClick={open}
      className="text-sm text-black hover:underline focus:outline-none"
    >
      Plan overview
    </button>
  );
}

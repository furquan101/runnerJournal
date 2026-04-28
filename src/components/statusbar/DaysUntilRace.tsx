import { usePlan } from "@/store/usePlan";
import { daysUntil } from "@/lib/date";

export function DaysUntilRace() {
  const plan = usePlan((s) => s.plan);
  if (!plan) return null;
  const n = daysUntil(plan.target.raceDate);
  const name = plan.target.race.split(/\s+/)[0] || "race";
  return (
    <span className="text-sm text-black">
      Days until {name}: {n}
    </span>
  );
}

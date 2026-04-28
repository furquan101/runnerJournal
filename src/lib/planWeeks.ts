import { format, parseISO, startOfWeek } from "date-fns";
import type { Workout } from "@/types";

export type PlanWeek = { weekStartISO: string; workouts: Workout[] };

export function groupByWeek(schedule: Workout[]): PlanWeek[] {
  const buckets = new Map<string, Workout[]>();
  for (const w of schedule) {
    const wkStart = format(startOfWeek(parseISO(w.dateISO), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const list = buckets.get(wkStart);
    if (list) list.push(w);
    else buckets.set(wkStart, [w]);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([weekStartISO, workouts]) => ({
      weekStartISO,
      workouts: workouts.sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    }));
}

export function weekMiles(workouts: Workout[]): number {
  return workouts.reduce((s, w) => s + (w.distanceMiles ?? 0), 0);
}

export function findCurrentWeekIndex(weeks: PlanWeek[], todayISO: string): number {
  if (weeks.length === 0) return 0;
  const todayWkStart = format(startOfWeek(parseISO(todayISO), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const idx = weeks.findIndex((w) => w.weekStartISO === todayWkStart);
  if (idx >= 0) return idx;
  if (todayWkStart < weeks[0].weekStartISO) return 0;
  return weeks.length - 1;
}

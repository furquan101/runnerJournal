import { format, parseISO } from "date-fns";
import type { StravaActivity, Workout } from "@/types";

export function metersToMiles(m: number): number {
  return m / 1609.344;
}

export function paceMinPerMile(distanceMeters: number, movingTimeSec: number): number | null {
  const miles = metersToMiles(distanceMeters);
  if (miles <= 0 || movingTimeSec <= 0) return null;
  return movingTimeSec / 60 / miles;
}

export function fmtPace(minPerMile: number): string {
  let m = Math.floor(minPerMile);
  let s = Math.round((minPerMile - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}:${s.toString().padStart(2, "0")}/mi`;
}

export function activityDateISO(a: StravaActivity): string {
  return format(parseISO(a.startDateISO), "yyyy-MM-dd");
}

export function activitiesOnDate(activities: StravaActivity[], dateISO: string): StravaActivity[] {
  return activities.filter((a) => activityDateISO(a) === dateISO);
}

/** "8.2 mi · 9:41/mi · 148 bpm" */
export function describeActivity(a: StravaActivity): string {
  const parts = [`${metersToMiles(a.distanceMeters).toFixed(1)} mi`];
  const pace = paceMinPerMile(a.distanceMeters, a.movingTimeSec);
  if (pace !== null) parts.push(fmtPace(pace));
  if (a.averageHeartrate) parts.push(`${Math.round(a.averageHeartrate)} bpm`);
  return parts.join(" · ");
}

/** Carry completion over when a plan is regenerated, so re-syncing never loses progress. */
export function keepCompleted(previous: Workout[], next: Workout[]): Workout[] {
  const done = new Set(previous.filter((w) => w.completed).map((w) => w.dateISO));
  return next.map((w) => (done.has(w.dateISO) ? { ...w, completed: true } : w));
}

export function isWorkoutDone(w: Workout, activities: StravaActivity[]): boolean {
  return w.completed || (w.type !== "rest" && activitiesOnDate(activities, w.dateISO).length > 0);
}

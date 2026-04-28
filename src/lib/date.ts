import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import type { Plan, Workout } from "@/types";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function daysUntil(iso: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(iso), new Date()));
}

const ORDINAL_RX = /(\d+)/;
function withOrdinal(dateText: string): string {
  return dateText.replace(ORDINAL_RX, (n) => {
    const num = Number(n);
    const suffix = ordinalSuffix(num);
    return `${num}${suffix}`;
  });
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatEntryHeading(date: Date): string {
  const weekday = format(date, "EEEE");
  const day = format(date, "d");
  const month = format(date, "LLLL");
  return `${weekday} ${day}${ordinalSuffix(Number(day))} ${month}`;
}

void withOrdinal;

export function currentWeekWorkouts(plan: Plan, now: Date = new Date()): Workout[] {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return plan.schedule.filter((w) =>
    isWithinInterval(parseISO(w.dateISO), { start, end }),
  );
}

export function workoutForDate(plan: Plan | null, dateISO: string): Workout | undefined {
  if (!plan) return undefined;
  return plan.schedule.find((w) => w.dateISO === dateISO);
}

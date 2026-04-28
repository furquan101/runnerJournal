import { addDays, differenceInWeeks, format, parseISO, startOfWeek } from "date-fns";
import type { RaceTarget, Workout, WorkoutType } from "@/types";

// ISO weekday: Mon = 1 ... Sun = 7
const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1, Monday: 1,
  Tue: 2, Tuesday: 2,
  Wed: 3, Wednesday: 3,
  Thu: 4, Thursday: 4,
  Fri: 5, Friday: 5,
  Sat: 6, Saturday: 6,
  Sun: 7, Sunday: 7,
};

function dayIndex(label: string): number {
  return WEEKDAY_INDEX[label] ?? WEEKDAY_INDEX[label.slice(0, 3)] ?? 1;
}

const PACES: Record<WorkoutType, string | undefined> = {
  easy: "10 minute miles",
  long: "11 minute miles",
  tempo: "8:30 pace",
  intervals: "7:30 pace",
  rest: undefined,
};

function describe(type: WorkoutType, miles: number): string {
  if (type === "rest") return "rest day";
  if (type === "tempo") return `${miles} miles tempo`;
  if (type === "intervals") return `${miles} miles intervals`;
  if (type === "long") return `${miles} mile long run`;
  return `${miles} miles easy pace`;
}

export function buildSchedule(target: RaceTarget): Workout[] {
  const race = parseISO(target.raceDate);
  const startMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const totalWeeks = Math.max(1, differenceInWeeks(race, startMonday) + 1);

  const sortedDayIndexes = [...new Set(target.preferredDays.map(dayIndex))]
    .sort((a, b) => a - b)
    .slice(0, target.trainingFreqPerWeek);

  if (sortedDayIndexes.length === 0) sortedDayIndexes.push(2, 4, 6);

  const longRunDayIdx = sortedDayIndexes[sortedDayIndexes.length - 1];
  const tempoDayIdx =
    sortedDayIndexes.length > 1 ? sortedDayIndexes[Math.floor(sortedDayIndexes.length / 2)] : null;

  const workouts: Workout[] = [];

  for (let week = 0; week < totalWeeks; week++) {
    const weekProgress = totalWeeks <= 1 ? 1 : week / (totalWeeks - 1);

    for (const dayIdx of sortedDayIndexes) {
      const offset = dayIdx - 1; // Mon=0 ... Sun=6
      const date = addDays(startMonday, week * 7 + offset);
      if (date > race) continue;

      let type: WorkoutType;
      let distance: number;

      if (dayIdx === longRunDayIdx) {
        type = "long";
        distance = Math.round(8 + 10 * weekProgress);
      } else if (tempoDayIdx !== null && dayIdx === tempoDayIdx) {
        type = "tempo";
        distance = Math.round(4 + 3 * weekProgress);
      } else {
        type = "easy";
        distance = Math.round(4 + 4 * weekProgress);
      }

      const dateISO = format(date, "yyyy-MM-dd");
      workouts.push({
        id: dateISO,
        dateISO,
        weekday: format(date, "EEEE"),
        type,
        distanceMiles: distance,
        pace: PACES[type],
        description: describe(type, distance),
        completed: false,
      });
    }
  }

  return workouts;
}

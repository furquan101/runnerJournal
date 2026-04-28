import type { Page } from "@playwright/test";

export type SeededWorkout = {
  id: string;
  dateISO: string;
  weekday: string;
  type: "easy" | "long" | "tempo" | "intervals" | "rest";
  distanceMiles: number;
  pace?: string;
  description: string;
  completed: boolean;
};

export const SEED_PLAN = {
  target: {
    race: "Sydney Marathon",
    raceDate: "2026-08-30",
    goalTime: "3:45",
    trainingFreqPerWeek: 3,
    preferredDays: ["Mon", "Wed", "Sat"],
    createdAt: "2026-04-28T00:00:00.000Z",
  },
  schedule: [
    // Week 1 (Mon 2026-04-27)
    mk("w1-mon", "2026-04-27", "Monday", "easy", 4, "10:00", "4 mile easy run"),
    mk("w1-wed", "2026-04-29", "Wednesday", "tempo", 4, "8:30", "4 mile tempo"),
    mk("w1-sat", "2026-05-02", "Saturday", "long", 8, "11:00", "8 mile long run"),
    // Week 2 (Mon 2026-05-04)
    mk("w2-mon", "2026-05-04", "Monday", "easy", 4, "10:00", "4 mile easy run"),
    mk("w2-wed", "2026-05-06", "Wednesday", "tempo", 5, "8:30", "5 mile tempo"),
    mk("w2-sat", "2026-05-09", "Saturday", "long", 9, "11:00", "9 mile long run"),
    // Week 3 (Mon 2026-05-11)
    mk("w3-mon", "2026-05-11", "Monday", "easy", 4, "10:00", "4 mile easy run"),
    mk("w3-wed", "2026-05-13", "Wednesday", "tempo", 5, "8:30", "5 mile tempo"),
    mk("w3-sat", "2026-05-16", "Saturday", "long", 10, "11:00", "10 mile long run"),
  ] as SeededWorkout[],
};

function mk(
  id: string,
  dateISO: string,
  weekday: string,
  type: SeededWorkout["type"],
  distanceMiles: number,
  pace: string,
  description: string,
): SeededWorkout {
  return { id, dateISO, weekday, type, distanceMiles, pace, description, completed: false };
}

export async function seedPlan(page: Page) {
  await page.addInitScript((plan) => {
    window.localStorage.setItem(
      "rj.plan",
      JSON.stringify({ state: { plan }, version: 0 }),
    );
  }, SEED_PLAN);
}

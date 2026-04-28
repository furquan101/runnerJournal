import type { WorkoutType } from "@/types";

type WorkoutDetail = {
  effort: string;
  purpose: string;
};

const DETAILS: Record<WorkoutType, WorkoutDetail> = {
  easy: {
    effort:
      "Conversational, RPE 4–5. You should be able to chat in full sentences. If you can't, slow down.",
    purpose:
      "Builds your aerobic base and capillary density — the quiet foundation that lets every harder session land.",
  },
  long: {
    effort:
      "Steady and controlled, RPE 5–6. Aim for ~60–90 sec slower than goal marathon pace. Never push the pace.",
    purpose:
      "Trains your legs and gut for race-day distance, and teaches your body to burn fat efficiently over hours.",
  },
  tempo: {
    effort:
      "Comfortably hard, RPE 7–8. \"Just outside comfortable\" — the pace you could hold for an hour all-out.",
    purpose:
      "Lifts your lactate threshold so marathon pace feels sustainable for longer without your legs going under.",
  },
  intervals: {
    effort:
      "Hard but controlled, RPE 8–9. Strong reps with full recovery in between — faster than tempo, never sprinting.",
    purpose:
      "Develops VO2 max and running economy. Makes goal pace feel relatively easier when race day comes.",
  },
  rest: {
    effort: "No running today. Walk, stretch, or do something gentle.",
    purpose:
      "Adaptation happens during rest, not during training. Skipping it is the fastest route to injury.",
  },
};

export function workoutDetail(type: WorkoutType): WorkoutDetail {
  return DETAILS[type];
}

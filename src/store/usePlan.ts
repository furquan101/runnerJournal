import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Plan, RaceTarget, Workout } from "@/types";

type PlanState = {
  plan: Plan | null;
  setPlan: (target: RaceTarget, schedule: Workout[], notes?: string) => void;
  markComplete: (workoutId: string, completed: boolean) => void;
  clearPlan: () => void;
};

export const usePlan = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      setPlan: (target, schedule, notes) =>
        set({ plan: { target, schedule, notes: notes && notes.trim() ? notes : undefined } }),
      markComplete: (workoutId, completed) =>
        set((state) => {
          if (!state.plan) return state;
          return {
            plan: {
              ...state.plan,
              schedule: state.plan.schedule.map((w) =>
                w.id === workoutId ? { ...w, completed } : w,
              ),
            },
          };
        }),
      clearPlan: () => set({ plan: null }),
    }),
    { name: "rj.plan" },
  ),
);

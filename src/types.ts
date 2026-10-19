export type RaceTarget = {
  race: string;
  raceDate: string;
  goalTime: string;
  trainingFreqPerWeek: number;
  preferredDays: string[];
  createdAt: string;
};

export type WorkoutType = "easy" | "long" | "tempo" | "intervals" | "rest";

export type Workout = {
  id: string;
  dateISO: string;
  weekday: string;
  type: WorkoutType;
  distanceMiles: number;
  pace?: string;
  description: string;
  completed: boolean;
};

export type Plan = {
  target: RaceTarget;
  schedule: Workout[];
  notes?: string;
};

export type StravaActivity = {
  id: number;
  startDateISO: string;
  distanceMeters: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  name: string;
  type: string;
  averageHeartrate?: number;
  averageSpeed?: number;
  totalElevationGainM?: number;
  summaryPolyline?: string;
};

export type RunSplit = {
  mile: number;
  distanceM: number;
  movingSec: number;
  averageHeartrate?: number;
  elevationDiffM?: number;
};

export type RunDetail = {
  id: number;
  polyline: string;
  splits: RunSplit[];
};

export type JournalEntry = {
  dateISO: string;
  workoutId?: string;
  body: string;
  updatedAt: string;
};

export type OuraDay = {
  dateISO: string;
  sleepScore?: number;
  readinessScore?: number;
  sleepHours?: number;
  hrvMs?: number;
  restingHr?: number;
};

export type SidebarMode = "workouts" | "journal" | "coach";

export type FontFamily = "Rubik" | "Lato" | "Times New Roman" | "System Sans";

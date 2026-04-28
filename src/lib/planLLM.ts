import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { RaceTarget, StravaActivity, Workout, WorkoutType } from "@/types";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4-6";

export class LLMPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMPlanError";
  }
}

const VALID_TYPES: WorkoutType[] = ["easy", "long", "tempo", "intervals", "rest"];

function metersToMiles(m: number): number {
  return m / 1609.344;
}

function paceMinPerMile(distanceMeters: number, movingTimeSec: number): number | null {
  const miles = metersToMiles(distanceMeters);
  if (miles <= 0 || movingTimeSec <= 0) return null;
  return movingTimeSec / 60 / miles;
}

function fmtPace(minPerMile: number): string {
  const m = Math.floor(minPerMile);
  const s = Math.round((minPerMile - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}/mi`;
}

export function summarizeStravaForPrompt(activities: StravaActivity[]): string {
  if (activities.length === 0) return "No recent Strava activity available.";

  const sorted = [...activities].sort((a, b) =>
    a.startDateISO < b.startDateISO ? 1 : -1,
  );
  const today = new Date();
  const weeks: { label: string; miles: number; runs: number }[] = [];
  for (let w = 0; w < 8; w++) {
    const end = addDays(today, -7 * w);
    const startMs = addDays(end, -7).getTime();
    const endMs = end.getTime();
    const inWeek = sorted.filter((a) => {
      const t = parseISO(a.startDateISO).getTime();
      return t >= startMs && t < endMs;
    });
    const miles = inWeek.reduce((s, a) => s + metersToMiles(a.distanceMeters), 0);
    weeks.push({
      label: w === 0 ? "this week" : `${w}w ago`,
      miles: Math.round(miles * 10) / 10,
      runs: inWeek.length,
    });
  }

  const last30 = sorted.filter(
    (a) => parseISO(a.startDateISO).getTime() >= addDays(today, -30).getTime(),
  );

  const easyRuns = last30.filter((a) => metersToMiles(a.distanceMeters) <= 8);
  const easyPaces = easyRuns
    .map((a) => paceMinPerMile(a.distanceMeters, a.movingTimeSec))
    .filter((p): p is number => p !== null);
  const avgEasyPace =
    easyPaces.length > 0 ? easyPaces.reduce((s, p) => s + p, 0) / easyPaces.length : null;

  const longRuns = sorted.filter((a) => metersToMiles(a.distanceMeters) >= 8).slice(0, 4);
  const longestRecent =
    longRuns.length > 0 ? Math.max(...longRuns.map((a) => metersToMiles(a.distanceMeters))) : 0;
  const longRunPaces = longRuns
    .map((a) => paceMinPerMile(a.distanceMeters, a.movingTimeSec))
    .filter((p): p is number => p !== null);
  const avgLongPace =
    longRunPaces.length > 0
      ? longRunPaces.reduce((s, p) => s + p, 0) / longRunPaces.length
      : null;

  const lines: string[] = [];
  lines.push("Weekly mileage (most recent first):");
  for (const w of weeks) {
    lines.push(`  ${w.label}: ${w.miles} mi across ${w.runs} run${w.runs === 1 ? "" : "s"}`);
  }
  lines.push("");
  lines.push(`Longest run in last 8 weeks: ${longestRecent.toFixed(1)} mi`);
  if (avgEasyPace !== null) lines.push(`Average easy-day pace (≤8 mi): ${fmtPace(avgEasyPace)}`);
  if (avgLongPace !== null) lines.push(`Average long-run pace: ${fmtPace(avgLongPace)}`);

  return lines.join("\n");
}

type LLMDay = {
  dateISO?: string;
  type?: string;
  distanceMiles?: number;
  pace?: string;
  description?: string;
};
type LLMWeek = { weekStartISO?: string; days?: LLMDay[] };
type LLMResponse = { notes?: string; weeks?: LLMWeek[] };

function normalizeType(t: unknown): WorkoutType {
  const s = String(t ?? "").toLowerCase().trim();
  if ((VALID_TYPES as string[]).includes(s)) return s as WorkoutType;
  if (s.includes("interval") || s.includes("speed") || s.includes("track")) return "intervals";
  if (s.includes("tempo") || s.includes("threshold")) return "tempo";
  if (s.includes("long")) return "long";
  if (s.includes("rest") || s.includes("off")) return "rest";
  return "easy";
}

function flatten(parsed: LLMResponse): { schedule: Workout[]; notes: string } {
  const schedule: Workout[] = [];
  const seen = new Set<string>();
  for (const week of parsed.weeks ?? []) {
    for (const day of week.days ?? []) {
      if (!day.dateISO) continue;
      const dateISO = day.dateISO;
      if (seen.has(dateISO)) continue;
      seen.add(dateISO);
      const date = parseISO(dateISO);
      if (Number.isNaN(date.getTime())) continue;
      const type = normalizeType(day.type);
      const distance = Math.max(0, Math.round(Number(day.distanceMiles ?? 0)));
      const description =
        typeof day.description === "string" && day.description.trim().length > 0
          ? day.description.trim()
          : type === "rest"
            ? "rest day"
            : `${distance} mi ${type}`;
      schedule.push({
        id: dateISO,
        dateISO,
        weekday: format(date, "EEEE"),
        type,
        distanceMiles: distance,
        pace: typeof day.pace === "string" && day.pace.trim().length > 0 ? day.pace.trim() : undefined,
        description,
        completed: false,
      });
    }
  }
  schedule.sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));
  return { schedule, notes: parsed.notes ?? "" };
}

function systemPrompt(): string {
  return [
    "You are an experienced marathon coach building a personalised training plan for a runner.",
    "You will receive the runner's race target and a summary of their recent Strava activity.",
    "Build a week-by-week plan from this Monday through the race date.",
    "Schedule workouts only on the runner's preferred days, honouring their target weekly frequency.",
    "Calibrate distance and pace to their current Strava history; do not increase weekly mileage by more than ~10% week over week.",
    "Include a taper in the final 2-3 weeks before the race.",
    'Each workout type MUST be one of: "easy", "long", "tempo", "intervals", "rest".',
    "Pace should be in min/mile (e.g. \"9:30/mi\") when relevant; omit for rest.",
    "Return ONLY a JSON object matching this schema:",
    `{
  "notes": "1-3 sentence rationale referencing the runner's current fitness",
  "weeks": [
    {
      "weekStartISO": "YYYY-MM-DD (Monday)",
      "days": [
        { "dateISO": "YYYY-MM-DD", "type": "easy|long|tempo|intervals|rest", "distanceMiles": number, "pace": "9:30/mi", "description": "short human description" }
      ]
    }
  ]
}`,
  ].join(" ");
}

function userPrompt(target: RaceTarget, activities: StravaActivity[]): string {
  const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  return [
    `Race: ${target.race}`,
    `Race date: ${target.raceDate}`,
    `Goal time: ${target.goalTime}`,
    `Training frequency: ${target.trainingFreqPerWeek} days/week`,
    `Preferred days: ${target.preferredDays.join(", ")}`,
    `Plan should start week of: ${monday}`,
    "",
    "Recent Strava activity:",
    summarizeStravaForPrompt(activities),
  ].join("\n");
}

export async function generateLLMPlan(opts: {
  apiKey: string;
  target: RaceTarget;
  activities: StravaActivity[];
  signal?: AbortSignal;
}): Promise<{ schedule: Workout[]; notes: string }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Runner Journal",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(opts.target, opts.activities) },
      ],
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new LLMPlanError(`OpenRouter error ${res.status}: ${text || res.statusText}`);
  }

  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new LLMPlanError("Empty response from model.");

  let parsed: LLMResponse;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new LLMPlanError("Model returned invalid JSON.");
  }

  const { schedule, notes } = flatten(parsed);
  if (schedule.length === 0) throw new LLMPlanError("Model returned no workouts.");
  return { schedule, notes };
}

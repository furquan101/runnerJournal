import { addDays, format, parseISO } from "date-fns";
import type { JournalEntry, OuraDay, Plan, StravaActivity } from "@/types";
import { summarizeStravaForPrompt } from "@/lib/planLLM";
import { activitiesOnDate, describeActivity } from "@/lib/runStats";
import { describeOuraDay } from "@/lib/oura";

export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
export const COACH_MODEL = "anthropic/claude-sonnet-5.5";
export const COACH_NAME = "Coach Bennet";
export const CHECKIN_LABELS = ["How it's going", "Doing well", "Next session"] as const;

export class MissingApiKeyError extends Error {
  constructor() {
    super("Missing OpenRouter API key");
    this.name = "MissingApiKeyError";
  }
}

function systemPrompt(plan: Plan | null): string {
  const ctx = plan
    ? `The runner is training for ${plan.target.race} on ${plan.target.raceDate}, goal time ${plan.target.goalTime}, training ${plan.target.trainingFreqPerWeek} days a week (${plan.target.preferredDays.join(", ")}).`
    : "The runner has not set a race goal yet.";
  return [
    `You are ${COACH_NAME}, a marathon coach who has read every entry in a runner's training journal, alongside their real Strava runs and Oura sleep and recovery data.`,
    ctx,
    "Training has good weeks and bad weeks; treat both as useful information, never as failure.",
    "Ground everything in the data: compare what was planned with what they actually ran, and connect what they wrote to pace, distance, sleep, HRV and readiness. Look for patterns across the whole journal, not just this week.",
    "Be honest about whether the goal time looks realistic for their current fitness. If it doesn't, say so kindly and give a realistic range to aim for now.",
    "Your voice: warm, direct and motivating, like a club coach who believes in them. Short sentences. Celebrate the effort and reframe the bad days.",
    `For the weekly check-in, write exactly three short paragraphs, each starting with its label: "${CHECKIN_LABELS[0]}:" (an honest read of how training is going), "${CHECKIN_LABELS[1]}:" (what they're doing well and should keep doing), "${CHECKIN_LABELS[2]}:" (the one thing to look out for in their next session, made concrete).`,
    "When they ask a question, answer it directly in 2–3 short paragraphs with no labels, bullet lists or headings.",
  ].join(" ");
}

function dayLine(
  dateISO: string,
  plan: Plan | null,
  entry: JournalEntry | undefined,
  activities: StravaActivity[],
  oura: OuraDay | undefined,
): string {
  const planned = plan?.schedule.find((w) => w.dateISO === dateISO);
  const ran = activitiesOnDate(activities, dateISO);
  const lines = [`## ${format(parseISO(dateISO), "EEE d MMM")}`];
  if (planned) lines.push(`Planned: ${planned.description}${planned.pace ? ` at ${planned.pace}` : ""}`);
  if (ran.length > 0) lines.push(`Strava: ${ran.map(describeActivity).join("; ")}`);
  else if (planned && planned.type !== "rest") lines.push("Strava: no run recorded");
  if (oura && describeOuraDay(oura)) lines.push(`Oura (night before): ${describeOuraDay(oura)}`);
  if (entry?.body.trim()) lines.push(`Journal: ${entry.body.trim()}`);
  return lines.join("\n");
}

function userPrompt(
  entries: JournalEntry[],
  plan: Plan | null,
  activities: StravaActivity[],
  ouraDays: Record<string, OuraDay>,
  userMessage: string | null,
): string {
  const byDate = new Map(entries.map((e) => [e.dateISO, e]));
  const today = new Date();
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const dateISO = format(addDays(today, -i), "yyyy-MM-dd");
    const hasSomething =
      byDate.get(dateISO)?.body.trim() ||
      plan?.schedule.some((w) => w.dateISO === dateISO) ||
      activitiesOnDate(activities, dateISO).length > 0;
    if (hasSomething) days.push(dayLine(dateISO, plan, byDate.get(dateISO), activities, ouraDays[dateISO]));
  }

  // Everything older, condensed, so the coach can see patterns across the whole block.
  const cutoff = format(addDays(today, -13), "yyyy-MM-dd");
  const older = entries
    .filter((e) => e.dateISO < cutoff && e.body.trim())
    .slice(-400)
    .map((e) => {
      const run = activitiesOnDate(activities, e.dateISO)[0];
      const sleep = ouraDays[e.dateISO]?.sleepScore;
      const meta = [run ? describeActivity(run) : null, sleep ? `sleep ${sleep}` : null].filter(Boolean).join(", ");
      return `- ${e.dateISO}${meta ? ` (${meta})` : ""}: ${e.body.trim().slice(0, 240)}`;
    });

  const sections = [
    "My last two weeks, planned vs. actual:",
    days.length > 0 ? days.join("\n\n") : "(nothing logged yet)",
  ];
  if (older.length > 0) sections.push(`The rest of my journal (${older.length} earlier entries):`, older.join("\n"));
  if (activities.length > 0) {
    sections.push("Longer-term Strava summary:", summarizeStravaForPrompt(activities));
  }
  sections.push(
    userMessage
      ? `The runner asks: ${userMessage}`
      : "Give me my weekly check-in: how my training is going, what I'm doing well, and what to look out for in my next session.",
  );
  return sections.join("\n\n");
}

export async function streamCoachInsights(opts: {
  apiKey: string | null;
  recentEntries: JournalEntry[];
  plan: Plan | null;
  activities: StravaActivity[];
  ouraDays: Record<string, OuraDay>;
  userMessage?: string | null;
  signal?: AbortSignal;
  onToken: (chunk: string) => void;
}): Promise<void> {
  if (!opts.apiKey) throw new MissingApiKeyError();

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Runner Journal",
    },
    body: JSON.stringify({
      model: COACH_MODEL,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt(opts.plan) },
        {
          role: "user",
          content: userPrompt(opts.recentEntries, opts.plan, opts.activities, opts.ouraDays, opts.userMessage ?? null),
        },
      ],
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) opts.onToken(delta);
      } catch {
        // ignore malformed SSE
      }
    }
  }
}

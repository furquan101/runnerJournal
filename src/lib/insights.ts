import type { JournalEntry, Plan, StravaActivity } from "@/types";
import { isWorkoutDone, metersToMiles } from "@/lib/runStats";

export function localInsight(
  entries: JournalEntry[],
  plan: Plan | null,
  activities: StravaActivity[] = [],
): string {
  const recent = entries
    .filter((e) => e.body.trim().length > 0 || e.feel)
    .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
    .slice(0, 14);

  if (recent.length === 0) {
    return "Once you start journaling, your coach will read the last week of entries and reflect a pattern back to you. Add an OpenRouter API key in Connections to talk to Claude directly.";
  }

  const streak = computeStreak(recent.map((e) => e.dateISO));
  const top = topWord(recent.map((e) => e.body).join(" "));
  const completed = plan ? plan.schedule.filter((w) => isWorkoutDone(w, activities)).length : 0;
  const tough = recent.filter((e) => e.feel === "tough").length;
  const good = recent.filter((e) => e.feel === "good").length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekMiles = activities
    .filter((a) => new Date(a.startDateISO).getTime() >= weekAgo)
    .reduce((sum, a) => sum + metersToMiles(a.distanceMeters), 0);

  const lines: string[] = [];
  lines.push(
    `You've journaled ${recent.length} time${recent.length === 1 ? "" : "s"} recently${
      streak > 1 ? `, with a ${streak}-day streak` : ""
    }.`,
  );
  if (good > 0 && tough > 0)
    lines.push(`${good} felt good and ${tough} felt tough. Both are part of it.`);
  else if (tough > 0) lines.push(`${tough} felt tough. That's part of it, not a verdict.`);
  else if (good > 0) lines.push(`${good} felt good. Notice what those days had in common.`);
  if (activities.length > 0) lines.push(`Strava has you at ${weekMiles.toFixed(1)} miles this week.`);
  if (top) lines.push(`The word that keeps showing up: "${top}".`);
  if (plan) lines.push(`You've ticked off ${completed} run${completed === 1 ? "" : "s"} so far.`);
  lines.push("Add an OpenRouter API key in Connections to hear from your coach.");
  return lines.join(" ");
}

function computeStreak(dateISOs: string[]): number {
  const set = new Set(dateISOs);
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!set.has(iso)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const STOP = new Set(
  "the a an of and or but if then else for to in on at by from with as is was are were be been being i you he she we they it this that there here today tomorrow yesterday my your our their have has had not no yes do did does also just like".split(
    /\s+/,
  ),
);

function topWord(text: string): string | null {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^a-z']+/)) {
    if (raw.length < 4 || STOP.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 1;
  for (const [w, n] of counts) {
    if (n > bestN) {
      best = w;
      bestN = n;
    }
  }
  return best;
}

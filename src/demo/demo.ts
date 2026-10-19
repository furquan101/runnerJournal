// Demo mode (VITE_DEMO=true): sample Strava runs, journal entries and a plan, plus pre-written
// coach replies. Strava and OpenRouter requests are answered locally, so the app's real code
// paths run without anyone's accounts or keys.
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { set as idbSet, get as idbGet } from "idb-keyval";
import type { JournalEntry } from "@/types";

export const isDemo = import.meta.env.VITE_DEMO === "true";

const SEEDED_KEY = "rj.demo.seeded";
const iso = (d: Date) => format(d, "yyyy-MM-dd");

type RawRun = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_heartrate: number;
};

function demoDates() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  // The "story week" is this week on a Sunday, otherwise last week, so it's always complete.
  const storyMonday = today.getDay() === 0 ? thisMonday : addDays(thisMonday, -7);
  return { today, thisMonday, storyMonday };
}

function demoRuns(): RawRun[] {
  const { today, storyMonday } = demoDates();
  const runs: RawRun[] = [];
  let id = 1000;
  const mk = (date: Date, miles: number, paceMin: number, hr: number, name: string) => {
    if (date > today) return;
    const d = new Date(date);
    d.setHours(7, 5, 0, 0);
    runs.push({
      id: id++,
      name,
      type: "Run",
      sport_type: "Run",
      start_date: d.toISOString(),
      distance: Math.round(miles * 1609.344),
      moving_time: Math.round(miles * paceMin * 60),
      elapsed_time: Math.round(miles * paceMin * 60) + 90,
      average_heartrate: hr,
    });
  };
  for (let w = 8; w >= 1; w--) {
    const mon = addDays(storyMonday, -7 * w);
    const prog = (8 - w) / 7;
    mk(addDays(mon, 1), 4.5 + prog, 9.8 - prog * 0.1, 140, "Easy miles");
    mk(addDays(mon, 3), 5 + prog, 8.8 - prog * 0.12, 162, "Tempo");
    if (w % 3 !== 0) mk(addDays(mon, 5), 4 + prog, 9.9, 138, "Shakeout");
    mk(addDays(mon, 6), 9 + prog * 3.5, 9.95 - prog * 0.1, 152, "Long run");
  }
  // Story week: good Tuesday, okay Thursday, skipped Saturday, heavy Sunday long run.
  mk(addDays(storyMonday, 1), 5.1, 9.7, 139, "Easy 5");
  mk(addDays(storyMonday, 3), 6.0, 8.68, 166, "Tempo Thursday");
  mk(addDays(storyMonday, 6), 12.2, 9.97, 156, "Sunday long run");
  // Days after the story week (when it was last week).
  const after = addDays(storyMonday, 7);
  mk(addDays(after, 1), 5.0, 9.75, 141, "Easy 5");
  mk(addDays(after, 3), 6.2, 8.62, 164, "Tempo");
  mk(addDays(after, 5), 4.2, 9.9, 137, "Shakeout");
  return runs.sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
}

function demoEntries(): JournalEntry[] {
  const { today, storyMonday } = demoDates();
  const now = new Date().toISOString();
  const list: { d: number; feel: JournalEntry["feel"]; body: string }[] = [
    { d: 1, feel: "good", body: "Easy 5 felt smooth. Slept properly for once and it showed." },
    { d: 3, feel: "okay", body: "Tempo was meant to be 8:30s. Held 8:40s. Long day at work and my legs knew it." },
    { d: 5, feel: "tough", body: "Skipped today. Knee niggle and zero motivation. Annoyed at myself, but resting felt right." },
  ];
  // Leave today's page blank for the visitor; otherwise include the Sunday long run.
  if (iso(addDays(storyMonday, 6)) !== iso(today)) {
    list.push({ d: 6, feel: "tough", body: "12 miles. Legs heavy from mile 8 and the pace drifted. Still finished, and the knee held up." });
  }
  return list.map((e) => {
    const dateISO = iso(addDays(storyMonday, e.d));
    return { dateISO, workoutId: dateISO, body: e.body, feel: e.feel, updatedAt: now };
  });
}

// ---------- plan generation (what the model returns)

const pick = (text: string, rx: RegExp, fallback: string) => text.match(rx)?.[1] ?? fallback;

const RACE_MILES = (race: string) => (/half/i.test(race) ? 13.1 : /10k/i.test(race) ? 6.2 : 26.2);
// Realistic finish range for the demo runner's fitness, by distance (minutes).
const REALISTIC: Record<string, [number, number]> = { "26.2": [220, 225], "13.1": [105, 108], "6.2": [48, 50] };

function parseGoalMinutes(goal: string): number | null {
  const parts = goal.trim().split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] >= 10 ? parts[0] + parts[1] / 60 : parts[0] * 60 + parts[1];
  return null;
}
const fmtTime = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, "0")}` : `${Math.round(min)} min`);
const fmtPace = (min: number) => `${Math.floor(min)}:${String(Math.floor((min % 1) * 60)).padStart(2, "0")}/mi`;

function goalCheck(race: string, goal: string) {
  const miles = RACE_MILES(race);
  const [lo, hi] = REALISTIC[String(miles)];
  const goalMin = parseGoalMinutes(goal);
  const goalPace = goalMin ? goalMin / miles : null;
  return { miles, lo, hi, goalMin, goalPace, stretch: goalMin !== null && goalMin < lo };
}

function demoPlanJson(user: string) {
  const race = pick(user, /Race: (.+)/, "Marathon");
  const goal = pick(user, /Goal time: (.+)/, "");
  const raceDate = parseISO(pick(user, /Race date: (\S+)/, iso(addDays(new Date(), 56))));
  const days = pick(user, /Preferred days: (.+)/, "Tue, Thu, Sat, Sun").split(/,\s*/);
  const idx: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  // The demo runner started a week ago, so the plan begins last Monday.
  const start = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), -7);
  const totalWeeks = Math.max(1, Math.ceil((raceDate.getTime() - start.getTime()) / (7 * 864e5)));
  const { miles, lo, hi, goalPace, stretch } = goalCheck(race, goal);
  const peakLong = miles > 20 ? 20 : miles > 10 ? 12 : 7;

  const weeks = [];
  for (let w = 0; w < totalWeeks; w++) {
    const taper = w >= totalWeeks - 2;
    const build = Math.min(1, w / Math.max(1, totalWeeks - 3));
    const longMi = taper ? Math.round(peakLong / 2) : Math.round(Math.min(peakLong, 10 + (peakLong - 10) * build));
    const wk = { weekStartISO: iso(addDays(start, 7 * w)), days: [] as object[] };
    for (const d of days) {
      const date = addDays(start, 7 * w + (idx[d.slice(0, 3)] ?? 1));
      if (date > raceDate) continue;
      const k = idx[d.slice(0, 3)];
      if (iso(date) === iso(raceDate)) {
        wk.days.push({ dateISO: iso(date), type: "long", distanceMiles: Math.round(miles), pace: fmtPace((lo + hi) / 2 / miles), description: `Race day: ${race}` });
      } else if (k === 6) {
        wk.days.push({ dateISO: iso(date), type: "long", distanceMiles: longMi, pace: "9:50/mi", description: `${longMi} mile long run` });
      } else if (k === 3) {
        wk.days.push({ dateISO: iso(date), type: "tempo", distanceMiles: taper ? 5 : 6, pace: "8:35/mi", description: `${taper ? 5 : 6} miles with ${taper ? 3 : 4} at tempo` });
      } else {
        wk.days.push({ dateISO: iso(date), type: "easy", distanceMiles: taper ? 4 : 5, pace: "9:45/mi", description: `${taper ? 4 : 5} miles easy` });
      }
    }
    weeks.push(wk);
  }

  const range = `${fmtTime(lo)}–${fmtTime(hi)}`;
  const notes = stretch
    ? `Your Strava shows about 24 miles a week, with long runs up to 13 miles at 9:50/mi. ${goal} needs ${fmtPace(goalPace!)}, which is faster than your current tempo pace, so aim for ${range} this time and build to a ${peakLong}-mile long run before a two-week taper.`
    : `Your Strava shows about 24 miles a week, with long runs up to 13 miles at 9:50/mi. ${goal || "Your goal"} fits your current fitness: build to a ${peakLong}-mile long run, keep easy days easy, and taper for the final two weeks.`;
  return { notes, weeks };
}

// ---------- coach replies

function coachReply(user: string): string {
  const asked = (user.split("The runner asks:")[1] || "").trim().toLowerCase();
  const race = pick(user, /training for (.+?) on \d/, "");
  const goal = pick(user, /goal time ([^,]+),/, "");

  if (!asked) {
    return "Honest week. Three of four runs done, and resting that knee on Saturday was the right call.\n\nYour best runs follow good sleep: Tuesday felt smooth, Thursday's tempo slipped after a long work day.\n\nNext run: keep it truly easy, slower than 10-minute miles.";
  }
  if (asked.includes("realistic")) {
    const { lo, hi, goalPace, stretch } = goalCheck(race, goal);
    const range = `${fmtTime(lo)}–${fmtTime(hi)}`;
    return stretch
      ? `Not yet. ${goal} needs ${fmtPace(goalPace!)}, and your tempo runs sit around 8:40/mi.\n\nBased on your last eight weeks, ${range} is realistic for ${race.replace(/ \(.*\)$/, "")}. Go through halfway at ${fmtPace((lo + hi) / 2 / RACE_MILES(race))}.\n\n${goal} is very reachable next season if you keep building.`
      : `Yes. Your long runs and tempo pace put ${goal} within reach.\n\nThe risk isn't fitness, it's the knee. Protect it: easy days easy, and don't chase pace on tired legs.\n\nIf the next three weeks go well, ${fmtTime(lo - 5)} could be on the table.`;
  }
  if (asked.includes("next run")) {
    return "Tuesday: 5 miles easy, slower than 10-minute miles. Conversational the whole way.\n\nYour Thursday tempos have been drifting after long work days, so bank an easy one first and get an early night.\n\nIf the knee talks to you, stop at 3 miles. That's still a win.";
  }
  if (asked.includes("hard")) {
    return "Look at your tough days: Thursday after a long work day, Saturday with a sore knee, Sunday's long run after both.\n\nIt's rarely the run itself. It's sleep, stress and stacked fatigue showing up in your legs.\n\nThe smooth runs in your journal all follow a proper night's sleep. Start there.";
  }
  return "This demo has pre-written answers for the suggested questions.\n\nRun Runner Journal with your own OpenRouter key and Strava, and your coach will answer anything using your real runs.";
}

// ---------- fetch mock

function sse(text: string, signal?: AbortSignal | null): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const tokens = text.match(/\S+\s*|\s+/g) || [];
  return new ReadableStream({
    async start(ctl) {
      await new Promise((r) => setTimeout(r, 300));
      for (const t of tokens) {
        if (signal?.aborted) return ctl.close();
        ctl.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`));
        await new Promise((r) => setTimeout(r, 18));
      }
      ctl.enqueue(enc.encode("data: [DONE]\n\n"));
      ctl.close();
    },
  });
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

function installFetchMock() {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("strava.com/api/v3/athlete/activities")) {
      await new Promise((r) => setTimeout(r, 300));
      return json(demoRuns());
    }
    if (url.includes("strava.com/oauth/token")) {
      return json({ access_token: "demo", refresh_token: "demo", expires_at: 4102444800, athlete: { id: 1 } });
    }
    if (url.includes("openrouter.ai")) {
      const body = JSON.parse(String(init.body));
      const user: string = body.messages.find((m: { role: string }) => m.role === "user").content;
      if (!body.stream) {
        await new Promise((r) => setTimeout(r, 900));
        return json({ choices: [{ message: { content: JSON.stringify(demoPlanJson(user)) } }] });
      }
      const system: string = body.messages.find((m: { role: string }) => m.role === "system").content;
      return new Response(sse(coachReply(`${system}\n${user}`), init.signal), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    }
    return realFetch(input, init);
  };
}

// ---------- seeding

async function seed() {
  if (await idbGet(SEEDED_KEY)) return;
  const { generateLLMPlan } = await import("@/lib/planLLM");
  const { fetchActivities } = await import("@/lib/strava");

  localStorage.setItem(
    "rj.settings",
    JSON.stringify({
      state: {
        fontFamily: "Rubik",
        fontSize: 20,
        openRouterKey: "demo",
        stravaClientId: "demo",
        stravaClientSecret: "demo",
        stravaAccessToken: "demo",
        stravaRefreshToken: "demo",
        stravaExpiresAt: 4102444800,
        stravaAthleteId: 1,
      },
      version: 0,
    }),
  );

  const activities = await fetchActivities({ accessToken: "demo" });
  await idbSet("rj.strava.activities", activities);
  await idbSet("rj.strava.lastSyncedAt", new Date().toISOString());
  for (const e of demoEntries()) await idbSet(`entry:${e.dateISO}`, e);

  if (!new URLSearchParams(location.search).has("onboarding")) {
    const raceDate = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7 * 7 + 6);
    const target = {
      race: "Valencia Marathon",
      raceDate: iso(raceDate),
      goalTime: "3:30",
      trainingFreqPerWeek: 4,
      preferredDays: ["Tue", "Thu", "Sat", "Sun"],
      createdAt: new Date().toISOString(),
    };
    const { schedule, notes } = await generateLLMPlan({ apiKey: "demo", target, activities });
    localStorage.setItem("rj.plan", JSON.stringify({ state: { plan: { target, schedule, notes } }, version: 0 }));
  }
  await idbSet(SEEDED_KEY, true);
}

export async function installDemo() {
  installFetchMock();
  await seed();
}

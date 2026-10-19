// Demo mode (VITE_DEMO=true): sample Strava runs, journal entries and a plan, plus pre-written
// coach replies. Strava and OpenRouter requests are answered locally, so the app's real code
// paths run without anyone's accounts or keys.
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { set as idbSet, get as idbGet, clear as idbClear } from "idb-keyval";
import { buildHistory, type History } from "@/demo/history";

export const isDemo = import.meta.env.VITE_DEMO === "true";

// Bump when the sample data changes so returning visitors are reseeded.
const SEEDED_KEY = "rj.demo.seeded.v2";
const iso = (d: Date) => format(d, "yyyy-MM-dd");

function demoDates() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  // The "story week" is this week on a Sunday, otherwise last week, so it's always complete.
  const storyMonday = today.getDay() === 0 ? thisMonday : addDays(thisMonday, -7);
  return { today, storyMonday };
}

let cached: History | null = null;
function history(): History {
  if (!cached) {
    const { today, storyMonday } = demoDates();
    cached = buildHistory(today, storyMonday);
  }
  return cached;
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
// Rounded to the nearest 5 seconds, the way a coach would say it.
const fmtPace = (min: number) => {
  const sec = Math.round((min * 60) / 5) * 5;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}/mi`;
};

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
  const recent = history().runs.filter((r) => Date.now() - new Date(r.start_date).getTime() < 56 * 864e5);
  const weekly = Math.round(recent.reduce((t, r) => t + r.distance / 1609.344, 0) / 8);
  const longest = Math.round(Math.max(...recent.map((r) => r.distance / 1609.344)));
  const summary = `Your Strava shows about ${weekly} miles a week over the last two months, with long runs up to ${longest} miles.`;
  const notes = stretch
    ? `${summary} ${goal} needs ${fmtPace(goalPace!)}, which is faster than your current tempo pace, so aim for ${range} this time and build to a ${peakLong}-mile long run before a two-week taper.`
    : `${summary} ${goal || "Your goal"} fits your current fitness: build to a ${peakLong}-mile long run, keep easy days easy, and taper for the final two weeks.`;
  return { notes, weeks };
}

// ---------- coach replies

function coachReply(user: string, entryCount: number): string {
  const asked = (user.split("The runner asks:")[1] || "").trim().toLowerCase();
  const race = pick(user, /training for (.+?) on \d/, "");
  const goal = pick(user, /goal time ([^,]+),/, "");

  const st = history().stats;
  if (!asked) {
    const raceISO = pick(user, / on (\d{4}-\d{2}-\d{2})/, "");
    const weeksOut = raceISO ? Math.round((parseISO(raceISO).getTime() - Date.now()) / (7 * 864e5)) : 7;
    return `Big week, and an honest one. ${st.storyRuns} runs, ${st.storyMiles} miles, and you finished it with 12 on tired legs. That's what marathon training really looks like.\n\nThursday's tempo didn't slip because you're losing fitness. You slept 5 hours 40 and Oura had you at 61. Saturday you listened to the knee instead of your ego. That's not weakness, that's experience. Across all ${entryCount} entries, your good runs follow good nights, every time.\n\n${weeksOut} weeks to ${race.replace(/ \(.*\)$/, "") || "race day"}. Stack a few more weeks like this one and you'll stand on that start line ready. Early night Monday, easy Tuesday. Let's go.`;
  }
  if (asked.includes("realistic")) {
    const { lo, hi, goalPace, stretch } = goalCheck(race, goal);
    const range = `${fmtTime(lo)}–${fmtTime(hi)}`;
    return stretch
      ? `Not yet. ${goal} needs ${fmtPace(goalPace!)}, and your tempo runs sit around ${fmtPace(st.lastTempo)}. Over ${st.months} months they've come down from ${fmtPace(st.firstTempo)}, so you're getting there.\n\nBased on your recent training, ${range} is realistic for ${race.replace(/ \(.*\)$/, "")}. Go through halfway at ${fmtPace((lo + hi) / 2 / RACE_MILES(race))}.\n\n${goal} is very reachable next season if you keep building.`
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
      const params = new URL(url).searchParams;
      const perPage = Number(params.get("per_page") ?? 30);
      const page = Number(params.get("page") ?? 1);
      return json(history().runs.slice((page - 1) * perPage, page * perPage));
    }
    if (url.includes("api.ouraring.com/v2/usercollection/")) {
      const days = history().oura;
      const kind = url.split("/usercollection/")[1].split("?")[0];
      const data =
        kind === "daily_sleep"
          ? days.map((d) => ({ day: d.dateISO, score: d.sleepScore }))
          : kind === "daily_readiness"
            ? days.map((d) => ({ day: d.dateISO, score: d.readinessScore }))
            : days.map((d) => ({
                day: d.dateISO,
                type: "long_sleep",
                total_sleep_duration: Math.round((d.sleepHours ?? 0) * 3600),
                average_hrv: d.hrvMs,
                lowest_heart_rate: d.restingHr,
              }));
      return json({ data, next_token: null });
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
      const { useEntries } = await import("@/store/useEntries");
      const count = Object.values(useEntries.getState().entries).filter((e) => e.body.trim()).length;
      return new Response(sse(coachReply(`${system}\n${user}`, count), init.signal), {
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
  await idbClear();
  localStorage.clear();

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
        ouraClientId: "demo",
        ouraAccessToken: "demo",
        ouraExpiresAt: 4102444800,
      },
      version: 0,
    }),
  );

  // Imported only now: these modules create the persisted stores, which must see the settings above.
  const { generateLLMPlan } = await import("@/lib/planLLM");
  const { fetchActivities } = await import("@/lib/strava");
  const { fetchOuraDays } = await import("@/lib/oura");

  const synced = new Date().toISOString();
  const activities = await fetchActivities({ accessToken: "demo" });
  await idbSet("rj.strava.activities", activities);
  await idbSet("rj.strava.lastSyncedAt", synced);
  await idbSet("rj.oura.days", await fetchOuraDays());
  await idbSet("rj.oura.lastSyncedAt", synced);
  for (const e of history().entries) await idbSet(`entry:${e.dateISO}`, e);

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

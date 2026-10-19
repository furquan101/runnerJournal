// A year of sample training for the demo: Strava runs, Oura nights and journal entries.
// Deterministic (seeded) so every visitor sees the same runner, generated relative to today.
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import type { JournalEntry, OuraDay } from "@/types";


const iso = (d: Date) => format(d, "yyyy-MM-dd");

export type RawRun = {
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

export type History = {
  runs: RawRun[];
  oura: OuraDay[];
  entries: JournalEntry[];
  stats: { entries: number; goodSleepEasyPace: number; poorSleepEasyPace: number; kneeMentions: number; firstTempo: number; lastTempo: number; months: number };
};

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Kind = "easy" | "tempo" | "intervals" | "long" | "shakeout" | "race";

// ---------- writing

const LINES: Record<Kind, string[]> = {
  easy: [
    "Easy {mi} before work. Kept it conversational the whole way.",
    "{mi} miles easy. Nothing special, which is sort of the point.",
    "Easy {mi} round the park. Podcast on, brain off.",
    "Recovery {mi} miles. Made myself go slower than felt natural.",
    "{mi} miles easy along the canal.",
    "Easy {mi}. Felt like a chore for the first mile, then fine.",
    "Lunchtime {mi}. Good to get out of the house.",
  ],
  tempo: [
    "Tempo day. {mi} with the middle miles at threshold, averaged {pace}.",
    "Threshold session. Held {pace} for the tempo block.",
    "Tempo, {mi} miles. The last rep was ugly but I held on.",
    "{mi} with tempo in the middle. Splits were all over the place.",
  ],
  intervals: [
    "Track night. 6 x 800 with 90s jog. Last two were properly hard.",
    "Intervals: 5 x 1k. Hit the times, didn't enjoy a single one.",
    "Hill reps, 8 of them. Calves are going to talk to me tomorrow.",
    "Fartlek, {mi} miles. Lamppost to lamppost surges, actually fun.",
  ],
  long: [
    "Long run, {mi} miles. Gel every 40 minutes this time.",
    "{mi} mile long run. Second half quicker than the first for once.",
    "Long one, {mi} miles. Ran out of water at mile 9, lesson learned.",
    "{mi} miles with the club. Chatted the whole way, flew by.",
    "Sunday {mi}. Last three miles were a grind.",
  ],
  shakeout: [
    "Short shakeout, {mi} miles. Legs feel ready for tomorrow.",
    "{mi} easy shakeout. Just loosening up.",
  ],
  race: [],
};

const GOOD = [
  "Legs felt light.",
  "One of those runs where everything clicks.",
  "Slept properly last night and it showed.",
  "Felt strong. Didn't look at my watch much.",
  "Smooth. Could have kept going.",
  "Breathing easy, heart rate low. Fitness is coming.",
];
const HEAVY = [
  "Legs heavy from the start.",
  "Barely slept, and my legs knew it.",
  "Felt flat. Heart rate higher than it should be at that pace.",
  "Dragged myself out the door. Glad I went, but it wasn't pretty.",
  "Tired. Long week at work catching up with me.",
  "Everything felt harder than it should.",
];
const SEASON: Record<number, string[]> = {
  0: ["Freezing, gloves on.", "Dark the whole run.", "Icy paths, took it careful."],
  1: ["Sideways rain.", "Cold but bright.", "Wind on the way back was brutal."],
  2: ["First run in shorts this year.", "Clocks went forward, light mornings again."],
  3: ["Lovely spring morning.", "Blossom everywhere in the park."],
  4: ["Warm already at 7am.", "Hay fever kicking in."],
  5: ["Humid. Sweated through everything.", "Hot, went out early to beat it."],
  6: ["Heatwave. Carried water.", "27 degrees by 8am, ridiculous."],
  7: ["Muggy.", "Summer holiday mode, slower than usual."],
  8: ["Perfect running weather.", "First crisp morning of autumn."],
  9: ["Leaves everywhere, slippy.", "Cold again, back in long sleeves."],
  10: ["Foggy and grey.", "Wet leaves and dark mornings."],
  11: ["Christmas lights on the route.", "Cold and dark, the usual."],
};
const REFLECT = [
  "Trusting the process.",
  "Small wins.",
  "Need to sort my sleep out.",
  "Consistency over everything.",
  "Reminding myself why I signed up.",
  "",
  "",
  "",
];
const REST = [
  "Rest day. Foam rolled and went to bed early.",
  "Day off. Legs needed it.",
  "No run today. Walked to work instead.",
  "Rest day. Couldn't stop thinking about running.",
  "Rest. Stretched for 20 minutes, felt good.",
  "Rest day. Ate well, slept well, legs thank me.",
  "No run. Long day at work, yoga in the evening instead.",
  "Day off. Read about marathon fuelling for an hour.",
  "Rest day. Felt restless all day, which is probably a good sign.",
  "Rest. Twenty minutes of core and an early night.",
  "Day off. Watched race videos and got far too excited.",
  "Rest day. Walked the dog the long way round.",
  "No run today. Legs a bit stiff, so a long bath and stretching.",
];

// ---------- phases (by month): long-run miles and specific stories

function longMiles(month: number, r: () => number) {
  const base = [8, 10, 11, 12, 8, 10, 11, 13, 15, 17, 12, 10][month];
  return Math.round(base + r() * 2);
}

export function buildHistory(today: Date, storyMonday: Date): History {
  const r = rng(20260105);
  const start = startOfWeek(addDays(today, -Math.min(364, Math.max(150, differenceInCalendarDays(today, parseISO("2026-01-05"))))), { weekStartsOn: 1 });
  const totalDays = differenceInCalendarDays(today, start);
  const runs: RawRun[] = [];
  const oura: OuraDay[] = [];
  const entries: JournalEntry[] = [];
  const now = new Date().toISOString();
  let id = 5000;
  const spring = (() => {
    // Spring half: second Sunday of April in the year the history starts.
    const d = new Date(start.getFullYear(), 3, 1, 12);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    return iso(addDays(d, 7));
  })();
  const storyStart = iso(storyMonday);
  const storyEnd = iso(addDays(storyMonday, 6));

  // Avoid the same line turning up in nearby entries.
  const recentLines: string[] = [];
  const fresh = (list: string[]) => {
    let line = list[Math.floor(r() * list.length)];
    for (let k = 0; k < 6 && line && recentLines.includes(line); k++) line = list[Math.floor(r() * list.length)];
    if (line) recentLines.push(line);
    if (recentLines.length > 12) recentLines.shift();
    return line;
  };

  const easySamples: { sleep: number; pace: number }[] = [];
  const tempoByMonth = new Map<string, number[]>();

  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(start, i);
    const d = iso(date);
    const dow = (date.getDay() + 6) % 7; // Mon=0
    const month = date.getMonth();
    const progress = i / Math.max(1, totalDays);
    const inStory = d >= storyStart && d <= storyEnd;

    // --- Oura: the night before this day
    let sleep = Math.round(76 + (r() - 0.5) * 22 - (dow === 2 || dow === 3 ? 5 : 0));
    if (inStory) sleep = [74, 76, 78, 61, 70, 84, 72][dow];
    sleep = Math.max(52, Math.min(92, sleep));
    const sleepHours = Math.round((5.1 + ((sleep - 52) / 40) * 3.2 + (r() - 0.5) * 0.4) * 10) / 10;
    const hrv = Math.round(34 + (sleep - 60) * 0.55 + (r() - 0.5) * 8 + progress * 6);
    const readiness = Math.max(50, Math.min(95, Math.round(sleep + (r() - 0.5) * 10)));
    oura.push({ dateISO: d, sleepScore: sleep, sleepHours, hrvMs: hrv, readinessScore: readiness, restingHr: Math.round(56 - progress * 5 + (75 - sleep) * 0.15) });

    // --- what was run today
    const juneKnee = month === 5 && date.getDate() >= 8 && date.getDate() <= 15;
    const febFlu = month === 1 && date.getDate() >= 9 && date.getDate() <= 14;
    const holiday = month === 7 && date.getDate() <= 9;
    let kind: Kind | null = null;
    if (d === spring) kind = "race";
    else if (dow === 1) kind = "easy";
    else if (dow === 3) kind = i % 14 < 7 ? "tempo" : "intervals";
    else if (dow === 5) kind = r() < 0.6 ? "shakeout" : null;
    else if (dow === 6) kind = "long";
    else if (dow === 2 && r() < (month >= 7 ? 0.85 : 0.6)) kind = "easy";
    else if (dow === 4 && month >= 8 && r() < 0.35) kind = "shakeout";
    if (juneKnee || febFlu || (holiday && kind !== "long")) kind = null;
    if (!inStory && kind && kind !== "race" && r() < 0.05) kind = null;
    if (inStory) kind = ([null, "easy", null, "tempo", "shakeout", "easy", "long"] as (Kind | null)[])[dow] ?? null;

    let miles = 0;
    let pace = 0;
    if (kind) {
      const sleepDrag = (75 - sleep) * 0.022;
      if (kind === "race") { miles = 13.1; pace = 8.55; }
      else if (kind === "easy") { miles = Math.round((4.5 + r() * 2 + progress * 1.5) * 10) / 10; pace = 10.15 - progress * 0.45 + sleepDrag + (r() - 0.5) * 0.15; }
      else if (kind === "shakeout") { miles = Math.round((3 + r()) * 10) / 10; pace = 10.3 - progress * 0.4 + sleepDrag; }
      else if (kind === "tempo") { miles = Math.round((5 + r() * 1.5) * 10) / 10; pace = 8.95 - progress * 0.27 + sleepDrag * 0.8 + (r() - 0.5) * 0.1; }
      else if (kind === "intervals") { miles = Math.round((5 + r()) * 10) / 10; pace = 8.7 - progress * 0.25 + sleepDrag * 0.5; }
      else { miles = longMiles(month, r) + 0.1 * Math.round(r() * 4); pace = 10.25 - progress * 0.3 + sleepDrag * 0.8; }
      if (inStory) [miles, pace] = ({ easy: [5.1, 9.7], tempo: [6.0, 8.68], shakeout: [3.1, 10.6], long: [12.2, 9.97] } as Record<string, [number, number]>)[kind] ?? [miles, pace];

      const start = new Date(date);
      start.setHours(kind === "long" || kind === "race" ? 8 : 6, 40 + Math.floor(r() * 30), 0, 0);
      const names: Record<Kind, string> = { easy: "Morning Run", shakeout: "Morning Run", tempo: "Tempo Thursday", intervals: "Track session", long: "Sunday long run", race: "Spring Half Marathon" };
      const hr = Math.round((kind === "tempo" || kind === "intervals" || kind === "race" ? 163 : 142) + (75 - sleep) * 0.25);
      runs.push({
        id: id++,
        name: kind === "easy" && r() < 0.3 ? "Easy miles" : names[kind],
        type: "Run",
        sport_type: "Run",
        start_date: start.toISOString(),
        distance: Math.round(miles * 1609.344),
        moving_time: Math.round(miles * pace * 60),
        elapsed_time: Math.round(miles * pace * 60) + 120,
        average_heartrate: hr,
      });
      if (kind === "easy") easySamples.push({ sleep, pace });
      if (kind === "tempo") {
        const key = format(date, "yyyy-MM");
        tempoByMonth.set(key, [...(tempoByMonth.get(key) ?? []), pace]);
      }
    }

    // --- the journal entry
    let body: string | null;
    if (inStory) {
      body = ({
        0: "Rest day. Foam rolled and planned the week.",
        1: "Easy 5 before work. Nothing special, which is sort of the point.",
        2: "Rest day. Legs feel good. Early night.",
        3: "Felt like my legs were filled with cement. Tempo was meant to be 8:30s and I couldn't get under 8:45. Five hours of sleep and a long day at work. Just one of those days.",
        4: "Ate a whole Tony's chocolate bar before my run and felt so sick. Eating the chocolate felt good in the moment, but running after, I felt like death. Lesson learned.",
        5: "Felt amazing today. Easy 5 along the canal and I could have kept going forever. Slept 8 hours and it showed. Days like this are why I do it.",
        6: "Didn't want to go out today. Still went. 12 miles in the rain and every mile felt like a small win. Mental barriers are being pushed.",
      } as Record<number, string>)[dow] ?? null;
    } else if (kind === "race") {
      body = "Spring half done: 1:52:04. Went out too fast, paid for it from mile 9, but a PB is a PB. Learned more today than in any training run.";
    } else if (juneKnee) {
      body = ["Outside of my knee is sore after Sunday. Not running today.", "Knee still grumbling. Rest, ice, physio exercises.", "Physio says IT band. Strengthening work, no running for a few days.", "Knee feels better. Tempted to run, not going to."][Math.floor(r() * 4)];
    } else if (febFlu) {
      body = ["Full of cold. No running.", "Still ill. Frustrating watching the week disappear.", "Feeling human again. Not running yet."][Math.floor(r() * 3)];
    } else if (kind) {
      {
        const fmtP = `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}`;
        const opener = fresh(LINES[kind]).replace("{mi}", String(Math.round(miles))).replace("{pace}", `${fmtP}/mi`);
        const feel = sleep >= 80 ? fresh(GOOD) : sleep <= 68 ? fresh(HEAVY) : r() < 0.5 ? "" : fresh(r() < 0.5 ? GOOD : HEAVY);
        const season = r() < 0.45 ? fresh(SEASON[month]) : "";
        const knee = month >= 5 && month <= 6 && r() < 0.12 ? "Knee quiet today." : "";
        body = [opener, season, feel, knee, fresh(REFLECT)].filter(Boolean).join(" ");
      }
    } else {
      body = fresh(REST);
    }
    if (d === iso(today)) body = null; // today's page is the visitor's to write
    if (body) entries.push({ dateISO: d, workoutId: d, body, updatedAt: now });
  }

  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
  const months = [...tempoByMonth.keys()].sort();
  return {
    runs: runs.reverse(),
    oura,
    entries,
    stats: {
      entries: entries.length,
      goodSleepEasyPace: avg(easySamples.filter((s) => s.sleep >= 80).map((s) => s.pace)),
      poorSleepEasyPace: avg(easySamples.filter((s) => s.sleep < 70).map((s) => s.pace)),
      kneeMentions: entries.filter((e) => /knee/i.test(e.body)).length,
      firstTempo: avg(tempoByMonth.get(months[0]) ?? []),
      lastTempo: avg(tempoByMonth.get(months[months.length - 1]) ?? []),
      months: Math.round(totalDays / 30),
    },
  };
}

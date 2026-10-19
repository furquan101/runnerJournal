import { fmtPace } from "@/lib/runStats";
import type { RunSplit } from "@/types";

const paceOf = (s: RunSplit) => s.movingSec / 60 / (s.distanceM / 1609.344);
const avg = (xs: number[]) => xs.reduce((t, x) => t + x, 0) / Math.max(1, xs.length);

/** A few plain-English observations from a run's per-mile splits. */
export function runInsights(splits: RunSplit[]): string[] {
  const full = splits.filter((s) => s.distanceM > 1400); // ignore the partial last mile
  if (full.length < 4) return [];
  const out: string[] = [];

  // Where did the pace go? Find the mile after which the rest averaged noticeably slower.
  const paces = full.map(paceOf);
  // The mile where "before" and "after" differ most; only call it a drift if it's 15s/mi or more.
  let drift = -1;
  let biggest = 0.25;
  for (let i = 3; i < paces.length - 1; i++) {
    const gap = avg(paces.slice(i)) - avg(paces.slice(0, i));
    if (gap > biggest) {
      biggest = gap;
      drift = i;
    }
  }
  if (drift > 0) {
    out.push(
      `Miles 1–${drift} at ${fmtPace(avg(paces.slice(0, drift)))}, then ${fmtPace(avg(paces.slice(drift)))} for the last ${paces.length - drift}`,
    );
  } else {
    const spread = Math.max(...paces) - Math.min(...paces);
    out.push(`Even pacing: every mile within ${Math.round(spread * 60)}s of each other`);
  }

  const hrs = full.map((s) => s.averageHeartrate ?? 0);
  if (hrs.every((h) => h > 0)) {
    const cut = drift > 0 ? drift : Math.floor(hrs.length * 0.66);
    const rise = Math.round(avg(hrs.slice(cut)) - avg(hrs.slice(0, cut)));
    if (rise >= 5) out.push(`Heart rate climbed ${rise} bpm over the last ${hrs.length - cut} miles`);
    else out.push(`Heart rate held steady around ${Math.round(avg(hrs))} bpm`);
  }

  const fastest = paces.indexOf(Math.min(...paces));
  out.push(`Fastest mile: mile ${fastest + 1} at ${fmtPace(paces[fastest])}`);
  return out;
}
